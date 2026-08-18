"use client";

import Script from "next/script";

export function GoogleAnalytics({ measurementId, nonce }: { measurementId: string; nonce?: string }) {
  if (!measurementId) return null;
  return <>
    <Script id="google-analytics" nonce={nonce} src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
    <Script id="google-analytics-config" nonce={nonce} strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}',{send_page_view:true});`}</Script>
  </>;
}
