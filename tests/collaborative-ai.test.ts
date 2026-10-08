import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import type { LanguageModelUsage } from "ai";
import { generateStructured, productionDependencies, type GenerationDependencies } from "../modules/ai/generate";
import { AiError, canFallback, classifyAiFailure } from "../modules/ai/failure";
import { aiOperation, assertOperationActive, createOperation, emitProgress } from "../modules/ai/operation";
import { withAiProgress } from "../modules/ai/route";
import { readProgressResponse } from "../modules/ai/progress-client";
import { progressLabel, type AiProgressEvent } from "../modules/ai/contract";

const schema = z.object({ content: z.string().min(4), referenceIds: z.array(z.string()) });
const request = { operation: "generate_general_objective" as const, schema, prompt: "SYNTHETIC_PRIVATE_PROMPT" };
const output = { content: "Analisar a relação delimitada na pesquisa.", referenceIds: ["ref-1"] };
const usage: LanguageModelUsage = { inputTokens: 100, outputTokens: 50, totalTokens: 150,
  inputTokenDetails: { noCacheTokens: 100, cacheReadTokens: undefined, cacheWriteTokens: undefined },
  outputTokenDetails: { textTokens: 50, reasoningTokens: undefined },
};
function result(provider: string) { return { output, totalUsage: usage, response: { modelId: provider === "gemini" ? "gemini-3.6-flash" : "gpt-6-luna" }, finishReason: "stop" }; }
process.env.GEMINI_API_KEY = "synthetic-gemini-key";
process.env.OPENAI_API_KEY = "synthetic-openai-key";
process.env.MAPA_OPENAI_ENABLED = "true";
process.env.GEMINI_MODEL = "gemini-3.6-flash";
process.env.OPENAI_MODEL = "gpt-6-luna";

