import assert from "node:assert/strict";
import test from "node:test";

import { retryFutureJwtRead } from "../modules/profile/future-jwt-retry";

const futureJwt = { code: "PGRST303", message: "JWT issued at future" };

test("retries only a transient future-issued JWT rejection", async () => {
  let calls = 0;
  const waits: number[] = [];
  const result = await retryFutureJwtRead(
    async () => [{ error: calls++ === 0 ? futureJwt : null }],
    async (milliseconds) => { waits.push(milliseconds); },
  );
  assert.equal(calls, 2);
  assert.deepEqual(waits, [500]);
  assert.equal(result[0].error, null);
});

test("does not retry other authentication or permission failures", async () => {
  let calls = 0;
  const result = await retryFutureJwtRead(
    async () => {
      calls++;
      return [{ error: { code: "PGRST303", message: "JWT claims validation failed" } },
        { error: { code: "42501", message: "permission denied" } }];
    },
    async () => { throw new Error("unexpected wait"); },
  );
  assert.equal(calls, 1);
  assert.equal(result[0].error?.code, "PGRST303");
});

test("fails closed after bounded retries if the JWT remains future-issued", async () => {
  let calls = 0;
  const waits: number[] = [];
  const result = await retryFutureJwtRead(
    async () => { calls++; return [{ error: futureJwt }]; },
    async (milliseconds) => { waits.push(milliseconds); },
  );
  assert.equal(calls, 4);
  assert.deepEqual(waits, [500, 1500, 3000]);
  assert.deepEqual(result[0].error, futureJwt);
});
