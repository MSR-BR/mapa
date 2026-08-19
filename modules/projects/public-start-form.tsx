"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";

import { EMPTY_RESEARCH_INTAKE, composeResearchBrief, hasResearchProductType, isCompleteResearchIntake, researchIntakeSchema, type ResearchIntakeDraft } from "./research-intake";
import { ResearchIntakeForm } from "./research-intake-form";
import { ResearchPromptInput } from "./research-prompt-input";
import { trackAnalyticsEvent } from "@/modules/analytics/analytics";

export const PENDING_PROJECT_KEY = "mapa.pending-project.v1";
export const PENDING_PROJECT_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

export function PublicStartForm() {
  const router = useRouter();
  const [continuing, setContinuing] = useState(false);
  const [mode, setMode] = useState<"quick" | "advanced">("advanced");
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
          setMode("quick");
          setQuickPrompt(typeof draft.prompt === "string" ? draft.prompt : "");
        });
      } else if (draft.intake && typeof draft.intake === "object") {
        queueMicrotask(() => {
          setMode("advanced");
          setIntake({ ...EMPTY_RESEARCH_INTAKE, ...(draft.intake as Partial<ResearchIntakeDraft>) });
        });
      }
    } catch {
      localStorage.removeItem(PENDING_PROJECT_KEY);
    }
  }, []);

  function handleQuickEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function continueToLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    trackAnalyticsEvent("cta_start_map");

    try {
      localStorage.setItem(PENDING_PROJECT_KEY, JSON.stringify(mode === "quick"
        ? { mode, prompt, savedAt: Date.now() }
        : { intake: parsed.success ? parsed.data : intake, mode, prompt: composeResearchBrief(intake), savedAt: Date.now() }));
    } catch {
      setError("Não foi possível guardar o rascunho neste navegador. Verifique as permissões de armazenamento e tente novamente.");
      return;
    }
    setContinuing(true);
    router.push("/login?next=%2Fdashboard%3Fresume%3D1");
  }

  return (
    <form className="quick-start-form public-start-form" onSubmit={continueToLogin}>
      <div className="public-mode-stack">
        <section className={`public-mode-card ${mode === "quick" ? "is-open" : ""}`}>
          <button
            aria-controls="quick-research-mode"
            aria-expanded={mode === "quick"}
            className="public-mode-toggle"
            onClick={() => { setMode(mode === "quick" ? "advanced" : "quick"); setError(""); }}
            type="button"
          >
            <span>
              <small>Opção 1</small>
              <strong>Roteiro rápido</strong>
              <em>Escreva sua ideia em linguagem natural e receba sugestões enquanto digita.</em>
            </span>
            <span aria-hidden="true" className="public-mode-chevron">{mode === "quick" ? "−" : "+"}</span>
          </button>
          {mode === "quick" ? (
            <div className="public-mode-content" id="quick-research-mode">
              <ResearchPromptInput id="quick-research-prompt" onChange={setQuickPrompt} onEnter={handleQuickEnter} value={quickPrompt} />
              <p className="public-mode-hint">A IA organiza o roteiro inicial e você poderá revisar as propostas nos cards seguintes.</p>
            </div>
          ) : null}
        </section>

        <section className={`public-mode-card ${mode === "advanced" ? "is-open" : ""}`}>
          <button
            aria-controls="advanced-research-mode"
            aria-expanded={mode === "advanced"}
            className="public-mode-toggle"
            onClick={() => { setMode(mode === "advanced" ? "quick" : "advanced"); setError(""); }}
            type="button"
          >
            <span>
              <small>Opção 2 · recomendado</small>
              <strong>Construção avançada</strong>
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
      </div>
      {error ? <p className="research-intake-error" role="alert">{error}</p> : null}
      <div className="quick-start-toolbar quick-start-toolbar-simple">
        <span>{mode === "quick" ? "Enter para continuar · Shift + Enter para nova linha" : "Responda às cinco perguntas · Enter na pergunta final para continuar"}</span>
        <button disabled={continuing} type="submit">{continuing ? "Continuando…" : "Gerar mapa"}<span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}
