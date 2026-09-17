"use client";

import { ADVISOR_REVIEW_LABELS, currentAdvisorReview } from "./advisor-review";
import type { ResearchWorkflow } from "./schema";
import { useState } from "react";

import { profileMutationHeaders, useActiveProfile } from "@/modules/profile/active-profile-context";

export function AdvisorReviewNotice({ workflow, projectId }: { projectId: string; workflow: ResearchWorkflow }) {
  const { roleVersion } = useActiveProfile();
  const review = currentAdvisorReview(workflow.content);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (!review) return null;
  const label = ADVISOR_REVIEW_LABELS[review.step];
  const title = review.status === "pending"
    ? "Aguardando revisão"
    : "Correção solicitada na revisão";
  const body = review.status === "pending"
    ? `O estudante validou ${label}. A próxima etapa será liberada depois da revisão.`
    : `Revise ${label} conforme os comentários recebidos e valide novamente pelo estudante.`;

  async function resendReminder() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/advisor-review/remind`, { headers: profileMutationHeaders(roleVersion), method: "POST" });
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
      {review.status === "pending" ? <div className="advisor-review-reminder-row"><button className="advisor-review-remind" disabled={busy} onClick={() => void resendReminder()} type="button">{busy ? "Enviando…" : "Reenviar aviso de revisão"}</button>{message ? <span role="status">{message}</span> : null}</div> : null}
    </aside>
  );
}
