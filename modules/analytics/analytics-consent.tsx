"use client";

import { useEffect, useState } from "react";

import { GoogleAnalytics } from "./google-analytics";
import { ADS_CONSENT_KEY, ANALYTICS_CONSENT_KEY, consentModeV2, setAnalyticsContext, trackAnalyticsEvent } from "./analytics";
import { createClient } from "@/lib/supabase/client";

type Preference = { analytics: boolean; ads: boolean };

export function AnalyticsConsent({ measurementId, nonce }: { measurementId: string; nonce?: string }) {
  const [choice, setChoice] = useState<Preference | null>(null);
  const [draft, setDraft] = useState<Preference>({ analytics: false, ads: false });
  const [open, setOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const analytics = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
      const ads = window.localStorage.getItem(ADS_CONSENT_KEY);
      if (analytics === "accepted" || analytics === "rejected") {
        const saved = { analytics: analytics === "accepted", ads: ads === "accepted" };
        queueMicrotask(() => { setChoice(saved); setDraft(saved); });
      } else {
        queueMicrotask(() => setOpen(true));
      }
    } catch {
      queueMicrotask(() => { setStorageError(true); setOpen(true); });
    }
    const reopen = () => setOpen(true);
    window.addEventListener("mapa:open-privacy-preferences", reopen);
    return () => window.removeEventListener("mapa:open-privacy-preferences", reopen);
  }, []);
  useEffect(() => {
    if (!choice?.analytics || !measurementId) return;
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
      setAnalyticsContext({ app_auth_state: "authenticated" });
      let attempts = 0;
      const send = () => {
        if (!active) return;
        if (typeof (window as Window & { gtag?: unknown }).gtag === "function") {
          try { window.sessionStorage.setItem(sessionKey, "1"); } catch { /* best effort */ }
          trackAnalyticsEvent("login_success", { app_auth_state: "authenticated", app_surface: "unknown" });
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
          trackAnalyticsEvent("logout", { app_auth_state: "authenticated" });
        }
        try { window.sessionStorage.removeItem(sessionKey); } catch { /* best effort */ }
        setAnalyticsContext({ app_auth_state: "anonymous", app_role: "unknown" });
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [choice?.analytics, measurementId]);
  if (!measurementId) return null;
  function save(next: Preference) {
    try {
      window.localStorage.setItem(ADS_CONSENT_KEY, next.ads ? "accepted" : "rejected");
      window.localStorage.setItem(ANALYTICS_CONSENT_KEY, next.analytics ? "accepted" : "rejected");
    } catch {
      setStorageError(true);
      return;
    }
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) gtag("consent", "update", { ...consentModeV2(next.ads), analytics_storage: next.analytics ? "granted" : "denied" });
    const changed = choice?.analytics !== next.analytics || choice?.ads !== next.ads;
    const revokedAnalytics = Boolean(choice?.analytics && !next.analytics);
    setChoice(next);
    setDraft(next);
    setOpen(false);
    setStorageError(false);
    window.dispatchEvent(new Event("mapa:privacy-preferences-saved"));
    if (changed && next.analytics) {
      let attempts = 0;
      const timer = window.setInterval(() => {
        if (trackAnalyticsEvent("consent_choice", { app_result: "accepted" }) || ++attempts >= 20) window.clearInterval(timer);
      }, 250);
    }
    // An already loaded Google script cannot be removed; reload after revocation.
    if (revokedAnalytics) window.location.reload();
  }
  return <>
    {choice?.analytics ? <GoogleAnalytics adsConsent={choice.ads} measurementId={measurementId} nonce={nonce} /> : null}
    {open ? <aside aria-label="Preferências de privacidade" className="analytics-consent" role="dialog">
      <strong>Privacidade e métricas</strong>
      <p>Escolha separadamente métricas de uso e publicidade. Nenhum conteúdo do projeto, prompt ou e-mail é enviado nos eventos.</p>
      <label><input checked={draft.analytics} onChange={(event) => setDraft({ ...draft, analytics: event.target.checked })} type="checkbox" /> Métricas de uso (GA4)</label>
      <label><input checked={draft.ads} onChange={(event) => setDraft({ ...draft, ads: event.target.checked })} type="checkbox" /> Publicidade e medição de anúncios (opcional)</label>
      <p>Personalização de anúncios permanece desativada. Ainda não há campanha de anúncios ativa no Mapa.</p>
      {storageError ? <p role="alert">Não foi possível salvar sua preferência neste navegador. Verifique o armazenamento e tente novamente.</p> : null}
      <div><button onClick={() => save({ analytics: false, ads: false })} type="button">Recusar todos</button>{choice ? <button onClick={() => setOpen(false)} type="button">Cancelar</button> : null}<button className="analytics-consent-accept" onClick={() => save(draft)} type="button">Salvar escolhas</button></div>
    </aside> : null}
  </>;
}
