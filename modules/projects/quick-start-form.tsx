"use client";

import { useActionState } from "react";

import { createProject } from "./actions";
import { initialProjectActionState } from "./types";

export function QuickStartForm() {
  const [state, formAction, pending] = useActionState(
    createProject,
    initialProjectActionState,
  );

  return (
    <form action={formAction} className="quick-start-form">
      <label className="sr-only" htmlFor="quick-project-title">
        Título provisório ou pergunta de pesquisa
      </label>
      <textarea
        autoComplete="off"
        autoFocus
        id="quick-project-title"
        maxLength={160}
        name="title"
        placeholder="Ex.: Como a inteligência artificial está transformando o ensino superior?"
        required
        rows={3}
      />

      <div className="quick-start-toolbar">
        <details className="quick-settings">
          <summary aria-label="Abrir configurações iniciais">
            <span aria-hidden="true">⚙</span>
            <span>Configurar</span>
          </summary>
          <div className="quick-settings-panel">
            <label>
              Área do conhecimento
              <input maxLength={120} name="knowledgeArea" placeholder="Ex.: Educação" />
            </label>
            <label>
              Nível acadêmico
              <select defaultValue="" name="academicLevel">
                <option value="">Não informado</option>
                <option value="undergraduate">Graduação</option>
                <option value="specialization">Especialização</option>
                <option value="masters">Mestrado</option>
                <option value="doctorate">Doutorado</option>
                <option value="other">Outro</option>
              </select>
            </label>
          </div>
        </details>
        <button disabled={pending} type="submit">
          {pending ? "Criando…" : "Criar mapa"}
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {state.message ? (
        <p className={`quick-form-message ${state.status}`} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
