import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { mapaMetadata } from "../modules/landing/mapa-metadata";
import { beginLoginAttempt, observeAuthAnalytics, clearLoginAttempt } from "../modules/analytics/login-attempt";
import { ANALYTICS_CONSENT_KEY } from "../modules/analytics/analytics";

function browser(consent = "accepted") {
  const values = new Map([[ANALYTICS_CONSENT_KEY, consent]]);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
  const calls: unknown[][] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: storage, sessionStorage: storage, location: { href: "https://mapa.invalid/login" }, gtag: (...args: unknown[]) => calls.push(args) } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { referrer: "" } });
  return calls;
}

test("login only pairs one submitted attempt with SIGNED_IN; existing/refreshed sessions do not count", () => {
  const calls = browser();
  observeAuthAnalytics("INITIAL_SESSION", true);
  observeAuthAnalytics("SIGNED_IN", true);
  assert.equal(calls.length, 0);
  assert.equal(beginLoginAttempt(), true);
  observeAuthAnalytics("INITIAL_SESSION", true);
  observeAuthAnalytics("TOKEN_REFRESHED", true);
  assert.equal(calls.length, 1);
  assert.equal(observeAuthAnalytics("SIGNED_IN", true), true);
  assert.equal(observeAuthAnalytics("SIGNED_IN", true), false);
  assert.deepEqual(calls.map(call => call[1]), ["login_started", "login_success"]);
  observeAuthAnalytics("SIGNED_OUT", false);
  assert.equal(beginLoginAttempt(), true);
  clearLoginAttempt();
  assert.equal(observeAuthAnalytics("SIGNED_IN", true), false);
});

test("denied consent and expired attempts cannot produce login success", () => {
  const calls = browser("rejected");
  assert.equal(beginLoginAttempt(), false);
  assert.equal(observeAuthAnalytics("SIGNED_IN", true), false);
  assert.equal(calls.length, 0);
  browser();
  window.sessionStorage.setItem("mapa.analytics-login-attempt.v1", String(Date.now() - 31 * 60 * 1000));
  assert.equal(observeAuthAnalytics("SIGNED_IN", true), false);
});

test("mapa metadata is self-contained because Next shallowly replaces OpenGraph", () => {
  assert.equal(mapaMetadata.alternates?.canonical, "/mapa");
  assert.deepEqual(mapaMetadata.robots, { index: true, follow: true });
  const og = mapaMetadata.openGraph! as { siteName: string; locale: string; type: string; images: { url: string; width: number; height: number }[] };
  assert.equal(og.siteName, "Mapa da Pesquisa"); assert.equal(og.locale, "pt_BR"); assert.equal(og.type, "website");
  assert.equal(og.images[0].width, 1200); assert.equal(og.images[0].height, 630);
  assert.ok(readFileSync(`public${og.images[0].url}`).length > 0);
  assert.equal((mapaMetadata.twitter as { card: string }).card, "summary_large_image");
});
