import { NextResponse } from "next/server";
import { z } from "zod";

import {
  sendProjectNotification,
} from "@/lib/email/project-notifications";
import { toJson } from "@/modules/generation/types";
import { claimPendingAdvisorProjects, loadUserProfile } from "@/modules/profile/storage";
import { claimEmail, normalizeAdvisorEmail } from "@/modules/projects/advisor";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import {
  ADVISOR_REVIEW_LABELS,
  pendingAdvisorReview,
  withAdvisorReviewComment,
  withAdvisorReviewDecision,
} from "@/modules/research-workflow/advisor-review";
import {
  researchWorkflowContentSchema,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
} from "@/modules/research-workflow/schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";

const requestSchema = z.object({
  action: z.enum(["approve", "request_changes", "save_comment"]),
  comments: z.string().trim().max(2_000).optional().nullable(),
  reviewId: z.string().uuid(),
  revision: z.number().int().positive(),
});

async function saveWorkflow(
  workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  state: ResearchWorkflow["state"],
  stableState: ResearchWorkflow["stableState"],
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  ownerId: string,
) {
  const revision = workflow.revision + 1;
  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("research_workflows")
    .update({
      content: toJson(content),
      revision,
      stable_state: stableState,
      state,
      updated_at: updatedAt,
    })
    .eq("project_id", workflow.projectId)
    .eq("owner_id", ownerId)
    .eq("revision", workflow.revision)
    .select("updated_at")
    .maybeSingle();

  return error || !data ? null : { ...workflow, content, revision, stableState, state, updatedAt: data.updated_at };
}

export async function POST(request: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) {
    return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
  }

  const { supabase, userId, claims } = await requireAuthenticatedUser();
  const profile = await loadUserProfile(supabase, userId);
  if (profile.activeRole !== "advisor") {
    return NextResponse.json({ error: "Ative o modo orientador para validar etapas." }, { status: 403 });
  }
  await claimPendingAdvisorProjects(supabase);
  const reviewerEmail = claimEmail(claims as Record<string, unknown>);
  if (!reviewerEmail) {
    return NextResponse.json({ error: "Sua conta não possui e-mail confirmado para atuar como orientador." }, { status: 403 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, owner_id, advisor_email, advisor_id, title, workflow_version, deleted_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }
  if (project.workflow_version !== 2) {
    return NextResponse.json({ error: "A validação do orientador está disponível apenas no Mapa v2." }, { status: 409 });
  }
  const advisorEmail = normalizeAdvisorEmail(project.advisor_email);
  const advisorMatches = project.advisor_id === userId || (Boolean(advisorEmail) && advisorEmail === reviewerEmail);
  if (!advisorMatches) {
    return NextResponse.json({ error: "Este projeto não está vinculado à sua conta de orientador." }, { status: 403 });
  }

  const workflow = await loadResearchWorkflow(supabase, project.owner_id, id);
  if (!workflow || workflow.revision !== parsed.data.revision) {
    return NextResponse.json({ error: "O mapa foi alterado em outra aba. Recarregue para continuar." }, { status: 409 });
  }

  const review = pendingAdvisorReview(workflow.content);
  if (!review || review.id !== parsed.data.reviewId) {
    return NextResponse.json({ error: "Não há uma validação pendente do orientador para esta etapa." }, { status: 409 });
  }

  const comments = parsed.data.comments?.trim() || null;
  if (parsed.data.action === "request_changes" && !comments) {
    return NextResponse.json({ error: "Escreva um comentário para orientar a correção do estudante." }, { status: 422 });
  }

  let content = workflow.content;
  let state = workflow.state;
  let stableState = workflow.stableState;
  let message = "Comentário salvo.";

  if (parsed.data.action === "save_comment") {
    content = withAdvisorReviewComment(content, {
      advisorComments: comments,
      advisorId: userId,
      reviewId: review.id,
    });
  } else if (parsed.data.action === "request_changes") {
    content = withAdvisorReviewDecision(content, {
      advisorComments: comments,
      advisorId: userId,
      reviewId: review.id,
      status: "changes_requested",
    });
    message = "Correção solicitada ao estudante.";
  } else {
    content = withAdvisorReviewDecision(content, {
      advisorComments: comments,
      advisorId: userId,
      reviewId: review.id,
      status: "approved",
    });
    content = researchWorkflowContentSchema.parse({
      ...content,
      activeStep: review.targetActiveStep,
    });
    state = review.targetState;
    stableState = review.targetStableState;
    message = "Etapa validada pelo orientador. O estudante já pode avançar.";
  }

  const saved = await saveWorkflow(workflow, content, state, stableState, supabase, project.owner_id);
  if (!saved) {
    return NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  const kind = parsed.data.action === "approve"
    ? "advisor_approved"
    : parsed.data.action === "request_changes"
      ? "advisor_requested_changes"
      : "advisor_comment";
  await sendProjectNotification({
    actorEmail: reviewerEmail,
    comment: comments,
    idempotencyKey: `${kind}-${review.id}-${saved.revision}`,
    kind,
    projectId: id,
    projectTitle: project.title,
    recipientEmail: review.studentEmail,
    stepLabel: ADVISOR_REVIEW_LABELS[review.step],
  });

  return NextResponse.json({ message, workflow: saved });
}
