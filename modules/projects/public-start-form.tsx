"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { EMPTY_RESEARCH_INTAKE, composeResearchBrief, hasResearchProductType, researchIntakeSchema, type ResearchIntakeDraft } from "./research-intake";
import { ResearchIntakeForm } from "./research-intake-form";
import { trackAnalyticsEvent } from "@/modules/analytics/analytics";

export const PENDING_PROJECT_KEY = "mapa.pending-project.v1";
export const PENDING_PROJECT_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

export function PublicStartForm() {
  const router = useRouter();
  const [continuing, setContinuing] = useState(false);
  const [intake, setIntake] = useState<ResearchIntakeDraft>(EMPTY_RESEARCH_INTAKE);
  const [error, setError] = useState("");

  function continueToLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = researchIntakeSchema.safeParse(intake);
    if (!parsed.success) {
      setError("Preencha os cinco campos para formular a situação-problema.");
      return;
    }
    if (!hasResearchProductType(intake)) {
      setError("Escolha o tipo de produto acadêmico antes de continuar.");
      return;
    }
    trackAnalyticsEvent("cta_start_map");

    localStorage.setItem(PENDING_PROJECT_KEY, JSON.stringify({
      intake: parsed.data,
      prompt: composeResearchBrief(parsed.data),
      savedAt: Date.now(),
    }));
    setContinuing(true);
    router.push("/login?next=%2Fdashboard%3Fresume%3D1");
  }

  return (
    <form className="quick-start-form public-start-form" onSubmit={continueToLogin}>
      <ResearchIntakeForm onChange={setIntake} showResearchType value={intake} />
      {error ? <p className="research-intake-error" role="alert">{error}</p> : null}
      <div className="quick-start-toolbar quick-start-toolbar-simple">
        <span>Responda às cinco perguntas · Enter na pergunta final para continuar</span>
        <button disabled={continuing} type="submit">{continuing ? "Continuando…" : "Gerar mapa"}<span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}
