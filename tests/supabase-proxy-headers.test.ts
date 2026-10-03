import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server.js";

import {
  applySessionResponseHeaders,
  forwardRefreshedCookieHeader,
} from "../lib/supabase/proxy-headers";

test("forwards the refreshed cookie while preserving other Proxy request headers", () => {
  const request = new NextRequest("https://example.test/dashboard", {
    headers: { cookie: "session=old" },
  });
  const forwarded = new Headers(request.headers);
  forwarded.set("x-nonce", "test-nonce");
  request.cookies.set("session", "new");

  assert.equal(forwarded.get("cookie"), "session=old");
  forwardRefreshedCookieHeader(request.headers, forwarded);
  assert.equal(forwarded.get("cookie"), "session=new");
  assert.equal(forwarded.get("x-nonce"), "test-nonce");
});

test("removes a stale forwarded cookie when the refreshed request has none", () => {
  const forwarded = new Headers({ cookie: "session=old" });
  forwardRefreshedCookieHeader(new Headers(), forwarded);
  assert.equal(forwarded.has("cookie"), false);
});

test("propagates Supabase no-cache headers with a refreshed response cookie", () => {
  const responseHeaders = new Headers({ "set-cookie": "session=new" });
  applySessionResponseHeaders({
    "Cache-Control": "private, no-store",
    Expires: "0",
    Pragma: "no-cache",
  }, responseHeaders);
  assert.equal(responseHeaders.get("cache-control"), "private, no-store");
  assert.equal(responseHeaders.get("expires"), "0");
  assert.equal(responseHeaders.get("pragma"), "no-cache");
  assert.equal(responseHeaders.get("set-cookie"), "session=new");
});
