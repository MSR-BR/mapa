"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { ResearchActivityIcon } from "../generation/research-activity-icon";
import { createProject } from "./actions";
import { initialProjectActionState } from "./types";
import { PENDING_PROJECT_KEY } from "./public-start-form";
import { ResearchPromptInput } from "./research-prompt-input";

export function QuickStartForm({ resumeDraft = false }: { resumeDraft?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const resumeSubmitPending = useRef(false);
  const [prompt, setPrompt] = useState("");
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
      if (typeof draft.prompt === "string") {
        resumeSubmitPending.current = true;
        const savedPrompt = draft.prompt.slice(0, 5_000);
        queueMicrotask(() => setPrompt(savedPrompt));
      }
      sessionStorage.removeItem(PENDING_PROJECT_KEY);
    } catch {
      sessionStorage.removeItem(PENDING_PROJECT_KEY);
    }
  }, [resumeDraft]);

  useEffect(() => {
    if (!resumeSubmitPending.current || !prompt || !formRef.current) return;
    resumeSubmitPending.current = false;
    formRef.current.requestSubmit();
  }, [prompt]);

  return (
    <form action={formAction} className="quick-start-form" ref={formRef}>
      <label className="sr-only" htmlFor="quick-project-title">
        Título provisório ou pergunta de pesquisa
      </label>
      <ResearchPromptInput
        id="quick-project-title"
        onChange={setPrompt}
        onEnter={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        value={prompt}
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
            <ResearchActivityIcon />
            <p className="section-kicker">Criando seu mapa</p>
            <h2>Interpretando o pedido…</h2>
            <p>Preparando o projeto para iniciar a pesquisa e a geração da estrutura.</p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
