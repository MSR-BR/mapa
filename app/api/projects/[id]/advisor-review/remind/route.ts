import { NextResponse } from "next/server";

import { sendProjectNotification } from "@/lib/email/project-notifications";
import { loadUserProfile } from "@/modules/profile/storage";
import { claimEmail, normalizeAdvisorEmail } from "@/modules/projects/advisor";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { ADVISOR_REVIEW_LABELS, currentAdvisorReview } from "@/modules/research-workflow/advisor-review";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";

export async function POST(_request: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Projeto inválido." }, { status: 400 });

  const { claims, supabase, userId } = await requireAuthenticatedUser();
  const profile = await loadUserProfile(supabase, userId);
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, owner_id, advisor_email, advisor_id, title, workflow_version, deleted_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !project || project.workflow_version !== 2) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const workflow = await loadResearchWorkflow(supabase, project.owner_id, id);
  const review = workflow ? currentAdvisorReview(workflow.content) : null;
  if (!workflow || !review || !["pending", "changes_requested"].includes(review.status)) {
    return NextResponse.json({ error: "Não há uma validação ativa para reenviar." }, { status: 409 });
  }

  const actorEmail = claimEmail(claims as Record<string, unknown>);
  const isAdvisor = profile.activeRole === "advisor";
  if (isAdvisor) {
    const advisorMatches = project.advisor_id === userId
      || (Boolean(project.advisor_email) && normalizeAdvisorEmail(project.advisor_email) === actorEmail);
    if (!advisorMatches) return NextResponse.json({ error: "Este projeto não está vinculado à sua conta de revisão." }, { status: 403 });
  } else if (project.owner_id !== userId) {
    return NextResponse.json({ error: "Você não pode reenviar avisos deste projeto." }, { status: 403 });
  }

  const recipientEmail = isAdvisor ? review.studentEmail : review.advisorEmail ?? normalizeAdvisorEmail(project.advisor_email);
  if (!recipientEmail) {
    return NextResponse.json({ error: isAdvisor ? "O e-mail do estudante não está disponível." : "Cadastre um e-mail de revisão antes de reenviar." }, { status: 422 });
  }

  const result = await sendProjectNotification({
    actorEmail,
    comment: review.advisorComments,
    idempotencyKey: `review-reminder-${review.id}-${userId}-${crypto.randomUUID()}`,
    kind: "review_reminder",
    projectId: id,
    projectTitle: project.title,
    recipientEmail,
    stepLabel: ADVISOR_REVIEW_LABELS[review.step],
  });
  if (result.status === "skipped") return NextResponse.json({ error: "O serviço de e-mail não está configurado." }, { status: 503 });
  if (result.status === "failed") return NextResponse.json({ error: "Não foi possível enviar o lembrete agora." }, { status: 502 });
  return NextResponse.json({ message: isAdvisor ? "Lembrete enviado ao estudante." : "Lembrete enviado para revisão." });
}
