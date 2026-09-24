import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_CONSENT_KEY,
  getAnalyticsWorkflowPosition,
  getReferenceCountBucket,
  setAnalyticsContext,
  trackAnalyticsEvent,
} from "../modules/analytics/analytics";

function installWindow(consent: string | null) {
  const calls: unknown[][] = [];
  const storage = new Map<string, string>();
  if (consent) storage.set(ANALYTICS_CONSENT_KEY, consent);
  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
  };
  const windowValue = { localStorage, gtag: (...args: unknown[]) => calls.push(args) };
  Object.defineProperty(globalThis, "window", { configurable: true, value: windowValue });
  return calls;
}

test("analytics does not send events before consent", () => {
  const calls = installWindow(null);
  trackAnalyticsEvent("project_start", { app_surface: "home" });
  assert.equal(calls.length, 0);
  delete (globalThis as { window?: unknown }).window;
});

test("analytics sends only enumerated parameters and never free text", () => {
  const calls = installWindow("accepted");
  setAnalyticsContext({ app_auth_state: "anonymous", app_role: "unknown", app_surface: "home" });
  trackAnalyticsEvent("generation_failed", {
    app_stage: "discovery",
    app_reason_code: "this-is-not-a-valid-code" as never,
    app_result: "failed",
    app_surface: "https://example.com/prompt?secret=1" as never,
  });
  assert.equal(calls.length, 1);
  const params = calls[0]?.[2] as Record<string, string>;
  assert.equal(params.app_stage, "discovery");
  assert.equal(params.app_result, "failed");
  assert.equal(params.app_reason_code, "unknown");
  assert.equal(params.app_surface, "unknown");
  assert.equal("source" in params, false);
  assert.equal("stage_number" in params, false);
  assert.equal(Object.values(params).some((value) => value.includes("example.com") || value.includes("secret")), false);
  delete (globalThis as { window?: unknown }).window;
});

test("analytics accepts Google as the only social provider", () => {
  const calls = installWindow("accepted");
  trackAnalyticsEvent("login_started", { app_result: "started", app_surface: "google" });
  assert.equal((calls[0]?.[2] as Record<string, string>).app_surface, "google");
  delete (globalThis as { window?: unknown }).window;
});

test("reference buckets are stable and bounded", () => {
  assert.equal(getReferenceCountBucket(0), "0");
  assert.equal(getReferenceCountBucket(3), "1_5");
  assert.equal(getReferenceCountBucket(20), "6_20");
  assert.equal(getReferenceCountBucket(21), "21_plus");
  assert.equal(getReferenceCountBucket(Number.NaN), "unknown");
});

test("workflow analytics separates four macro stages from internal steps", () => {
  assert.deepEqual(getAnalyticsWorkflowPosition("problem_statement"), {
    app_macro_stage: "1", app_stage: "problem", app_step: "problem_statement",
  });
  assert.equal(getAnalyticsWorkflowPosition("general_objective").app_macro_stage, "2");
  assert.deepEqual(getAnalyticsWorkflowPosition("development_topics"), {
    app_macro_stage: "3", app_stage: "literature", app_step: "development_topics",
  });
  assert.equal(getAnalyticsWorkflowPosition("methodology_matrix").app_macro_stage, "4");
  assert.deepEqual(getAnalyticsWorkflowPosition("final_map"), {
    app_macro_stage: "4", app_stage: "final", app_step: "final_map",
  });
});
