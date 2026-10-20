import assert from "node:assert/strict";
import test from "node:test";

import {
  DISCOVERY_CLAIM_TTL_MS,
  discoveryClientFailure,
  discoveryResponseReason,
  isStaleDiscoveryClaim,
} from "../modules/research-workflow/discovery-failure";
import { WorkflowRequestError } from "../modules/research-workflow/request-failure";

test("only an expired discovery claim may be taken over", () => {
  const now = Date.parse("2026-10-20T12:00:00.000Z");
  const at = (ageMs: number) => new Date(now - ageMs).toISOString();
  assert.equal(isStaleDiscoveryClaim(at(5_000), now), false);
  assert.equal(isStaleDiscoveryClaim(at(DISCOVERY_CLAIM_TTL_MS), now), false);
  assert.equal(isStaleDiscoveryClaim(at(DISCOVERY_CLAIM_TTL_MS + 1), now), true);
  assert.equal(isStaleDiscoveryClaim("not-a-date", now), false);
  assert.ok(DISCOVERY_CLAIM_TTL_MS > 120_000, "must outlast the route's maxDuration");
});

test("authentication, authorization and concurrency failures are not reported as provider failures", () => {
  assert.equal(discoveryResponseReason(401, { code: "authentication_required" }), "auth_required");
  assert.equal(discoveryResponseReason(403, { code: "profile_required" }), "permission_denied");
  assert.equal(discoveryResponseReason(403, { code: "profile_consent_required" }), "consent_required");
  assert.equal(discoveryResponseReason(409, { code: "profile_mode_stale" }), "revision_conflict");
  assert.equal(discoveryResponseReason(409, {}), "duplicate_action");
  assert.equal(discoveryResponseReason(503, { code: "profile_unavailable" }), "unknown");
  assert.equal(discoveryResponseReason(404, {}), "unknown");
  assert.equal(discoveryResponseReason(502, {}), "unknown");
  assert.equal(discoveryResponseReason(429, {}), "rate_limited");
});

test("only error codes declared by the discover route are reported as provider outcomes", () => {
  assert.equal(discoveryResponseReason(422, { errorCode: "briefing-too-short" }), "validation");
  for (const errorCode of ["research-starter-unavailable", "research-starter-unauthorized", "research-starter-config", "gemini-unavailable", "gemini-quota-exhausted"]) {
    assert.equal(discoveryResponseReason(503, { errorCode }), "provider_unavailable", errorCode);
  }
  for (const errorCode of ["proposal-shape-invalid", "unverified-references", "research-starter-empty"]) {
    assert.equal(discoveryResponseReason(502, { errorCode }), "provider_invalid_response", errorCode);
  }
  assert.equal(discoveryResponseReason(502, { errorCode: "unexpected" }), "unknown");
  assert.equal(discoveryResponseReason(502, { errorCode: "PRIVATE" }), "unknown");
});

test("thrown failures keep a fixed Portuguese message and a truthful reason", () => {
  const network = discoveryClientFailure(new TypeError("Failed to fetch https://private.example/path"));
  assert.equal(network.reason, "network");
  assert.equal(network.cancelled, false);
  assert.equal(/Failed to fetch|private/i.test(network.message), false);

  const syntax = discoveryClientFailure(new SyntaxError("Unexpected token '<', \"<html>\" is not valid JSON"));
  assert.equal(syntax.reason, "unknown");
  assert.equal(syntax.message.includes("Unexpected token"), false);

  const cancelled = discoveryClientFailure(new WorkflowRequestError("cancelled"));
  assert.deepEqual([cancelled.cancelled, cancelled.reason], [true, "cancelled"]);
  assert.equal(discoveryClientFailure(new DOMException("aborted", "AbortError")).cancelled, true);

  const invalid = discoveryClientFailure(new WorkflowRequestError("response_invalid"));
  assert.equal(invalid.reason, "response_invalid");

  const timeout = discoveryClientFailure(new DOMException("timeout", "TimeoutError"));
  assert.deepEqual([timeout.cancelled, timeout.reason], [false, "provider_timeout"]);
  assert.match(timeout.message, /briefing foi preservado/);
});
