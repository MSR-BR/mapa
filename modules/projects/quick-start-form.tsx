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
      const prompt = form.elements.namedItem("prompt") as HTMLTextAreaElement | null;
      if (prompt && typeof draft.prompt === "string") prompt.value = draft.prompt.slice(0, 5_000);
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
        maxLength={5_000}
        name="prompt"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Crie um mapa de tese de mestrado a respeito do uso de inteligência artificial no ensino superior"
        required
        rows={3}
      />

      <input name="autoGenerate" type="hidden" value="yes" />
      <div className="quick-start-toolbar quick-start-toolbar-simple">
        <span>Enter para gerar · Shift + Enter para nova linha</span>
        <button disabled={pending} type="submit">
          {pending ? "Iniciando…" : "Gerar mapa"}
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {state.message ? (
        <p className={`quick-form-message ${state.status}`} role="status">
          {state.message}
        </p>
      ) : null}
      {pending ? (
        <div className="generation-overlay" role="status" aria-live="polite">
          <div className="generation-overlay-card">
            <span className="generation-orbit" aria-hidden="true">✦</span>
            <p className="section-kicker">Criando seu mapa</p>
            <h2>Interpretando o pedido…</h2>
            <p>Preparando o projeto para iniciar a pesquisa e a geração da estrutura.</p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
