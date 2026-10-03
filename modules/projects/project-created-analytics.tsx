"use client";

import { useEffect } from "react";

import { setAnalyticsContext, trackAnalyticsEvent, type AnalyticsEntryMode } from "@/modules/analytics/analytics";
import { useActiveProfile } from "@/modules/profile/active-profile-context";

/** The server renders this only after it has read back the newly created project. */
export function ProjectCreatedAnalytics({ projectId, entryMode }: { projectId: string; entryMode: AnalyticsEntryMode }) {
  const { activeRole } = useActiveProfile();

  useEffect(() => {
    const marker = `mapa.analytics-project-start.v1:${projectId}`;
    let attempts = 0;
    const send = () => {
      try {
        if (window.sessionStorage.getItem(marker) === "1") return true;
      } catch { /* Best effort in private browsing. */ }
      setAnalyticsContext({ app_auth_state: "authenticated", app_role: activeRole, app_surface: "dashboard", app_entry_mode: entryMode });
      const sent = trackAnalyticsEvent("project_start", { app_entry_mode: entryMode, app_role: activeRole, app_surface: "dashboard", app_result: "success" });
      if (sent) {
        try { window.sessionStorage.setItem(marker, "1"); } catch { /* Best effort. */ }
        const url = new URL(window.location.href);
        url.searchParams.delete("created");
        url.searchParams.delete("entry");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
      return sent;
    };
    if (send()) return;
    const timer = window.setInterval(() => {
      if (send() || ++attempts >= 40) window.clearInterval(timer);
    }, 250);
    const afterConsent = () => { if (send()) window.clearInterval(timer); };
    window.addEventListener("mapa:privacy-preferences-saved", afterConsent);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("mapa:privacy-preferences-saved", afterConsent);
    };
  }, [activeRole, entryMode, projectId]);

  return null;
}