test("C112: transient errors switch provider once, preserving operation and actual progress", async () => {
  for (const error of [{ statusCode: 429 }, { statusCode: 503 }, { name: "TimeoutError" }]) {
    const calls: string[] = [], events: AiProgressEvent[] = []; let reservations = 0;
    const dependencies: GenerationDependencies = { reserve: async () => { reservations++; }, invoke: async ({ provider }) => { calls.push(provider); if (calls.length === 1) throw error; return result(provider); } };
    const state = createOperation(new AbortController().signal, (event) => events.push(event));
    const value = await aiOperation.run(state, () => generateStructured(request, dependencies));
    assert.equal(value.provider, "openai"); assert.deepEqual(calls, ["gemini", "openai"]); assert.equal(reservations, 1);
    assert.equal(new Set(events.map((event) => event.operationId)).size, 1);
    assert.deepEqual(events.map((e) => e.sequence), [1, 2, 3]);
    assert.equal(progressLabel(events[1]), "Continuando com GPT…");
    assert.equal(state.lastGenerator, "openai");
  }
});
test("C112: auth, refusal, quota and application budget cannot trigger alternate spending", async () => {
  for (const failure of [{ statusCode: 401 }, { statusCode: 403 }, { statusCode: 400 }, new AiError("refusal"), new AiError("budget"), { statusCode: 429, data: { error: { code: "insufficient_quota" } } }]) {
    let calls = 0;
    await assert.rejects(() => generateStructured(request, { reserve: async () => assert.fail("unexpected reservation"), invoke: async () => { calls++; throw failure; } }));
    assert.equal(calls, 1);
  }
  let calls = 0;
  await assert.rejects(() => generateStructured({ ...request, provider: "openai" }, { reserve: async () => { throw new AiError("budget"); }, invoke: async () => { calls++; return result("openai"); } }), /limite/);
  assert.equal(calls, 0);
});
test("C112: malformed output and foreign reference IDs get only one repair, no unvalidated result", async () => {
  let calls = 0;
  await assert.rejects(() => generateStructured({ ...request, validate(value) { if (value.referenceIds.includes("foreign")) throw new AiError("invalid_output"); } }, {
    reserve: async () => {}, invoke: async ({ provider }) => { calls++; return { ...result(provider), output: { ...output, referenceIds: ["foreign"] } }; },
  }));
  assert.equal(calls, 2);
});
test("C112: cancellation after provider completion rejects late content before persistence", async () => {
  const controller = new AbortController(); let persisted = false;
  await assert.rejects(() => aiOperation.run(createOperation(controller.signal), async () => {
    await generateStructured(request, { reserve: async () => {}, invoke: async ({ provider }) => { controller.abort(); return result(provider); } });
    assertOperationActive(); persisted = true;
  }), /cancelada/);
  assert.equal(persisted, false);
});
test("C112: global attempt limit includes different operations and reviewer calls", async () => {
  const state = createOperation(new AbortController().signal); let calls = 0;
  const dependencies: GenerationDependencies = { reserve: async () => {}, invoke: async ({ provider }) => { calls++; return result(provider); } };
  await aiOperation.run(state, async () => {
    for (const operation of ["generate_general_objective", "generate_specific_objectives", "review_workflow_impact"] as const) {
      for (let i = 0; i < 2; i++) await generateStructured({ ...request, operation, role: i ? "reviewer" : "generator" }, dependencies);
    }
    await assert.rejects(() => generateStructured({ ...request, operation: "generate_methodology_plan" }, dependencies));
  });
  assert.equal(calls, 6);
});
test("C112: rollback flag retains Gemini and performs zero OpenAI calls", async () => {
  process.env.MAPA_OPENAI_ENABLED = "false";
  try {
    const calls: string[] = [];
    const value = await generateStructured(request, { reserve: async () => assert.fail(), invoke: async ({ provider }) => { calls.push(provider); return result(provider); } });
    assert.equal(value.provider, "gemini"); assert.deepEqual(calls, ["gemini"]);
  } finally { process.env.MAPA_OPENAI_ENABLED = "true"; }
});
test("C112: observations omit content/secrets and report unknown usage as null", async () => {
  const logs: string[] = []; const original = console.info; console.info = (line) => logs.push(String(line));
  try {
    await generateStructured(request, { reserve: async () => {}, invoke: async ({ provider }) => ({ ...result(provider), totalUsage: { inputTokenDetails: {}, outputTokenDetails: {} } as LanguageModelUsage }) });
  } finally { console.info = original; }
  const log = JSON.parse(logs[0]); assert.equal(log.inputTokens, null); assert.equal(log.estimatedCostUsd, null);
  assert.equal(log.role, "generator"); assert.doesNotMatch(logs.join(""), /SYNTHETIC_PRIVATE_PROMPT|synthetic-.*key|relação delimitada/);
});
test("C112: streamed result waits for confirmed save and retains HTTP authorization failures", async () => {
  let saved = false; const events: AiProgressEvent[] = [];
  const handler = withAiProgress(async () => { emitProgress("generating", "gemini"); emitProgress("saving"); await Promise.resolve(); saved = true; return Response.json({ saved }); });
  const response = await handler(new Request("https://mapa.test/api", { headers: { Accept: "application/x-ndjson" } }), undefined);
  const parsed = await readProgressResponse(response, (event) => { if (event.phase === "completed") assert.equal(saved, true); events.push(event); });
  assert.deepEqual(await parsed.json(), { saved: true }); assert.equal(events.at(-1)?.phase, "completed");
  const denied = withAiProgress(async () => Response.json({ error: "forbidden" }, { status: 403 }));
  const denial = await readProgressResponse(await denied(new Request("https://mapa.test", { headers: { Accept: "application/x-ndjson" } }), undefined), () => {});
  assert.equal(denial.status, 403);
});
test("C112: disconnect and alien/out-of-order events cannot report false success", async () => {
  const id = crypto.randomUUID(), alien = crypto.randomUUID(); const accepted: string[] = [];
  const event = (operationId: string, sequence: number, provider: "gemini" | "openai") => ({ type: "progress", event: { operationId, sequence, provider, phase: "generating", state: "running" } });
  const lines = [event(id, 2, "gemini"), event(alien, 3, "openai"), event(id, 1, "openai")].map((item) => JSON.stringify(item)).join("\n") + "\n";
  await assert.rejects(() => readProgressResponse(new Response(lines, { headers: { "Content-Type": "application/x-ndjson" } }), (event) => accepted.push(event.provider!)), /conexão foi interrompida/);
  assert.deepEqual(accepted, ["gemini"]);
});
test("C112: real OpenAI adapter recognizes completed refusal without attempting Gemini", async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ id: "resp_test", status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "synthetic-refusal" }] }] }); };
  try {
    await assert.rejects(() => generateStructured({ ...request, provider: "openai" }, { ...productionDependencies, reserve: async () => {} }), (error) => classifyAiFailure(error) === "refusal");
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
test("C112: failure classification does not inspect or expose arbitrary error messages", () => {
  assert.equal(classifyAiFailure({ message: "secret token 123" }), "unknown");
  assert.equal(canFallback("refusal"), false); assert.equal(canFallback("budget"), false);
});

test("C112: global cost reservation stops a call before any provider is invoked", async () => {
  const state = createOperation(new AbortController().signal); state.reservedMicros = 499999;
  await aiOperation.run(state, () => assert.rejects(() => generateStructured(request, {
    reserve: async () => assert.fail(), invoke: async () => { assert.fail("unexpected provider call"); },
  }), /limite/));
});

test("C112: two concurrent operations keep progress and context isolated", async () => {
  const first: AiProgressEvent[] = [], second: AiProgressEvent[] = [];
  await Promise.all([first, second].map((events, index) => aiOperation.run(createOperation(new AbortController().signal, (e) => events.push(e)), () => generateStructured({ ...request, provider: index ? "openai" : "gemini" }, {
    reserve: async () => {}, invoke: async ({ provider }) => { await Promise.resolve(); return result(provider); },
  }))));
  assert.notEqual(first[0].operationId, second[0].operationId);
  assert.equal(first[0].provider, "gemini"); assert.equal(second[0].provider, "openai");
});

test("C112: reviewer failure and disabled flag preserve the generated proposal; save calls no reviewer", async () => {
  const { reviewWorkflowProposal } = await import("../modules/ai/review");
  const { versionedWorkflowFixture } = await import("./fixtures/versioned-workflow");
  const base = versionedWorkflowFixture();
  const edit = { base, content: structuredClone(base.content), step: "methodology_matrix" as const, action: "regenerate", sourceRevision: base.sourceRevision, state: base.state, stableState: base.stableState };
  const before = JSON.stringify(edit);
  const state = createOperation(new AbortController().signal); state.lastGenerator = "gemini";
  process.env.MAPA_AI_CROSS_REVIEW_ENABLED = "true";
  try {
    await aiOperation.run(state, async () => {
      const failed = await reviewWorkflowProposal(edit, async () => { throw new AiError("unavailable"); });
      assert.equal(failed?.status, "unavailable"); assert.equal(failed?.provider, "openai"); assert.deepEqual(failed?.findings, []);
      assert.equal(JSON.stringify(edit), before);
      const saved = await reviewWorkflowProposal({ ...edit, action: "save" }, async () => assert.fail("save must not call AI"));
      assert.equal(saved, null);
      process.env.MAPA_AI_CROSS_REVIEW_ENABLED = "false";
      const disabled = await reviewWorkflowProposal(edit, async () => assert.fail());
      assert.equal(disabled?.status, "disabled");
    });
  } finally { delete process.env.MAPA_AI_CROSS_REVIEW_ENABLED; }
});

test("C112: both real SDK adapters parse the same domain contract and keep provider options separate", async () => {
  const original = globalThis.fetch;
  for (const provider of ["gemini", "openai"] as const) {
    let sent: Record<string, unknown> | undefined;
    globalThis.fetch = async (_input, init) => {
      sent = JSON.parse(String(init?.body));
      return Response.json(provider === "openai" ? {
        id: "resp_synthetic", created_at: 1791320000, model: "gpt-6-luna", status: "completed",
        output: [{ id: "msg_synthetic", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(output), annotations: [] }] }],
        usage: { input_tokens: 100, output_tokens: 50 },
      } : {
        candidates: [{ index: 0, content: { role: "model", parts: [{ text: JSON.stringify(output) }] }, finishReason: "STOP" }],
        modelVersion: "gemini-3.6-flash", usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50, totalTokenCount: 150 },
      });
    };
    try {
      const value = await generateStructured({ ...request, provider, allowFallback: false }, { ...productionDependencies, reserve: async () => {} });
      assert.deepEqual(value.output, output);
      if (provider === "openai") {
        assert.equal(sent?.store, false); assert.equal(sent?.service_tier, "default");
        assert.deepEqual(sent?.reasoning, { effort: "low" }); assert.equal(sent?.generationConfig, undefined);
      } else {
        assert.equal(sent?.store, undefined); assert.equal(sent?.reasoning, undefined);
        const config = sent?.generationConfig as Record<string, unknown>;
        assert.equal(config.maxOutputTokens, 700);
        assert.equal(config.responseMimeType, "application/json");
        assert.ok(config.responseSchema);
        assert.deepEqual(config.thinkingConfig, { thinkingLevel: "minimal" });
        assertNoDeprecatedGeminiControls(sent);
      }
    } finally { globalThis.fetch = original; }
  }
});

