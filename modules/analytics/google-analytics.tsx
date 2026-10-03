"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

import { consentModeV2, safeAnalyticsPageLocation } from "./analytics";

export function GoogleAnalytics({ measurementId, nonce, adsConsent }: { measurementId: string; nonce?: string; adsConsent: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) gtag("consent", "update", consentModeV2(adsConsent));
  }, [adsConsent]);

  useEffect(() => {
    if (!measurementId) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag("event", "page_view", { page_location: safeAnalyticsPageLocation(window.location.href) });
        window.clearInterval(timer);
      } else if (++attempts >= 40) {
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [measurementId, pathname]);
  if (!measurementId) return null;
  const id = JSON.stringify(measurementId);
  const granted = JSON.stringify(consentModeV2(adsConsent));
  return <>
    <Script id="google-analytics-consent-config" nonce={nonce} strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});gtag('consent','update',${granted});gtag('js',new Date());gtag('config',${id},{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});`}</Script>
    <Script id="google-analytics" nonce={nonce} src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
  </>;
}
