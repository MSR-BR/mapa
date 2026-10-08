import { NextResponse } from "next/server";
import { z } from "zod";
import { withAiProgress } from "@/modules/ai/route";
import { generateCardRevision } from "@/modules/generation/regenerate-card";
import { authorizeProjectRoute } from "@/modules/projects/auth";
import { pendingAdvisorReview } from "@/modules/research-workflow/advisor-review";
import { applyRegeneratedCard, regenerationCard } from "@/modules/research-workflow/card-regeneration";
import { definitionStepSchema } from "@/modules/research-workflow/schema";
import { contentWithDraft, saveVersionedWorkflow } from "@/modules/research-workflow/save-versioned-workflow";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import { canNavigateToWorkflowTarget } from "@/modules/research-workflow/workflow-navigation";

export const maxDuration = 120;
const requestSchema = z.object({ step: definitionStepSchema, targetId: z.string().min(1).max(64), instruction: z.string().trim().max(1000).default(""), revision: z.number().int().positive() });

async function handlePost(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!z.string().uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Pedido de regeneração inválido." }, { status: 400 });
  const access = await authorizeProjectRoute({ mutation: true, projectId: id, request });
  if (!access.ok) return access.response;
  const { supabase, userId } = access.value;
  const base = await loadResearchWorkflow(supabase, userId, id);
  const { step, targetId, instruction, revision } = parsed.data;
  if (!base || base.revision !== revision) return NextResponse.json({ error: "A página foi alterada em outra aba. Recarregue antes de regenerar." }, { status: 409 });
  if (pendingAdvisorReview(base.content) || !canNavigateToWorkflowTarget(base, step)) return NextResponse.json({ error: "Esta etapa não está disponível para edição agora." }, { status: 409 });
  const content = contentWithDraft(base, step);
  let card;
  try { card = regenerationCard(content, step, targetId); }
  catch { return NextResponse.json({ error: "Quadro não encontrado nesta etapa." }, { status: 400 }); }
  const result = await generateCardRevision(card, content, instruction);
  const saved = await saveVersionedWorkflow(supabase, { base, step, action: "regenerate_card", content: applyRegeneratedCard(content, card, result), sourceRevision: base.sourceRevision, state: base.state, stableState: base.stableState });
  return saved ? NextResponse.json({ workflow: saved, message: "Quadro regenerado e salvo como rascunho. Revise o texto e use Próximo para confirmar a etapa." })
    : NextResponse.json({ error: "A página mudou durante a geração. As edições salvas foram preservadas; recarregue e tente novamente." }, { status: 409 });
}

export const POST = withAiProgress(handlePost);