function assertNoDeprecatedGeminiControls(body: unknown) {
  // Inspect property names recursively, not words that might occur in a prompt.
  const forbidden = new Set(["temperature", "topP", "top_p", "topK", "top_k", "thinkingBudget", "thinking_budget"]);
  if (!body || typeof body !== "object") return;
  for (const [key, value] of Object.entries(body)) {
    assert.equal(forbidden.has(key), false, `Unexpected Gemini control: ${key}`);
    assertNoDeprecatedGeminiControls(value);
  }
}

test("C113: verification script serializes compatible controls without a network call", async () => {
  const originalFetch = globalThis.fetch;
  const originalModel = process.env.GEMINI_MODEL;
  for (const model of ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-2.5-flash"]) {
    process.env.GEMINI_MODEL = model;
    let calls = 0;
    globalThis.fetch = async (input, init) => {
      calls++;
      assert.equal(String(input), `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
      const sent = JSON.parse(String(init?.body));
      const config = sent.generationConfig;
      assert.equal(config.maxOutputTokens, 512);
      assert.equal(config.responseMimeType, "application/json");
      assert.ok(config.responseSchema);
      if (model === "gemini-2.5-flash") {
        assert.equal(config.temperature, 0);
        delete config.temperature;
      }
      assertNoDeprecatedGeminiControls(sent);
      assert.deepEqual(config.thinkingConfig, model === "gemini-3.6-flash" ? { thinkingLevel: "minimal" } : undefined);
      return Response.json({
        candidates: [{ content: { role: "model", parts: [{ text: JSON.stringify({ chapterCount: 5, schemaVersion: "1.0.0" }) }] }, finishReason: "STOP" }],
        modelVersion: model,
      });
    };
    try {
      // No --env-file: this test process supplies only synthetic provider keys.
      await import(`../scripts/verify-gemini.mjs?offline-contract=${model}`);
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
      process.env.GEMINI_MODEL = originalModel;
    }
  }
});

test("C113: unsupported model overrides fail before transport or additional spending", async () => {
  const originalModel = process.env.GEMINI_MODEL;
  try {
    for (const model of ["gemini-3.8-flash", "gemini-2.5-flash"]) {
      process.env.GEMINI_MODEL = model;
      await assert.rejects(() => generateStructured(request, {
        invoke: async () => assert.fail("unapproved model must not reach the provider"),
        reserve: async () => assert.fail("unapproved model must not reserve additional budget"),
      }), (error) => classifyAiFailure(error) === "configuration");
    }
  } finally { process.env.GEMINI_MODEL = originalModel; }
});

test("C113: real Gemini adapter treats parameter HTTP 400 as configuration without retry or fallback", async () => {
  const originalFetch = globalThis.fetch;
  const originalInfo = console.info;
  const logs: string[] = [];
  console.info = (line) => logs.push(String(line));
  try {
    for (const parameter of ["thinking_budget", "thinkingBudget", "temperature", "top_p", "topP", "top_k", "topK", "thinking_level", "thinkingLevel"]) {
      let calls = 0;
      globalThis.fetch = async (input, init) => {
        calls++;
        assert.match(String(input), /gemini-3\.6-flash:generateContent$/);
        assertNoDeprecatedGeminiControls(JSON.parse(String(init?.body)));
        return Response.json({ error: { code: 400, status: "INVALID_ARGUMENT", message: `Unsupported ${parameter}: SYNTHETIC_PRIVATE_PROMPT` } }, { status: 400 });
      };
      await assert.rejects(() => generateStructured(request, {
        ...productionDependencies, reserve: async () => assert.fail("configuration failure must not spend on fallback"),
      }), (error) => classifyAiFailure(error) === "configuration" && !String(error).includes("SYNTHETIC_PRIVATE_PROMPT"));
      assert.equal(calls, 1);
    }
    assert.equal(logs.length, 9);
    assert.ok(logs.every((line) => JSON.parse(line).errorCode === "configuration"));
    assert.doesNotMatch(logs.join(""), /SYNTHETIC_PRIVATE_PROMPT|synthetic-.*key/);
  } finally { globalThis.fetch = originalFetch; console.info = originalInfo; }
});

test("C113: real SDK transport retains one fallback for Gemini HTTP 429/503", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const status of [429, 503]) {
      const urls: string[] = []; let reservations = 0;
      globalThis.fetch = async (input) => {
        const url = String(input); urls.push(url);
        if (url.includes("generativelanguage.googleapis.com")) {
          return Response.json({ error: { code: status, status: status === 429 ? "RESOURCE_EXHAUSTED" : "UNAVAILABLE", message: "Synthetic provider failure" } }, { status });
        }
        assert.equal(url, "https://api.openai.com/v1/responses");
        return Response.json({
          id: "resp_synthetic", created_at: 1791320000, model: "gpt-6-luna", status: "completed",
          output: [{ id: "msg_synthetic", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(output), annotations: [] }] }],
          usage: { input_tokens: 100, output_tokens: 50 },
        });
      };
      const value = await generateStructured(request, { ...productionDependencies, reserve: async () => { reservations++; } });
      assert.deepEqual(value.output, output);
      assert.equal(value.provider, "openai");
      assert.equal(urls.length, 2);
      assert.equal(reservations, 1);
    }
  } finally { globalThis.fetch = originalFetch; }
});
