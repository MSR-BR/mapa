"use client";

import { useActionState, useEffect, useRef } from "react";

import { createProject } from "./actions";
import { initialProjectActionState } from "./types";
import { PENDING_PROJECT_KEY } from "./public-start-form";

export function QuickStartForm({ resumeDraft = false }: { resumeDraft?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createProject,
    initialProjectActionState,
  );

  useEffect(() => {
    if (!resumeDraft || !formRef.current) return;
    try {
      const raw = sessionStorage.getItem(PENDING_PROJECT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, unknown>;
      const form = formRef.current;
      const title = form.elements.namedItem("title") as HTMLTextAreaElement | null;
      const area = form.elements.namedItem("knowledgeArea") as HTMLInputElement | null;
      const level = form.elements.namedItem("academicLevel") as HTMLSelectElement | null;
      if (title && typeof draft.title === "string") title.value = draft.title.slice(0, 160);
      if (area && typeof draft.knowledgeArea === "string") area.value = draft.knowledgeArea.slice(0, 120);
      if (level && typeof draft.academicLevel === "string") level.value = draft.academicLevel;
      sessionStorage.removeItem(PENDING_PROJECT_KEY);
      form.requestSubmit();
    } catch {
      sessionStorage.removeItem(PENDING_PROJECT_KEY);
    }
  }, [resumeDraft]);

  return (
    <form action={formAction} className="quick-start-form" ref={formRef}>
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
