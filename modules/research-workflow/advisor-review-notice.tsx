"use client";

import { ADVISOR_REVIEW_LABELS, currentAdvisorReview } from "./advisor-review";
import type { ResearchWorkflow } from "./schema";
import { useState } from "react";

export function AdvisorReviewNotice({ workflow, projectId }: { projectId: string; workflow: ResearchWorkflow }) {
  const review = currentAdvisorReview(workflow.content);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (!review) return null;
  const label = ADVISOR_REVIEW_LABELS[review.step];
  const title = review.status === "pending"
    ? "Aguardando validação do orientador"
    : "Correção solicitada pelo orientador";
  const body = review.status === "pending"
    ? `O estudante validou ${label}. A próxima etapa será liberada quando o orientador aprovar.`
    : `Revise ${label} conforme o comentário do orientador e valide novamente pelo estudante.`;

  async function resendReminder() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/advisor-review/remind`, { method: "POST" });
      const payload = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível reenviar o lembrete.");
      setMessage(payload.message ?? "Lembrete enviado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível reenviar o lembrete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className={`advisor-review-notice advisor-review-notice-${review.status}`} role="status">
      <div>
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
      {review.advisorComments ? <p>{review.advisorComments}</p> : null}
      {review.status === "pending" ? <div className="advisor-review-reminder-row"><button className="advisor-review-remind" disabled={busy} onClick={() => void resendReminder()} type="button">{busy ? "Enviando…" : "Reenviar aviso ao orientador"}</button>{message ? <span role="status">{message}</span> : null}</div> : null}
    </aside>
  );
}
