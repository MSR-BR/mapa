import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLoginErrorPath,
  getSocialAuthErrorCode,
  isSocialAuthProviderEnabled,
  readSafeAuthDestination,
  readSocialAuthErrorCode,
  readSocialAuthProvider,
} from "../modules/auth/oauth-contract";

test("social auth accepts Google and rejects every other provider", () => {
  assert.equal(readSocialAuthProvider("google"), "google");
  assert.equal(readSocialAuthProvider("linkedin_oidc"), null);
  assert.equal(readSocialAuthProvider("linkedin"), null);
  assert.equal(readSocialAuthProvider("facebook"), null);
  assert.equal(readSocialAuthProvider(null), null);
});

test("Google auth flag fails closed", () => {
  assert.equal(isSocialAuthProviderEnabled("google", {}), false);
  assert.equal(isSocialAuthProviderEnabled("google", { GOOGLE_AUTH_ENABLED: "TRUE" }), false);
  assert.equal(isSocialAuthProviderEnabled("google", { GOOGLE_AUTH_ENABLED: "true" }), true);
});

test("auth destinations remain internal", () => {
  const fallback = "/dashboard?continue=1";
  assert.equal(readSafeAuthDestination("/dashboard/projects/123?tab=map"), "/dashboard/projects/123?tab=map");
  assert.equal(readSafeAuthDestination("https://example.com"), fallback);
  assert.equal(readSafeAuthDestination("//example.com"), fallback);
  assert.equal(readSafeAuthDestination("/\\example.com"), fallback);
  assert.equal(readSafeAuthDestination("/dashboard\nLocation:https://example.com"), fallback);
});

test("callback and login errors expose only Google or generic access", () => {
  assert.equal(getSocialAuthErrorCode("google"), "google");
  assert.equal(readSocialAuthErrorCode("linkedin"), null);
  assert.equal(readSocialAuthErrorCode("facebook"), null);
  assert.equal(buildLoginErrorPath("google", "/dashboard?continue=1"), "/login?error=google&next=%2Fdashboard%3Fcontinue%3D1");
});
