import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit, getAuthenticatedClientKey } from "../lib/security/rate-limit";
import { AiError, aiErrorStatus, retryAfterSecondsFromAiFailure } from "../modules/ai/failure";

test("C133: 50 students sharing one classroom IP receive independent optional AI controls", async () => {
  const now = 100_000;
  const keys = Array.from({ length: 50 }, (_, n) => getAuthenticatedClientKey("prompt-suggestions", `student-${n}`));
  const first = await Promise.all(keys.map(async key => checkRateLimit(key, 15, 60_000, now)));
  assert.ok(first.every(result => result.allowed));
  const oneStudent = keys[0];
  for (let n = 0; n < 14; n++) assert.equal(checkRateLimit(oneStudent, 15, 60_000, now).allowed, true);
  const exhausted = checkRateLimit(oneStudent, 15, 60_000, now);
  assert.equal(exhausted.allowed, false);
  assert.equal(exhausted.retryAfterSeconds, 60);
  assert.equal(checkRateLimit(keys[1], 15, 60_000, now).allowed, true);
  assert.equal(checkRateLimit(oneStudent, 15, 60_000, now + 60_000).allowed, true);
});

test("C133/C134: provider throttling carries bounded Retry-After; budget and quota remain distinct", () => {
  assert.equal(retryAfterSecondsFromAiFailure({ responseHeaders: { "Retry-After": "23" } }), 23);
  assert.equal(retryAfterSecondsFromAiFailure({ responseHeaders: { "retry-after": "999999" } }), 3600);
  assert.equal(retryAfterSecondsFromAiFailure({ responseHeaders: { "Retry-After": "garbage" } }), undefined);
  assert.equal(aiErrorStatus(new AiError("rate_limited", 23)), 429);
  assert.equal(aiErrorStatus(new AiError("provider_quota")), 503);
  assert.equal(aiErrorStatus(new AiError("budget")), 503);
  assert.notEqual(new AiError("provider_quota").message, new AiError("budget").message);
});
