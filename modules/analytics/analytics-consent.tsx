"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";
import { rememberPublicCampaign } from "./campaign-attribution";
import { hasPendingLoginAttempt, observeAuthAnalytics } from "./login-attempt";
import { GoogleAnalytics } from "./google-analytics";
import { ADS_CONSENT_KEY, ANALYTICS_CONSENT_KEY, consentModeV2, setAnalyticsContext, trackAnalyticsEvent } from "./analytics";
import { createClient } from "@/lib/supabase/client";

type Preference = { analytics: boolean; ads: boolean };

export function AnalyticsConsent({ measurementId, nonce }: { measurementId: string; nonce?: string }) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { rememberPublicCampaign(window.location.href); }, [pathname]);
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
    let timer: ReturnType<typeof setTimeout> | undefined;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setAnalyticsContext({ app_auth_state: "authenticated" });
        if (!hasPendingLoginAttempt()) return;
        let attempts = 0;
        clearTimeout(timer);
        const send = () => {
          if (!active) return;
          if (!observeAuthAnalytics(event, true) && attempts++ < 20) timer = setTimeout(send, 250);
        };
        send();
      }
      if (event === "SIGNED_OUT") {
        clearTimeout(timer);
        observeAuthAnalytics(event, false);
        setAnalyticsContext({ app_auth_state: "anonymous", app_role: "unknown" });
      }
    });
    return () => {
      active = false;
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, [choice?.analytics, measurementId]);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal();
    element.focus();
    return () => { element.close(); if (previous?.isConnected) previous.focus(); };
  }, [open]);
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
    {open ? <dialog ref={dialog} tabIndex={-1} aria-modal="true" aria-label="Preferências de privacidade" className="analytics-consent" onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]');
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    }} onCancel={(event) => { if (choice) setOpen(false); else event.preventDefault(); }}>
      <strong>Privacidade e métricas</strong>
      <p>Escolha separadamente métricas de uso e publicidade. Nenhum conteúdo do projeto, prompt ou e-mail é enviado nos eventos.</p>
      <label><input checked={draft.analytics} onChange={(event) => setDraft({ ...draft, analytics: event.target.checked })} type="checkbox" /> Métricas de uso (GA4)</label>
      <label><input checked={draft.ads} onChange={(event) => setDraft({ ...draft, ads: event.target.checked })} type="checkbox" /> Publicidade e medição de anúncios (opcional)</label>
      <p>Personalização de anúncios permanece desativada. Você pode revisar ou revogar estas escolhas a qualquer momento.</p>
      {storageError ? <p role="alert">Não foi possível salvar sua preferência neste navegador. Verifique o armazenamento e tente novamente.</p> : null}
      <div><button onClick={() => save({ analytics: false, ads: false })} type="button">Recusar todos</button>{choice ? <button onClick={() => setOpen(false)} type="button">Cancelar</button> : null}<button className="analytics-consent-accept" onClick={() => save({ analytics: true, ads: false })} type="button">Aceitar métricas</button><button onClick={() => save(draft)} type="button">Salvar escolhas</button></div>
    </dialog> : null}
  </>;
}
