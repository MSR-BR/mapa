import { NextResponse } from "next/server";
import { z } from "zod";

import { reviewFinalMapCoherence } from "@/modules/generation/gemini";
import { toJson } from "@/modules/generation/types";
import { loadUserProfile } from "@/modules/profile/storage";
import { loadProjectAdvisorEmail } from "@/modules/projects/advisor";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import {
  buildFinalMap,
  canCompleteFinalMap,
  finalMapSummary,
} from "@/modules/research-workflow/final-map";
import { pendingAdvisorReview, withAdvisorReviewRequest } from "@/modules/research-workflow/advisor-review";
import {
  researchWorkflowContentSchema,
  type CoherenceFinding,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type ValidatedElement,
} from "@/modules/research-workflow/schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";

export const maxDuration = 120;

const requestSchema = z.object({
  action: z.enum(["complete", "go_to", "review"]),
  revision: z.number().int().positive(),
  targetStep: z.enum(["development", "discovery", "general", "literature", "methodology", "problem", "specifics"]).optional(),
});

type TargetStep = NonNullable<z.infer<typeof requestSchema>["targetStep"]>;

function archive(elements: ValidatedElement[], history: ResearchWorkflowContent["elementVersions"]) {
  const now = new Date().toISOString();
  return elements.reduce((versions, item) => [...versions, { ...item, archivedAt: now, elementId: item.id }], history);
}

function finalMapFinding(message: string, workflow: ResearchWorkflow): CoherenceFinding {
  return {
    elementIds: [workflow.projectId],
    id: crypto.randomUUID(),
    message,
    resolution: "A revisão determinística foi preservada; tente revisar com IA novamente mais tarde.",
    rule: "IA: fallback seguro",
    severity: "warning",
  };
}

function replaceFinalMapFindings(content: ResearchWorkflowContent, findings: CoherenceFinding[]) {
  return researchWorkflowContentSchema.parse({
    ...content,
    coherenceFindings: [
      ...content.coherenceFindings.filter((finding) => !finding.rule.startsWith("Change 014") && !finding.rule.startsWith("IA:")),
      ...findings,
    ].slice(-40),
  });
}

function invalidateFinalMap(content: ResearchWorkflowContent) {
  const finalMap = content.elements.find((item) => item.type === "final_map");
  if (!finalMap || finalMap.status === "stale") return content;
  return researchWorkflowContentSchema.parse({
    ...content,
    elementVersions: archive([finalMap], content.elementVersions),
    elements: content.elements.map((item) => item.id === finalMap.id
      ? { ...item, approvedContent: null, revision: item.revision + 1, status: "stale", updatedBy: "system" }
      : item),
  });
}

function upsertFinalMap(content: ResearchWorkflowContent, summary: string, sourceRevision: number) {
  const existing = content.elements.find((item) => item.type === "final_map");
  const next: ValidatedElement = {
    approvedContent: summary,
    id: existing?.id ?? crypto.randomUUID(),
    proposedContent: summary,
    referenceIds: [],
    revision: existing ? existing.revision + 1 : 1,
    sourceRevision,
    status: "validated",
    studentJustification: existing?.studentJustification ?? null,
    type: "final_map",
    updatedBy: "system",
  };
  return researchWorkflowContentSchema.parse({
    ...content,
    activeStep: null,
    elementVersions: existing ? archive([existing], content.elementVersions) : content.elementVersions,
    elements: existing
      ? content.elements.map((item) => item.id === existing.id ? next : item)
      : [...content.elements, next],
    traceLinks: [
      ...content.traceLinks.filter((link) => link.toElementId !== next.id),
      ...content.elements
        .filter((item) => ["development_topic", "general_objective", "literature_topic", "methodology_mapping", "problem_statement", "research_title", "specific_objective"].includes(item.type))
        .map((item) => ({
          fromElementId: item.id,
          rule: "Elemento consolidado no mapa final.",
          sourceRevision,
          toElementId: next.id,
        })),
    ],
  });
}

function targetState(targetStep: TargetStep) {
  const states: Record<TargetStep, Pick<ResearchWorkflow, "state" | "stableState"> & { activeStep: ResearchWorkflowContent["activeStep"] }> = {
    development: { activeStep: "development_topics", stableState: "validating_development", state: "validating_development" },
    discovery: { activeStep: null, stableState: "choosing_problem", state: "choosing_problem" },
    general: { activeStep: "general_objective", stableState: "validating_general_objective", state: "validating_general_objective" },
    literature: { activeStep: "literature_topics", stableState: "validating_literature", state: "validating_literature" },
    methodology: { activeStep: "methodology_matrix", stableState: "validating_methodology", state: "validating_methodology" },
    problem: { activeStep: "problem_statement", stableState: "choosing_problem", state: "choosing_problem" },
    specifics: { activeStep: "specific_objectives", stableState: "validating_specific_objectives", state: "validating_specific_objectives" },
  };
  return states[targetStep];
}

