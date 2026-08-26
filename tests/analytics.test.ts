import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_CONSENT_KEY,
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
  trackAnalyticsEvent("project_start", { source: "home" });
  assert.equal(calls.length, 0);
  delete (globalThis as { window?: unknown }).window;
});

test("analytics sends only enumerated parameters and never free text", () => {
  const calls = installWindow("accepted");
  setAnalyticsContext({ auth_state: "anonymous", profile_role: "unknown", source: "home" });
  trackAnalyticsEvent("generation_failed", {
    stage: "discovery",
    reason_code: "this-is-not-a-valid-code" as never,
    result: "failed",
    source: "https://example.com/prompt?secret=1" as never,
  });
  assert.equal(calls.length, 1);
  const params = calls[0]?.[2] as Record<string, string>;
  assert.equal(params.stage, "discovery");
  assert.equal(params.result, "failed");
  assert.equal(params.reason_code, "unknown");
  assert.equal(params.source, "unknown");
  assert.equal(Object.values(params).some((value) => value.includes("example.com") || value.includes("secret")), false);
  delete (globalThis as { window?: unknown }).window;
});

test("reference buckets are stable and bounded", () => {
  assert.equal(getReferenceCountBucket(0), "0");
  assert.equal(getReferenceCountBucket(3), "1_5");
  assert.equal(getReferenceCountBucket(20), "6_20");
  assert.equal(getReferenceCountBucket(21), "21_plus");
  assert.equal(getReferenceCountBucket(Number.NaN), "unknown");
});
