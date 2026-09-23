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

test("social auth accepts only the explicit provider allowlist", () => {
  assert.equal(readSocialAuthProvider("google"), "google");
  assert.equal(readSocialAuthProvider("linkedin_oidc"), "linkedin_oidc");
  assert.equal(readSocialAuthProvider("linkedin"), null);
  assert.equal(readSocialAuthProvider("facebook"), null);
  assert.equal(readSocialAuthProvider(null), null);
});

test("social provider flags fail closed", () => {
  assert.equal(isSocialAuthProviderEnabled("google", {}), false);
  assert.equal(isSocialAuthProviderEnabled("linkedin_oidc", {}), false);
  assert.equal(isSocialAuthProviderEnabled("linkedin_oidc", { LINKEDIN_AUTH_ENABLED: "TRUE" }), false);
  assert.equal(isSocialAuthProviderEnabled("linkedin_oidc", { LINKEDIN_AUTH_ENABLED: "true" }), true);
});

test("auth destinations remain internal", () => {
  const fallback = "/dashboard?continue=1";
  assert.equal(readSafeAuthDestination("/dashboard/projects/123?tab=map"), "/dashboard/projects/123?tab=map");
  assert.equal(readSafeAuthDestination("https://example.com"), fallback);
  assert.equal(readSafeAuthDestination("//example.com"), fallback);
  assert.equal(readSafeAuthDestination("/\\example.com"), fallback);
  assert.equal(readSafeAuthDestination("/dashboard\nLocation:https://example.com"), fallback);
});

test("callback and login errors never reflect arbitrary provider values", () => {
  assert.equal(getSocialAuthErrorCode("google"), "google");
  assert.equal(getSocialAuthErrorCode("linkedin_oidc"), "linkedin");
  assert.equal(readSocialAuthErrorCode("facebook"), null);
  assert.equal(buildLoginErrorPath("linkedin", "/dashboard?continue=1"), "/login?error=linkedin&next=%2Fdashboard%3Fcontinue%3D1");
});
