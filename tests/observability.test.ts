import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../app/api/health/route";
import {
  attachRequestId,
  getRequestId,
  logOperationalEvent,
  startRequest,
} from "../lib/observability/request-context";
import { getProviderHealth } from "../lib/observability/provider-health";

test("correlation IDs are safe, propagated and generated when necessary", () => {
  const supplied = new Request("https://mapadapesquisa.com.br/api/health", {
    headers: { "x-request-id": "e2e-check:2026.08.23" },
  });
  assert.equal(getRequestId(supplied), "e2e-check:2026.08.23");

  const generated = getRequestId(new Request("https://mapadapesquisa.com.br/api/health", {
    headers: { "x-request-id": "<script>alert(1)</script>" },
  }));
  assert.match(generated, /^[0-9a-f-]{36}$/);

  const response = attachRequestId(new Response(null), generated);
  assert.equal(response.headers.get("x-request-id"), generated);
  assert.equal(startRequest(supplied).requestId, "e2e-check:2026.08.23");
});

test("provider health exposes only configuration state", () => {
  const previous = {
    gemini: process.env.GEMINI_API_KEY,
    resend: process.env.RESEND_API_KEY,
    researchStarter: process.env.RESEARCH_STARTER_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    projectRef: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF,
  };
  process.env.GEMINI_API_KEY = "secret-gemini";
  process.env.RESEND_API_KEY = "secret-resend";
  process.env.RESEARCH_STARTER_API_KEY = "secret-rs";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://aeaweherkrqmlqnxsmib.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF = "aeaweherkrqmlqnxsmib";
  try {
    assert.deepEqual(getProviderHealth(), {
      gemini: "configured",
      resend: "configured",
      researchStarter: "configured",
      supabase: "configured",
    });
  } finally {
    for (const [name, value] of Object.entries({
      GEMINI_API_KEY: previous.gemini,
      RESEND_API_KEY: previous.resend,
      RESEARCH_STARTER_API_KEY: previous.researchStarter,
      NEXT_PUBLIC_SUPABASE_URL: previous.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: previous.supabaseKey,
      NEXT_PUBLIC_SUPABASE_PROJECT_REF: previous.projectRef,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("health endpoint returns a sanitized versioned diagnostic", async () => {
  const previous = {
    gemini: process.env.GEMINI_API_KEY,
    resend: process.env.RESEND_API_KEY,
    researchStarter: process.env.RESEARCH_STARTER_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    projectRef: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF,
  };
  process.env.GEMINI_API_KEY = "secret-gemini";
  process.env.RESEND_API_KEY = "secret-resend";
  process.env.RESEARCH_STARTER_API_KEY = "secret-rs";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://aeaweherkrqmlqnxsmib.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF = "aeaweherkrqmlqnxsmib";
  try {
    const response = GET(new Request("https://mapadapesquisa.com.br/api/health", {
      headers: { "x-request-id": "health-test-1" },
    }));
    const body = await response.json() as Record<string, unknown>;
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-health-status"), "ok");
    assert.equal(response.headers.get("x-request-id"), "health-test-1");
    assert.equal(body.service, "mapa-da-pesquisa");
    assert.equal(body.status, "ok");
    assert.match(String(body.version), /^v\d{8}\.\d+$/);
    assert.doesNotMatch(JSON.stringify(body), /secret-/);
  } finally {
    for (const [name, value] of Object.entries({
      GEMINI_API_KEY: previous.gemini,
      RESEND_API_KEY: previous.resend,
      RESEARCH_STARTER_API_KEY: previous.researchStarter,
      NEXT_PUBLIC_SUPABASE_URL: previous.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: previous.supabaseKey,
      NEXT_PUBLIC_SUPABASE_PROJECT_REF: previous.projectRef,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("operational logger emits JSON without arbitrary message fields", () => {
  const previous = console.info;
  let output = "";
  console.info = (value?: unknown) => { output = String(value); };
  try {
    logOperationalEvent("test_event", { requestId: "test-1" }, { durationMs: 12, prompt: "private-content" });
    const parsed = JSON.parse(output) as Record<string, unknown>;
    assert.equal(parsed.event, "test_event");
    assert.equal(parsed.requestId, "test-1");
    assert.equal(parsed.durationMs, 12);
    assert.equal("prompt" in parsed, false);
  } finally {
    console.info = previous;
  }
});
