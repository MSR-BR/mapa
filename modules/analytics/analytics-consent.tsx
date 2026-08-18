"use client";

import { useEffect, useState } from "react";

import { GoogleAnalytics } from "./google-analytics";
import { trackAnalyticsEvent, type AnalyticsEventName } from "./analytics";

const CONSENT_KEY = "mapa.analytics-consent.v1";

export function AnalyticsConsent({ measurementId, nonce }: { measurementId: string; nonce?: string }) {
  const [choice, setChoice] = useState<"accepted" | "rejected" | null>(null);
  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted" || stored === "rejected") {
      // The browser preference is external state; hydrate it after the first render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChoice(stored);
    }
  }, []);
  useEffect(() => {
    if (!measurementId) return;
    const handleClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-analytics-event]");
      const name = target?.dataset.analyticsEvent as AnalyticsEventName | undefined;
      if (name) trackAnalyticsEvent(name);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [measurementId]);
  if (!measurementId) return null;
  function choose(value: "accepted" | "rejected") {
    window.localStorage.setItem(CONSENT_KEY, value);
    setChoice(value);
  }
  return <>
    {choice === "accepted" ? <GoogleAnalytics measurementId={measurementId} nonce={nonce} /> : null}
    {choice === null ? <aside aria-label="Preferências de privacidade" className="analytics-consent"><strong>Privacidade e métricas</strong><p>Usamos métricas agregadas para melhorar o Mapa. Não enviamos prompts, projetos ou e-mails ao Google.</p><div><button onClick={() => choose("rejected")} type="button">Recusar</button><button className="analytics-consent-accept" onClick={() => choose("accepted")} type="button">Aceitar métricas</button></div></aside> : null}
  </>;
}
