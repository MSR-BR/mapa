export type AnalyticsEventName = "cta_start_map" | "login" | "stage_start" | "stage_complete" | "export_pdf";

export function trackAnalyticsEvent(name: AnalyticsEventName) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", name);
}
