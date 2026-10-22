import { NextResponse } from "next/server";
import { z } from "zod";

import { projectNotificationsAvailable, sendProjectNotification } from "@/lib/email/project-notifications";
import { claimEmail } from "@/modules/projects/advisor";
import { authorizeProjectRoute } from "@/modules/projects/auth";
import { ADVISOR_REVIEW_LABELS, currentAdvisorReview } from "@/modules/research-workflow/advisor-review";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";

const reservationSchema = z.discriminatedUnion("allowed", [
  z.object({ allowed: z.literal(true), reservation_id: z.string().uuid(), recipient_email: z.string().email() }),
  z.object({ allowed: z.literal(false), code: z.enum(["auth_required", "permission_denied", "review_unavailable", "reminder_recipient_required", "reminder_cooldown", "reminder_limit"]), retry_after: z.number().int().min(1).max(86400).optional() }),
]);
const unavailable = () => NextResponse.json({ code: "reminder_unavailable", error: "Não foi possível confirmar o envio agora. Aguarde e confira antes de reenviar; seus textos continuam salvos." }, { status: 503, headers: { "Retry-After": "60" } });

export async function POST(request: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "invalid_project", error: "Projeto inválido." }, { status: 400 });
  try {
    const access = await authorizeProjectRoute({ capability: "reminder", mutation: true, projectId: id, request });
    if (!access.ok) return access.response;
    const { actor, relation, supabase, project } = access.value;
    const workflow = await loadResearchWorkflow(supabase, project.owner_id, id);
    const review = workflow ? currentAdvisorReview(workflow.content) : null;
    if (!review) return NextResponse.json({ code: "review_unavailable", error: "Não há uma revisão ativa para lembrar. Confira o estado da etapa." }, { status: 409 });
    if (!projectNotificationsAvailable()) return unavailable();

    // Never retry a reservation. A timeout may occur after PostgreSQL committed it.
    const { data, error } = await supabase.rpc("reserve_advisor_reminder", { p_project_id: id, p_review_id: review.id }).abortSignal(AbortSignal.timeout(5_000));
    if (error) return unavailable();
    const parsed = reservationSchema.safeParse(data);
    if (!parsed.success) return unavailable();
    const reservation = parsed.data;
    if (!reservation.allowed) {
      if (reservation.code === "reminder_cooldown" || reservation.code === "reminder_limit") {
        if (!reservation.retry_after) return unavailable();
        const hours = Math.ceil(reservation.retry_after / 3600);
        const detail = reservation.code === "reminder_cooldown"
          ? "Já houve uma tentativa de lembrete para esta revisão nas últimas 24 horas."
          : "Você atingiu cinco tentativas de lembrete em 24 horas.";
        return NextResponse.json({ code: reservation.code, error: `${detail} Tente novamente em até ${hours} hora(s). Esse intervalo vale apenas para e-mails; você pode continuar usando o mapa.` }, { status: 429, headers: { "Retry-After": String(reservation.retry_after) } });
      }
      const messages = {
        auth_required: [401, "Entre novamente no app para enviar o lembrete."],
        permission_denied: [403, "O vínculo ou perfil mudou. Reabra o projeto no perfil correto."],
        review_unavailable: [409, "A revisão mudou. Confira a etapa antes de reenviar."],
        reminder_recipient_required: [422, "Confira o e-mail do orientador ou a confirmação da conta do estudante antes de reenviar."],
      } as const;
      const [status, message] = messages[reservation.code];
      return NextResponse.json({ code: reservation.code, error: message }, { status });
    }
    const result = await sendProjectNotification({
      actorEmail: claimEmail(actor.claims),
      idempotencyKey: `review-reminder-${reservation.reservation_id}`,
      kind: "review_reminder", projectId: id, projectTitle: "Projeto de pesquisa",
      recipientEmail: reservation.recipient_email, stepLabel: ADVISOR_REVIEW_LABELS[review.step],
    });
    if (result.status !== "sent") {
      // Retain the reservation even on failure: provider acceptance may be ambiguous.
      return NextResponse.json({ code: "reminder_delivery_unconfirmed", error: "Não foi possível confirmar a entrega do lembrete. Para evitar duplicidade, outro envio desta revisão ficará disponível em 24 horas. Seus textos continuam salvos." }, { status: 503, headers: { "Retry-After": "86400" } });
    }
    return NextResponse.json({ message: relation === "advisor" ? "Lembrete enviado ao estudante. Novo envio em 24 horas." : "Lembrete enviado para revisão. Novo envio em 24 horas." });
  } catch { return unavailable(); }
}
