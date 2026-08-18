import type { SupabaseClient } from "@supabase/supabase-js";

import { getAppUrl } from "@/lib/app-url";
import type { Database } from "@/lib/supabase/database.types";
import { ADVISOR_REVIEW_LABELS } from "@/modules/research-workflow/advisor-review";
import type { AdvisorReviewStep } from "@/modules/research-workflow/schema";

export type NotificationKind = "advisor_approved" | "advisor_comment" | "advisor_requested_changes" | "student_submitted";

export type NotificationInput = {
  actorEmail: string | null;
  comment?: string | null;
  idempotencyKey: string;
  kind: NotificationKind;
  projectId: string;
  projectTitle: string;
  recipientEmail: string | null;
  stepLabel: string;
};

const COPY: Record<NotificationKind, { action: string; heading: string; subject: string; summary: string }> = {
  advisor_approved: {
    action: "Próxima ação: abrir o projeto e avançar para a próxima etapa.",
    heading: "Etapa aprovada pelo orientador",
    subject: "Etapa aprovada",
    summary: "O orientador aprovou a etapa. Você já pode continuar o mapa.",
  },
  advisor_comment: {
    action: "Próxima ação: abrir o projeto e ler o comentário do orientador.",
    heading: "Novo comentário do orientador",
    subject: "Novo comentário",
    summary: "O orientador registrou um comentário na etapa em análise.",
  },
  advisor_requested_changes: {
    action: "Próxima ação: corrigir a etapa e enviá-la novamente ao orientador.",
    heading: "O orientador solicitou ajustes",
    subject: "Ajustes solicitados",
    summary: "Revise o comentário do orientador, faça os ajustes e envie novamente.",
  },
  student_submitted: {
    action: "Próxima ação: abrir o projeto, revisar a etapa e validá-la ou solicitar ajustes.",
    heading: "Nova etapa aguardando sua validação",
    subject: "Etapa enviada para validação",
    summary: "O estudante concluiu uma etapa e aguarda sua análise.",
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function cleanEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLocaleLowerCase("pt-BR");
  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export async function loadProjectNotificationTitle(
  supabase: SupabaseClient<Database>,
  projectId: string,
) {
  const { data } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();
  return data?.title?.trim() || "Projeto de pesquisa";
}

export async function sendProjectNotification(input: NotificationInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = cleanEmail(input.recipientEmail);
  if (!apiKey || !recipient) return { status: "skipped" as const };

  const actorEmail = cleanEmail(input.actorEmail);
  const copy = COPY[input.kind];
  const projectUrl = new URL(`/dashboard/projects/${input.projectId}`, getAppUrl()).toString();
  const comment = input.comment?.trim();
  const safeTitle = escapeHtml(input.projectTitle);
  const safeStep = escapeHtml(input.stepLabel);
  const safeComment = comment ? escapeHtml(comment) : null;
  const safeAction = escapeHtml(copy.action);
  const from = actorEmail
    ? process.env.MAPA_NOTIFICATION_FROM?.trim() || "Mapa da Pesquisa <notificacao@mapadapesquisa.com.br>"
    : process.env.MAPA_NOTIFICATION_NOREPLY?.trim() || "Mapa da Pesquisa <noreply@mapadapesquisa.com.br>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
      from,
      html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f1f6f3;color:#172820;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:36px 20px"><div style="background:#101a16;border-radius:20px;padding:30px;color:#f7fff9"><p style="margin:0 0 12px;color:#91dabd;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Mapa da Pesquisa</p><h1 style="margin:0 0 16px;font-size:28px;line-height:1.15">${escapeHtml(copy.heading)}</h1><p style="margin:0 0 22px;color:#c8d5ce;line-height:1.6">${escapeHtml(copy.summary)}</p><div style="border:1px solid #33443c;border-radius:14px;padding:16px;background:#17231e"><strong style="display:block;color:#fff">${safeTitle}</strong><span style="display:block;margin-top:6px;color:#9fb1a8">${safeStep}</span>${safeComment ? `<p style="margin:14px 0 0;border-left:3px solid #91dabd;padding-left:12px;color:#e7f0eb;line-height:1.55">${safeComment}</p>` : ""}<p style="margin:14px 0 0;color:#d7eee2;font-weight:700;line-height:1.5">${safeAction}</p></div><a href="${projectUrl}" style="display:inline-block;margin-top:24px;border-radius:12px;padding:13px 18px;background:#dcebe4;color:#102019;font-weight:700;text-decoration:none">Abrir projeto</a></div><p style="margin:16px 4px 0;color:#66776f;font-size:12px;line-height:1.5">${actorEmail ? "Você pode responder a este e-mail para falar diretamente com o autor da movimentação." : "Este e-mail é automático. Use o botão acima para continuar no Mapa da Pesquisa."}</p></div></body></html>`,
      reply_to: actorEmail ?? undefined,
      subject: `${copy.subject} · ${input.stepLabel} · ${input.projectTitle}`.slice(0, 180),
      text: `${copy.heading}\n\n${copy.summary}\n\nProjeto: ${input.projectTitle}\nEtapa: ${input.stepLabel}${comment ? `\n\nComentário: ${comment}` : ""}\n\n${copy.action}\n\nAbrir projeto: ${projectUrl}`,
      to: [recipient],
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey.slice(0, 256),
      },
      method: "POST",
    });

    if (!response.ok) {
      console.error("project_notification_email_failed", {
        projectId: input.projectId,
        status: response.status,
        type: input.kind,
      });
      return { status: "failed" as const };
    }
    return { status: "sent" as const };
  } catch (error) {
    console.error("project_notification_email_failed", {
      message: error instanceof Error ? error.message : "network-error",
      projectId: input.projectId,
      type: input.kind,
    });
    return { status: "failed" as const };
  }
}

export async function notifyAdvisorOfReviewRequest(input: {
  actorEmail: string | null;
  advisorEmail: string | null;
  projectId: string;
  reviewId: string;
  step: AdvisorReviewStep;
  supabase: SupabaseClient<Database>;
}) {
  return sendProjectNotification({
    actorEmail: input.actorEmail,
    idempotencyKey: `student-submitted-${input.reviewId}`,
    kind: "student_submitted",
    projectId: input.projectId,
    projectTitle: await loadProjectNotificationTitle(input.supabase, input.projectId),
    recipientEmail: input.advisorEmail,
    stepLabel: ADVISOR_REVIEW_LABELS[input.step],
  });
}
