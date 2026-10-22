import { trackAnalyticsEvent } from "./analytics";

const ATTEMPT_KEY = "mapa.analytics-login-attempt.v1";
const SESSION_KEY = "mapa.analytics-auth-session.v1";
const ATTEMPT_TTL_MS = 30 * 60 * 1000;

export function hasPendingLoginAttempt(): boolean {
  try {
    const started = Number(window.sessionStorage.getItem(ATTEMPT_KEY));
    const age = Date.now() - started;
    return started > 0 && age >= 0 && age <= ATTEMPT_TTL_MS;
  } catch { return false; }
}

export function clearLoginAttempt() {
  try { window.sessionStorage.removeItem(ATTEMPT_KEY); } catch { /* No telemetry without storage. */ }
}

export function beginLoginAttempt(): boolean {
  // Require both consent and a queued login_started; never manufacture a matching success.
  try { window.sessionStorage.setItem(ATTEMPT_KEY, String(Date.now())); } catch { return false; }
  if (trackAnalyticsEvent("login_started", { app_result: "started", app_surface: "google" })) return true;
  clearLoginAttempt();
  return false;
}

/** Called only by the auth subscription; INITIAL_SESSION/refresh/refocus are not new logins. */
export function observeAuthAnalytics(event: string, hasSession: boolean): boolean {
  if (event === "SIGNED_IN" && hasSession && hasPendingLoginAttempt()) {
    if (!trackAnalyticsEvent("login_success", { app_result: "success", app_auth_state: "authenticated", app_surface: "google" })) return false;
    clearLoginAttempt();
    try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* best effort */ }
    return true;
  }
  if (event === "SIGNED_OUT") {
    clearLoginAttempt();
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "1") trackAnalyticsEvent("logout", { app_auth_state: "authenticated" });
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch { /* best effort */ }
  }
  return false;
}
