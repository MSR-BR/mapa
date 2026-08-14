"use client";

import { useActionState } from "react";

import { updateProjectAdvisor } from "./actions";
import { initialAdvisorLinkActionState } from "./types";

type Props = {
  advisorEmail: string | null;
  advisorLinked: boolean;
  projectId: string;
};

export function ProjectAdvisorPanel({ advisorEmail, advisorLinked, projectId }: Props) {
  const [state, formAction, pending] = useActionState(updateProjectAdvisor, {
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
      <form action={formAction}>
        <input name="projectId" type="hidden" value={projectId} />
        <label>
          <span>E-mail do orientador</span>
          <input
            defaultValue={advisorEmail ?? ""}
            maxLength={320}
            name="advisorEmail"
            placeholder="orientador@instituicao.edu"
            type="email"
          />
        </label>
        <button className="secondary-button" disabled={pending} type="submit">
          {pending ? "Salvando…" : "Salvar orientador"}
        </button>
      </form>
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
