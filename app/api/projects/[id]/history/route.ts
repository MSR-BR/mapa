import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeProjectRoute } from "@/modules/projects/auth";
import { pendingAdvisorReview } from "@/modules/research-workflow/advisor-review";
import { advisorReviewStepSchema, elementVersionSchema, workflowUnitSchema } from "@/modules/research-workflow/schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import { saveVersionedWorkflow } from "@/modules/research-workflow/save-versioned-workflow";
import { UNIT_TYPES, applyWorkflowUnit, workflowUnit } from "@/modules/research-workflow/versioned-context";
import { workflowForView } from "@/modules/research-workflow/workflow-navigation";

const metadataColumns = "id, project_id, revision, source_revision, step, kind, actor_id, created_at, reason";
const privateHeaders = { "Cache-Control": "private, no-store" };
const cursorSchema = z.object({ date: z.string().datetime({ offset: true }), id: z.string().uuid() });

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await authorizeProjectRoute({ projectId: id, request, capability: "related_read" });
  if (!access.ok) return access.response;
  const url = new URL(request.url);
  const versionId = url.searchParams.get("version");
  const supabase = access.value.supabase;
  if (versionId) {
    if (!z.string().uuid().safeParse(versionId).success) return NextResponse.json({ error: "Versão inválida." }, { status: 400 });
    const { data, error } = await supabase.from("workflow_versions").select("*").eq("project_id", id).eq("id", versionId).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Versão não encontrada." }, { status: 404 });
    const workflow = await loadResearchWorkflow(supabase, access.value.project.owner_id, id);
    const step = advisorReviewStepSchema.safeParse(data.step);
    return NextResponse.json({ version: data, current: workflow && step.success ? workflowUnit(workflow.content, step.data) : null }, { headers: privateHeaders });
  }
  let query = supabase.from("workflow_versions").select(metadataColumns).eq("project_id", id)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(21);
  const requestedStep = url.searchParams.get("step");
  if (requestedStep) {
    const step = advisorReviewStepSchema.safeParse(requestedStep);
    if (!step.success) return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
    query = query.eq("step", step.data);
  }
  const cursorText = url.searchParams.get("cursor");
  if (cursorText) {
    let cursor;
    try { cursor = cursorSchema.parse(JSON.parse(cursorText)); } catch { return NextResponse.json({ error: "Página inválida." }, { status: 400 }); }
    query = query.or(`created_at.lt.${cursor.date},and(created_at.eq.${cursor.date},id.lt.${cursor.id})`);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Não foi possível consultar o histórico." }, { status: 503 });
  const rows = data.slice(0, 20);
  const last = rows.at(-1);
  return NextResponse.json({ versions: rows, nextCursor: data.length > 20 && last ? JSON.stringify({ date: last.created_at, id: last.id }) : null }, { headers: privateHeaders });
}

const mutationSchema = z.object({
  action: z.enum(["restore", "accept_proposal", "discard_proposal", "discard_draft", "rebase_draft"]),
  revision: z.number().int().positive(), step: advisorReviewStepSchema,
  versionId: z.string().uuid().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
  const access = await authorizeProjectRoute({ projectId: id, request, mutation: true });
  if (!access.ok) return access.response;
  const { supabase, userId } = access.value;
  const base = await loadResearchWorkflow(supabase, userId, id);
  if (!base || base.revision !== parsed.data.revision) return NextResponse.json({ error: "O projeto mudou. Recarregue antes de restaurar." }, { status: 409 });
  if (pendingAdvisorReview(base.content)) return NextResponse.json({ error: "A versão enviada está congelada até a revisão do orientador." }, { status: 409 });
  const { action, step, versionId } = parsed.data;
  let content = base.content;
  if (action === "rebase_draft") {
    const draft = content.stepDrafts[step];
    if (!draft) return NextResponse.json({ error: "Rascunho não encontrado." }, { status: 404 });
    content = { ...content, stepDrafts: { ...content.stepDrafts, [step]: { ...draft, baseRevision: base.sourceRevision } } };
  } else if (action === "discard_proposal" || action === "discard_draft") {
    const key = action === "discard_proposal" ? "stepProposals" : "stepDrafts";
    if (!content[key][step]) return NextResponse.json({ workflow: workflowForView(base, step) }, { headers: privateHeaders });
    const remaining = { ...content[key] }; delete remaining[step];
    content = { ...content, [key]: remaining };
  } else {
    if (action === "accept_proposal" && content.stepProposals[step]?.baseRevision !== base.sourceRevision) return NextResponse.json({ error: "Esta proposta usa um contexto anterior. Gere uma nova proposta ou aproveite suas ideias editando o rascunho." }, { status: 409 });
    let unit = content.stepProposals[step]?.unit;
    if (action === "restore") {
      if (!versionId) return NextResponse.json({ error: "Selecione uma versão." }, { status: 400 });
      const { data, error } = await supabase.from("workflow_versions").select("step, kind, unit").eq("project_id", id).eq("id", versionId).maybeSingle();
      if (error || !data) return NextResponse.json({ error: "Versão não encontrada." }, { status: 404 });
      if (data.kind === "legacy") {
        const legacy = elementVersionSchema.safeParse(data.unit);
        if (!legacy.success || !UNIT_TYPES[step].includes(legacy.data.type)) return NextResponse.json({ error: "Esta versão pertence a outra etapa." }, { status: 400 });
        // The legacy schema never stored relationships. Retain current relationships explicitly.
        const current = workflowUnit(content, step);
        unit = { ...current, elements: [...current.elements.filter((item) => item.id !== legacy.data.id), legacy.data] };
      } else {
        if (data.step !== step) return NextResponse.json({ error: "Esta versão pertence a outra etapa." }, { status: 400 });
        const historical = workflowUnitSchema.safeParse(data.unit);
        if (!historical.success) return NextResponse.json({ error: "Esta versão não pôde ser recuperada." }, { status: 422 });
        unit = historical.data;
      }
    }
    if (!unit) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
    content = applyWorkflowUnit(content, step, unit);
  }
  const saved = await saveVersionedWorkflow(supabase, { base, content, step, action, sourceRevision: base.sourceRevision, state: base.state, stableState: base.stableState });
  return saved ? NextResponse.json({ workflow: saved, message: action.startsWith("discard") ? "Alteração descartada." : "Versão recuperada como rascunho. Revise e confirme para atualizar o contexto." }, { headers: privateHeaders })
    : NextResponse.json({ error: "Não foi possível salvar. O projeto pode ter sido alterado em outra aba." }, { status: 409 });
}
