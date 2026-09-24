import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../app/api/health/route";
import {
  GEMINI_OPERATIONS,
  observeGeminiGeneration,
} from "../lib/observability/gemini-usage";
import {
  attachRequestId,
  classifyOperationalError,
  getRequestId,
  logOperationalEvent,
  logSanitizedOperationalFailure,
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
    researchStarter: process.env.RESEARCH_STARTER_MAPA_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    projectRef: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF,
  };
  process.env.GEMINI_API_KEY = "secret-gemini";
  process.env.RESEND_API_KEY = "secret-resend";
  process.env.RESEARCH_STARTER_MAPA_API_KEY = "secret-rs";
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
      RESEARCH_STARTER_MAPA_API_KEY: previous.researchStarter,
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
    researchStarter: process.env.RESEARCH_STARTER_MAPA_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    projectRef: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF,
  };
  process.env.GEMINI_API_KEY = "secret-gemini";
  process.env.RESEND_API_KEY = "secret-resend";
  process.env.RESEARCH_STARTER_MAPA_API_KEY = "secret-rs";
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
      RESEARCH_STARTER_MAPA_API_KEY: previous.researchStarter,
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

test("operational failures normalize provider metadata without leaking messages", () => {
  assert.deepEqual(classifyOperationalError({
    code: "PGRST116",
    message: "private academic content",
    status: 406,
  }), {
    errorCode: "PGRST116",
    httpStatus: 406,
  });
  assert.deepEqual(classifyOperationalError({
    code: "unsafe code with private text",
    message: "private academic content",
    status: 999,
  }), {
    errorCode: "unexpected",
  });

  const previous = console.error;
  let output = "";
  console.error = (value?: unknown) => { output = String(value); };
  try {
    logSanitizedOperationalFailure(
      "test_failure",
      { requestId: "test-2" },
      { code: "provider_error", message: "private academic content", statusCode: 503 },
      {
        errorCode: "unsafe code with private text",
        httpStatus: 999,
        projectCount: 2,
        userId: "private-user",
      },
    );
    const parsed = JSON.parse(output) as Record<string, unknown>;
    assert.equal(parsed.event, "test_failure");
    assert.equal(parsed.errorCode, "provider_error");
    assert.equal(parsed.httpStatus, 503);
    assert.equal(parsed.projectCount, 2);
    assert.equal("message" in parsed, false);
    assert.equal("userId" in parsed, false);
    assert.doesNotMatch(output, /private academic content|private-user/);
  } finally {
    console.error = previous;
  }
});

test("Gemini observer records usage without logging generated content", async () => {
  const previous = console.info;
  let output = "";
  console.info = (value?: unknown) => { output = String(value); };
  try {
    const result = await observeGeminiGeneration({
      configuredModel: "gemini-3.6-flash",
      maxOutputTokens: 500,
      operation: "suggest_research_prompts",
    }, async () => ({
      finishReason: "stop" as const,
      output: "private-academic-content",
      response: { modelId: "gemini-3.6-flash" },
      totalUsage: {
        inputTokenDetails: {
          cacheReadTokens: 4,
          cacheWriteTokens: 2,
          noCacheTokens: 96,
        },
        inputTokens: 100,
        outputTokenDetails: {
          reasoningTokens: 20,
          textTokens: 60,
        },
        outputTokens: 80,
        totalTokens: 180,
      },
      warnings: [],
    }));

    assert.equal(result.output, "private-academic-content");
    const parsed = JSON.parse(output) as Record<string, unknown>;
    assert.equal(parsed.event, "gemini_generation_completed");
    assert.equal(parsed.operation, "suggest_research_prompts");
    assert.equal(parsed.inputTokens, 100);
    assert.equal(parsed.outputTokens, 80);
    assert.equal(parsed.reasoningTokens, 20);
    assert.equal(parsed.totalTokens, 180);
    assert.equal(parsed.status, "succeeded");
    assert.doesNotMatch(output, /private-academic-content/);
  } finally {
    console.info = previous;
  }
});

test("Gemini observer classifies failures without logging provider messages", async () => {
  const previous = console.error;
  let output = "";
  console.error = (value?: unknown) => { output = String(value); };
  try {
    const providerError = Object.assign(
      new Error("secret-key-and-private-prompt"),
      { statusCode: 429 },
    );

    await assert.rejects(
      observeGeminiGeneration({
        configuredModel: "gemini-3.6-flash",
        maxOutputTokens: 700,
        operation: "generate_general_objective",
      }, async () => {
        throw providerError;
      }),
      providerError,
    );

    const parsed = JSON.parse(output) as Record<string, unknown>;
    assert.equal(parsed.event, "gemini_generation_failed");
    assert.equal(parsed.errorCode, "rate_limited");
    assert.equal(parsed.httpStatus, 429);
    assert.equal(parsed.status, "failed");
    assert.doesNotMatch(output, /secret-key-and-private-prompt/);
  } finally {
    console.error = previous;
  }
});

test("Gemini operation inventory is unique and complete", () => {
  assert.equal(GEMINI_OPERATIONS.length, 13);
  assert.equal(new Set(GEMINI_OPERATIONS).size, 13);
});
