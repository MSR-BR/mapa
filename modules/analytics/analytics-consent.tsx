"use client";

import { useEffect, useState } from "react";

import { GoogleAnalytics } from "./google-analytics";
import { ANALYTICS_CONSENT_KEY, setAnalyticsContext, trackAnalyticsEvent } from "./analytics";
import { createClient } from "@/lib/supabase/client";

export function AnalyticsConsent({ measurementId, nonce }: { measurementId: string; nonce?: string }) {
  const [choice, setChoice] = useState<"accepted" | "rejected" | null>(null);
  useEffect(() => {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (stored === "accepted" || stored === "rejected") {
      // The browser preference is external state; hydrate it after the first render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChoice(stored);
    }
  }, []);
  useEffect(() => {
    if (choice !== "accepted" || !measurementId) return;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    let active = true;
    const sessionKey = "mapa.analytics-auth-session.v1";
    const emitSignedIn = () => {
      if (!active) return;
      let alreadySent = false;
      try {
        alreadySent = window.sessionStorage.getItem(sessionKey) === "1";
      } catch {
        // Storage can be unavailable in private browsing; the event remains best effort.
      }
      if (alreadySent) return;
      setAnalyticsContext({ auth_state: "authenticated" });
      let attempts = 0;
      const send = () => {
        if (!active) return;
        if (typeof (window as Window & { gtag?: unknown }).gtag === "function") {
          try { window.sessionStorage.setItem(sessionKey, "1"); } catch { /* best effort */ }
          trackAnalyticsEvent("login_success", { auth_state: "authenticated", source: "unknown" });
          return;
        }
        if (attempts++ < 20) window.setTimeout(send, 250);
      };
      send();
    };
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) emitSignedIn();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) emitSignedIn();
      if (event === "SIGNED_OUT") {
        let hadSessionEvent = false;
        try { hadSessionEvent = window.sessionStorage.getItem(sessionKey) === "1"; } catch { /* best effort */ }
        if (hadSessionEvent) {
          trackAnalyticsEvent("logout", { auth_state: "authenticated" });
        }
        try { window.sessionStorage.removeItem(sessionKey); } catch { /* best effort */ }
        setAnalyticsContext({ auth_state: "anonymous", profile_role: "unknown" });
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [choice, measurementId]);
  if (!measurementId) return null;
  function choose(value: "accepted" | "rejected") {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
    setChoice(value);
  }
  return <>
    {choice === "accepted" ? <GoogleAnalytics measurementId={measurementId} nonce={nonce} /> : null}
    {choice === null ? <aside aria-label="Preferências de privacidade" className="analytics-consent"><strong>Privacidade e métricas</strong><p>Usamos métricas agregadas para melhorar o Mapa. Não enviamos prompts, projetos ou e-mails ao Google.</p><div><button onClick={() => choose("rejected")} type="button">Recusar</button><button className="analytics-consent-accept" onClick={() => choose("accepted")} type="button">Aceitar métricas</button></div></aside> : null}
  </>;
}
