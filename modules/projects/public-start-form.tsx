"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { EMPTY_RESEARCH_INTAKE, composeResearchBrief, hasResearchProductType, isCompleteResearchIntake, researchIntakeSchema, type ResearchIntakeDraft } from "./research-intake";
import { ResearchIntakeForm } from "./research-intake-form";
import { ResearchPromptInput } from "./research-prompt-input";
import { setAnalyticsContext, trackAnalyticsEvent, type AnalyticsEntryMode, type AnalyticsProductType } from "@/modules/analytics/analytics";

export const PENDING_PROJECT_KEY = "mapa.pending-project.v1";
export const PENDING_PROJECT_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

export function PublicStartForm({ authenticated = false, initialMode = "quick", explicitMode = false }: { authenticated?: boolean; initialMode?: "quick" | "advanced"; explicitMode?: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const quickSuggestionContinuePending = useRef(false);
  const [continuing, setContinuing] = useState(false);
  const [mode, setMode] = useState<"quick" | "advanced" | null>(initialMode);
  const [intake, setIntake] = useState<ResearchIntakeDraft>(EMPTY_RESEARCH_INTAKE);
  const [quickPrompt, setQuickPrompt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_PROJECT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, unknown>;
      const savedAt = typeof draft.savedAt === "number" ? draft.savedAt : 0;
      if (Date.now() - savedAt > PENDING_PROJECT_MAX_AGE_MS) {
        localStorage.removeItem(PENDING_PROJECT_KEY);
        return;
      }
      if (draft.mode === "quick" || (!draft.intake && typeof draft.prompt === "string")) {
        queueMicrotask(() => {
          if (!explicitMode) setMode("quick");
          setQuickPrompt(typeof draft.prompt === "string" ? draft.prompt : "");
        });
      } else if (draft.intake && typeof draft.intake === "object") {
        queueMicrotask(() => {
          if (!explicitMode) setMode("advanced");
          setIntake({ ...EMPTY_RESEARCH_INTAKE, ...(draft.intake as Partial<ResearchIntakeDraft>) });
        });
      }
    } catch {
      localStorage.removeItem(PENDING_PROJECT_KEY);
    }
  }, [explicitMode]);

  useEffect(() => {
    if (!quickSuggestionContinuePending.current || mode !== "quick" || continuing || !formRef.current) return;
    if (quickPrompt.trim().length < 10) return;
    quickSuggestionContinuePending.current = false;
    formRef.current.requestSubmit();
  }, [continuing, mode, quickPrompt]);

  function handleQuickEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function handleQuickSuggestionSelect(prompt: string) {
    quickSuggestionContinuePending.current = true;
    setError("");
    setQuickPrompt(prompt);
  }

  function continueToLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mode) {
      setError("Abra Mapa Rápido ou Mapa Avançado para continuar.");
      return;
    }
    const prompt = quickPrompt.trim();
    const parsed = researchIntakeSchema.safeParse(intake);
    if (mode === "quick") {
      if (prompt.length < 10) {
        setError("Escreva pelo menos uma frase para iniciar o roteiro rápido.");
        return;
      }
    } else {
      if (!parsed.success || !isCompleteResearchIntake(intake)) {
        setError("Preencha os cinco campos para formular a situação-problema.");
        return;
      }
      if (!hasResearchProductType(intake)) {
        setError("Escolha o tipo de produto acadêmico antes de continuar.");
        return;
      }
    }
    const entryMode: AnalyticsEntryMode = mode === "quick" ? "quick" : "advanced";
    const productType = (intake.researchType || "unknown") as AnalyticsProductType;
    setAnalyticsContext({ app_auth_state: authenticated ? "authenticated" : "anonymous", app_role: "unknown", app_surface: "home", app_entry_mode: entryMode, app_product_type: productType });
    try {
      localStorage.setItem(PENDING_PROJECT_KEY, JSON.stringify(mode === "quick"
        ? { mode, prompt, savedAt: Date.now() }
        : { intake: parsed.success ? parsed.data : intake, mode, prompt: composeResearchBrief(intake), savedAt: Date.now() }));
    } catch {
      setError("Não foi possível guardar o rascunho neste navegador. Verifique as permissões de armazenamento e tente novamente.");
      return;
    }
    if (!authenticated) trackAnalyticsEvent("login_started", { app_surface: "home" });
    setContinuing(true);
    router.push(authenticated ? "/dashboard?resume=1" : "/login?next=%2Fdashboard%3Fresume%3D1");
  }

  function toggleMode(nextMode: "quick" | "advanced") {
    quickSuggestionContinuePending.current = false;
    setMode((current) => current === nextMode ? null : nextMode);
    setError("");
  }

  return (
    <form className="quick-start-form public-start-form" onSubmit={continueToLogin} ref={formRef}>
      <div className="public-mode-stack">
        <section className={`public-mode-card public-mode-card-advanced ${mode === "advanced" ? "is-open" : ""}`}>
          <button
            aria-controls="advanced-research-mode"
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
            <div className="public-mode-content" id="advanced-research-mode">
              <ResearchIntakeForm onChange={setIntake} showResearchType value={intake} />
            </div>
          ) : null}
        </section>

        <section className={`public-mode-card public-mode-card-quick ${mode === "quick" ? "is-open" : ""}`}>
          <button
            aria-controls="quick-research-mode"
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
            <div className="public-mode-content" id="quick-research-mode">
              <ResearchPromptInput id="quick-research-prompt" onChange={setQuickPrompt} onEnter={handleQuickEnter} onSuggestionSelect={handleQuickSuggestionSelect} value={quickPrompt} />
              <p className="public-mode-hint">A IA organiza o roteiro inicial e você poderá revisar as propostas nos cards seguintes.</p>
            </div>
          ) : null}
        </section>
      </div>
      {error ? <p className="research-intake-error" role="alert">{error}</p> : null}
      <div className="quick-start-toolbar quick-start-toolbar-simple">
        <span>{mode === "quick" ? "Enter para continuar · Shift + Enter para nova linha" : mode === "advanced" ? "Responda às cinco perguntas · Enter na pergunta final para continuar" : "Abra uma opção para começar"}</span>
        <button aria-busy={continuing} disabled={continuing || mode === null} type="submit">{continuing ? "Continuando…" : authenticated ? "Gerar mapa" : "Continuar com Google"}<span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}
