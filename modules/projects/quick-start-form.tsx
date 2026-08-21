"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { ResearchActivityIcon } from "../generation/research-activity-icon";
import { createProject } from "./actions";
import { initialProjectActionState } from "./types";
import {
  PENDING_PROJECT_KEY,
  PENDING_PROJECT_MAX_AGE_MS,
} from "./public-start-form";
import {
  EMPTY_RESEARCH_INTAKE,
  hasResearchProductType,
  isCompleteResearchIntake,
  researchIntakeFromPrompt,
  type ResearchIntakeDraft,
} from "./research-intake";
import { ResearchIntakeForm } from "./research-intake-form";
import { ResearchPromptInput } from "./research-prompt-input";

type StartMode = "quick" | "advanced" | null;

export function QuickStartForm({
  canResume = true,
  resumeDraft = false,
  showAdvisorField = true,
  showResearchType = false,
}: {
  canResume?: boolean;
  resumeDraft?: boolean;
  showAdvisorField?: boolean;
  showResearchType?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const resumeSubmitPending = useRef(false);
  const pendingDraftRead = useRef(false);
  const [intake, setIntake] = useState<ResearchIntakeDraft>(EMPTY_RESEARCH_INTAKE);
  const [mode, setMode] = useState<StartMode>(null);
  const [quickPrompt, setQuickPrompt] = useState("");
  const [clientError, setClientError] = useState("");
  const [state, formAction, pending] = useActionState(
    createProject,
    initialProjectActionState,
  );

  useEffect(() => {
    // Wait for the profile/terms gate to finish before auto-submitting. This
    // prevents the draft action from racing with the first-access consent.
    if (!canResume || (!resumeDraft && mode !== null) || pendingDraftRead.current || !formRef.current) return;
    pendingDraftRead.current = true;
    try {
      const raw = localStorage.getItem(PENDING_PROJECT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, unknown>;
      const savedAt = typeof draft.savedAt === "number" ? draft.savedAt : 0;
      const fresh = Date.now() - savedAt <= PENDING_PROJECT_MAX_AGE_MS;
      if (fresh && draft.intake && typeof draft.intake === "object") {
        resumeSubmitPending.current = true;
        queueMicrotask(() => {
          setMode("advanced");
          setIntake({ ...EMPTY_RESEARCH_INTAKE, ...(draft.intake as Partial<ResearchIntakeDraft>) });
        });
      } else if (fresh && typeof draft.prompt === "string") {
        resumeSubmitPending.current = true;
        queueMicrotask(() => {
          setMode("quick");
          setQuickPrompt(draft.prompt as string);
          setIntake(researchIntakeFromPrompt(draft.prompt as string));
        });
      }
      if (!fresh) localStorage.removeItem(PENDING_PROJECT_KEY);
    } catch {
      localStorage.removeItem(PENDING_PROJECT_KEY);
    }
  }, [canResume, mode, resumeDraft]);

  useEffect(() => {
    if (!resumeSubmitPending.current || !formRef.current || !mode) return;
    if (mode === "quick" && quickPrompt.trim().length < 10) return;
    if (mode === "advanced" && (!isCompleteResearchIntake(intake) || (showResearchType && !hasResearchProductType(intake)))) return;
    resumeSubmitPending.current = false;
    formRef.current.requestSubmit();
  }, [intake, mode, quickPrompt, showResearchType]);

  function handleQuickEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setClientError("");
    if (!mode) {
      event.preventDefault();
      setClientError("Escolha Roteiro rápido ou Construção avançada para começar.");
      return;
    }
    if (mode === "quick" && quickPrompt.trim().length < 10) {
      event.preventDefault();
      setClientError("Escreva pelo menos uma frase para iniciar o roteiro rápido.");
      return;
    }
    if (mode === "advanced" && (!isCompleteResearchIntake(intake) || (showResearchType && !hasResearchProductType(intake)))) {
      event.preventDefault();
      setClientError(showResearchType && !hasResearchProductType(intake)
        ? "Escolha o tipo de produto acadêmico antes de iniciar o mapa."
        : "Preencha os cinco campos para formular a situação-problema.");
    }
  }

  function toggleMode(nextMode: Exclude<StartMode, null>) {
    setMode((current) => current === nextMode ? null : nextMode);
    setClientError("");
  }

  return (
    <form action={formAction} className="quick-start-form" onSubmit={handleSubmit} ref={formRef}>
      <div className="public-mode-stack dashboard-mode-stack">
        <section className={`public-mode-card public-mode-card-advanced ${mode === "advanced" ? "is-open" : ""}`}>
          <button
            aria-controls="dashboard-advanced-research-mode"
            aria-expanded={mode === "advanced"}
            className="public-mode-toggle"
            onClick={() => toggleMode("advanced")}
            type="button"
          >
            <span>
              <small>Opção 1 · recomendado</small>
              <strong>Mapa Avançado</strong>
              <em>Responda cinco perguntas orientadas para formular uma situação-problema mais precisa.</em>
            </span>
            <span aria-hidden="true" className="public-mode-chevron">{mode === "advanced" ? "−" : "+"}</span>
          </button>
          {mode === "advanced" ? (
            <div className="public-mode-content" id="dashboard-advanced-research-mode">
              <ResearchIntakeForm onChange={setIntake} showResearchType={showResearchType} value={intake} />
            </div>
          ) : null}
        </section>

        <section className={`public-mode-card public-mode-card-quick ${mode === "quick" ? "is-open" : ""}`}>
          <button
            aria-controls="dashboard-quick-research-mode"
            aria-expanded={mode === "quick"}
            className="public-mode-toggle"
            onClick={() => toggleMode("quick")}
            type="button"
          >
            <span>
              <small>Opção 2</small>
              <strong>Mapa Rápido</strong>
              <em>Escreva sua ideia em linguagem natural e receba sugestões enquanto digita.</em>
            </span>
            <span aria-hidden="true" className="public-mode-chevron">{mode === "quick" ? "−" : "+"}</span>
          </button>
          {mode === "quick" ? (
            <div className="public-mode-content" id="dashboard-quick-research-mode">
              <ResearchPromptInput id="dashboard-quick-prompt" onChange={setQuickPrompt} onEnter={handleQuickEnter} value={quickPrompt} />
              <p className="public-mode-hint">A IA organiza o roteiro inicial e você poderá revisar as propostas nos cards seguintes.</p>
            </div>
          ) : null}
        </section>
      </div>

      <input name="autoGenerate" type="hidden" value="yes" />
      <input name="legacyPromptMode" type="hidden" value={mode === "quick" ? "yes" : "no"} />
      {showAdvisorField ? (
        <label className="quick-start-advisor">
          <span>E-mail do orientador</span>
          <input maxLength={320} name="advisorEmail" placeholder="orientador@instituicao.edu" type="email" />
        </label>
      ) : null}
      {clientError ? <p className="research-intake-error" role="alert">{clientError}</p> : null}
      <div className="quick-start-toolbar quick-start-toolbar-simple">
        <span>{mode === "quick" ? "Enter para gerar · Shift + Enter para nova linha" : mode === "advanced" ? "Responda às cinco perguntas · Enter na pergunta final para continuar" : "Abra uma opção para começar"}</span>
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
