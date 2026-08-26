"use client";

import { useEffect } from "react";
import Script from "next/script";

import { trackAnalyticsEvent } from "./analytics";

export function GoogleAnalytics({ measurementId, nonce }: { measurementId: string; nonce?: string }) {
  useEffect(() => {
    if (!measurementId) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (typeof (window as Window & { gtag?: unknown }).gtag === "function") {
        window.clearInterval(timer);
        trackAnalyticsEvent("consent_choice", { result: "accepted", auth_state: "anonymous", profile_role: "unknown" });
      } else if (attempts >= 20) {
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [measurementId]);
  if (!measurementId) return null;
  const safeMeasurementId = JSON.stringify(measurementId);
  return <>
    <Script id="google-analytics" nonce={nonce} src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
    <Script id="google-analytics-config" nonce={nonce} strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config',${safeMeasurementId},{send_page_view:true});`}</Script>
  </>;
}
