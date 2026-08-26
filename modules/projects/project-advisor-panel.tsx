"use client";

import { useActionState, useState } from "react";

import { updateProjectAdvisor } from "./actions";
import { initialAdvisorLinkActionState, type AdvisorLinkActionState } from "./types";
import { trackAnalyticsEvent } from "@/modules/analytics/analytics";

type Props = {
  advisorEmail: string | null;
  advisorLinked: boolean;
  projectId: string;
};

export function ProjectAdvisorPanel({ advisorEmail, advisorLinked, projectId }: Props) {
  const [editing, setEditing] = useState(!advisorEmail);
  const [state, formAction, pending] = useActionState(async (previousState: AdvisorLinkActionState, formData: FormData) => {
    const nextState = await updateProjectAdvisor(previousState, formData);
    if (nextState.status === "success") {
      setEditing(!nextState.value?.trim());
      trackAnalyticsEvent(nextState.linked ? "advisor_link_succeeded" : "advisor_link_pending", { profile_role: "student", source: "dashboard", has_advisor: nextState.linked ? "yes" : "unknown", reason_code: nextState.linked ? undefined : "advisor_pending" });
    }
    return nextState;
  }, {
    ...initialAdvisorLinkActionState,
    linked: advisorLinked,
    value: advisorEmail ?? "",
  });
  const displayedEmail = typeof state.value === "string" ? state.value : advisorEmail ?? "";
  const hasEmail = displayedEmail.trim().length > 0;
  const linked = state.status === "idle" ? advisorLinked : Boolean(state.linked);

  return (
    <aside className="project-advisor-panel" aria-labelledby="project-advisor-title">
      <div>
        <p className="section-kicker">Orientação</p>
        <h2 id="project-advisor-title">Orientador do projeto</h2>
        <p>
          Informe a conta do orientador para que este mapa apareça na área dele. Se a conta ainda não existir,
          o Mapa guarda o e-mail e faz o vínculo quando ela for criada.
        </p>
      </div>
      {hasEmail && !editing ? (
        <div className="project-advisor-saved">
          <div>
            <span className="project-advisor-saved-label">Orientador informado</span>
            <strong>{displayedEmail}</strong>
            <p>{linked ? "Conta vinculada ao projeto." : "E-mail guardado para vincular quando a conta existir."}</p>
          </div>
          <button className="secondary-button" onClick={() => setEditing(true)} type="button">
            Alterar orientador
          </button>
        </div>
      ) : (
        <form action={formAction} onSubmit={() => trackAnalyticsEvent("advisor_link_started", { profile_role: "student", source: "dashboard" })}>
          <input name="projectId" type="hidden" value={projectId} />
          <label>
            <span>E-mail do orientador</span>
            <input
              defaultValue={displayedEmail}
              maxLength={320}
              name="advisorEmail"
              placeholder="orientador@instituicao.edu"
              type="email"
            />
          </label>
          <div className="project-advisor-form-actions">
            <button className="secondary-button" disabled={pending} type="submit">
              {pending ? "Salvando…" : "Salvar orientador"}
            </button>
            {hasEmail ? (
              <button className="project-advisor-cancel" disabled={pending} onClick={() => setEditing(false)} type="button">
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      )}
      <div className={`project-advisor-status ${hasEmail ? linked ? "linked" : "pending" : "empty"}`} role="status">
        {hasEmail
          ? linked
            ? "Conta vinculada."
            : "E-mail guardado. O vínculo será feito quando o orientador entrar com essa conta."
          : "Nenhum orientador indicado ainda."}
      </div>
      {state.message ? <p className={`project-advisor-message ${state.status}`}>{state.message}</p> : null}
    </aside>
  );
}