async function saveWorkflow(
  workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  state: ResearchWorkflow["state"],
  stableState: ResearchWorkflow["stableState"],
  sourceRevision: number,
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  ownerId: string,
) {
  const revision = workflow.revision + 1;
  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("research_workflows")
    .update({ content: toJson(content), revision, source_revision: sourceRevision, stable_state: stableState, state, updated_at: updatedAt })
    .eq("project_id", workflow.projectId)
    .eq("owner_id", ownerId)
    .eq("revision", workflow.revision)
    .select("updated_at")
    .maybeSingle();
  return error || !data ? null : { ...workflow, content, revision, sourceRevision, stableState, state, updatedAt: data.updated_at };
}

async function aiFindingsWithFallback(workflow: ResearchWorkflow) {
  const finalMap = buildFinalMap(workflow);
  try {
    return await reviewFinalMapCoherence(finalMap);
  } catch {
    return [finalMapFinding("A revisão complementar por IA não ficou disponível agora.", workflow)];
  }
}

export async function POST(request: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) return NextResponse.json({ error: "Operação inválida." }, { status: 400 });

  const { supabase, userId } = await requireAuthenticatedUser();
  const profile = await loadUserProfile(supabase, userId);
  const isAdvisorOwner = profile.activeRole === "advisor";
  const workflow = await loadResearchWorkflow(supabase, userId, id);
  if (!workflow || workflow.revision !== parsed.data.revision) {
    return NextResponse.json({ error: "O mapa foi alterado em outra aba. Recarregue para continuar." }, { status: 409 });
  }
  if (!isAdvisorOwner && parsed.data.action === "complete" && pendingAdvisorReview(workflow.content)) {
    return NextResponse.json({ error: "O mapa já foi validado pelo estudante e está aguardando validação do orientador." }, { status: 409 });
  }
  if (!["completed", "reviewing_map"].includes(workflow.state)) {
    return NextResponse.json({ error: "O mapa final ainda não pode ser revisado." }, { status: 409 });
  }

  if (parsed.data.action === "go_to") {
    if (!parsed.data.targetStep) return NextResponse.json({ error: "Etapa de destino inválida." }, { status: 400 });
    const target = targetState(parsed.data.targetStep);
    const content = invalidateFinalMap(researchWorkflowContentSchema.parse({
      ...workflow.content,
      activeStep: target.activeStep,
    }));
    const saved = await saveWorkflow(workflow, content, target.state, target.stableState, workflow.sourceRevision, supabase, userId);
    return saved ? NextResponse.json({ workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  const deterministicMap = buildFinalMap(workflow);
  const aiFindings = await aiFindingsWithFallback(workflow);
  let content = replaceFinalMapFindings(workflow.content, [...deterministicMap.findings, ...aiFindings]);
  let nextWorkflow = { ...workflow, content };
  const finalMap = buildFinalMap(nextWorkflow);

  if (parsed.data.action === "review") {
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase, userId);
    return saved ? NextResponse.json({ workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  if (!canCompleteFinalMap(finalMap)) {
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase, userId);
    return saved
      ? NextResponse.json({ errors: finalMap.findings.filter((finding) => finding.severity === "blocking").map((finding) => finding.message), workflow: saved }, { status: 422 })
      : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  const sourceRevision = workflow.sourceRevision + 1;
  content = upsertFinalMap(content, finalMapSummary(finalMap), sourceRevision);
  nextWorkflow = { ...workflow, content };
  content = replaceFinalMapFindings(content, buildFinalMap(nextWorkflow).findings.filter((finding) => finding.severity !== "blocking"));
  const advisorEmail = await loadProjectAdvisorEmail(supabase, userId, id);
  const shouldWaitForAdvisor = !isAdvisorOwner && Boolean(advisorEmail);
  if (shouldWaitForAdvisor) {
    content = withAdvisorReviewRequest(
      researchWorkflowContentSchema.parse({ ...content, activeStep: null }),
      {
        advisorEmail,
        sourceRevision,
        step: "final_map",
        transition: { targetActiveStep: null, targetStableState: "completed", targetState: "completed" },
      },
    );
  }
  const saved = await saveWorkflow(
    workflow,
    content,
    shouldWaitForAdvisor ? workflow.state : "completed",
    shouldWaitForAdvisor ? workflow.stableState : "completed",
    sourceRevision,
    supabase,
    userId,
  );
  return saved
    ? NextResponse.json({ message: shouldWaitForAdvisor ? "Mapa validado pelo estudante. Aguardando validação do orientador." : "Mapa concluído.", workflow: saved })
    : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
}
