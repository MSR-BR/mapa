"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

import { initializeAnalyticsTag, safeAnalyticsPageContext } from "./analytics";

export function GoogleAnalytics({ measurementId, nonce, adsConsent }: { measurementId: string; nonce?: string; adsConsent: boolean }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    if (initializeAnalyticsTag(measurementId, adsConsent)) queueMicrotask(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [adsConsent, measurementId]);

  useEffect(() => {
    if (!measurementId || !ready) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag("event", "page_view", safeAnalyticsPageContext(window.location.href, document.referrer));
        window.clearInterval(timer);
      } else if (++attempts >= 40) {
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [measurementId, pathname, ready]);
  if (!measurementId || !ready) return null;
  return <Script id="google-analytics" nonce={nonce} src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />;
}
