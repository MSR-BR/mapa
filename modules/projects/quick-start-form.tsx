"use client";

import { useActionState, useEffect, useRef, useState } from "react";

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

export function QuickStartForm({
  resumeDraft = false,
  showAdvisorField = true,
  showResearchType = false,
}: {
  resumeDraft?: boolean;
  showAdvisorField?: boolean;
  showResearchType?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const resumeSubmitPending = useRef(false);
  const pendingDraftRead = useRef(false);
  const [intake, setIntake] = useState<ResearchIntakeDraft>(EMPTY_RESEARCH_INTAKE);
  const [resumeMode, setResumeMode] = useState<"quick" | "advanced" | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [state, formAction, pending] = useActionState(
    createProject,
    initialProjectActionState,
  );

  useEffect(() => {
    // Recover the fresh draft even if an auth callback drops resume=1.
    // It is cleared only by the successful project page.
    if (pendingDraftRead.current || !formRef.current) return;
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
          setResumeMode("advanced");
          setIntake({ ...EMPTY_RESEARCH_INTAKE, ...(draft.intake as Partial<ResearchIntakeDraft>) });
        });
      } else if (fresh && typeof draft.prompt === "string") {
        resumeSubmitPending.current = true;
        queueMicrotask(() => {
          setResumeMode("quick");
          setPendingPrompt(draft.prompt as string);
          setIntake(researchIntakeFromPrompt(draft.prompt as string));
        });
      }
      if (!fresh) localStorage.removeItem(PENDING_PROJECT_KEY);
    } catch {
      localStorage.removeItem(PENDING_PROJECT_KEY);
    }
  }, [resumeDraft]);

  useEffect(() => {
    if (
      !resumeSubmitPending.current
      || !isCompleteResearchIntake(intake)
      || (showResearchType && resumeMode !== "quick" && !hasResearchProductType(intake))
      || !formRef.current
    ) return;
    resumeSubmitPending.current = false;
    formRef.current.requestSubmit();
  }, [intake, resumeMode, showResearchType]);

  return (
    <form action={formAction} className="quick-start-form" ref={formRef}>
      <ResearchIntakeForm onChange={setIntake} showResearchType={showResearchType && resumeMode !== "quick"} value={intake} />

      <input name="autoGenerate" type="hidden" value="yes" />
      <input name="legacyPromptMode" type="hidden" value={resumeMode === "quick" ? "yes" : "no"} />
      {resumeMode === "quick" ? <input name="prompt" type="hidden" value={pendingPrompt} /> : null}
      {showAdvisorField ? (
        <label className="quick-start-advisor">
          <span>E-mail do orientador</span>
          <input maxLength={320} name="advisorEmail" placeholder="orientador@instituicao.edu" type="email" />
        </label>
      ) : null}
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
