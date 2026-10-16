import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { boundedResearchQuery, researchStarterRequestSchema } from "../modules/research-starter/request";
import { fetchResearchStarterReport, ResearchStarterClientError, retryAfterMs } from "../modules/research-starter/client";
import { crossrefReport, crossrefSearchUrl } from "../modules/research-starter/crossref";
import { aiOperation, createOperation } from "../modules/ai/operation";
import { progressLabel, type AiProgressEvent } from "../modules/ai/contract";
import { discoveryReferenceSchema } from "../modules/research-workflow/schema";

const originalFetch = globalThis.fetch;
const keyBefore = process.env.RESEARCH_STARTER_MAPA_API_KEY;
afterEach(() => { globalThis.fetch = originalFetch; if (keyBefore === undefined) delete process.env.RESEARCH_STARTER_MAPA_API_KEY; else process.env.RESEARCH_STARTER_MAPA_API_KEY = keyBefore; });
const request = { topic: "graphene lithium batteries", maxReferences: 3, maxTopPapers: 2, includeMarkdown: false };
const record = { DOI: "10.1234/synthetic-only", title: ["Graphene for lithium batteries"], author: [{ given: "Synthetic", family: "Author" }], published: { "date-parts": [[2025, 2]] }, "container-title": ["Synthetic fixture"], abstract: "<p>Graphene lithium batteries.</p>" };
const catalogue = { status: "ok", message: { items: [record] } };
const primary = () => { const result = crossrefReport(catalogue, request); delete result.retrievalProvider; return { ...result, status: "completed" }; };
const json = (body: unknown, status = 200, headers?: HeadersInit) => Response.json(body, { status, headers });
function mockFetch(implementation: typeof fetch) { process.env.RESEARCH_STARTER_MAPA_API_KEY = "synthetic-secret-never-send"; globalThis.fetch = implementation; }

test("C120: a 240-character legacy query fits the v1 180-character contract without changing its source", async () => {
  const topic = "graphene lithium batteries electrodes energy storage performance durability sustainability ".repeat(3).slice(0, 240);
  const input = { ...request, topic };
  let body: Record<string, unknown> | null = null;
  mockFetch(async (url, init) => {
    assert.equal(String(url), "https://researchstarter.vercel.app/api/v1/reports");
    assert.equal(init?.redirect, "error");
    body = JSON.parse(String(init?.body));
    assert.ok(String(body!.topic).length <= 180);
    return json(primary());
  });
  const report = await fetchResearchStarterReport(input);
  assert.equal(input.topic, topic); assert.equal(report.retrievalProvider, "research_starter");
  assert.equal(body!.topic, boundedResearchQuery(topic));
  assert.equal(boundedResearchQuery("  graphene\n lithium   batteries "), request.topic);
  assert.equal(boundedResearchQuery("a".repeat(240)).length, 180);
});

test("C120: validates request before any network call, including reversed dates", async () => {
  mockFetch(async () => assert.fail("must not fetch"));
  for (const input of [{ ...request, topic: " " }, { ...request, maxReferences: 81 }, { ...request, publicationInterval: { kind: "custom" as const, startDate: "2026-12-31", endDate: "2025-01-01" } }]) {
    await assert.rejects(() => fetchResearchStarterReport(input), e => e instanceof ResearchStarterClientError && e.code === "invalid-request");
  }
  assert.ok(researchStarterRequestSchema.safeParse(request).success);
});

test("C120: retries a connection failure and recovers on the primary without fallback", async () => {
  let calls = 0;
  mockFetch(async () => { calls++; if (calls === 1) throw new TypeError("fetch failed; synthetic private detail"); return json(primary()); });
  assert.equal((await fetchResearchStarterReport(request)).retrievalProvider, "research_starter"); assert.equal(calls, 2);
});

test("C120: HTML 429 respects Retry-After; uses fallback instead of retrying before the requested time", async () => {
  const calls: string[] = [];
  mockFetch(async (url, init) => {
    const host = new URL(String(url)).hostname; calls.push(host);
    if (host === "researchstarter.vercel.app") return new Response("Too many requests", { status: 429, headers: { "Retry-After": "120" } });
    assert.equal(new Headers(init?.headers).get("authorization"), null);
    assert.equal(init?.redirect, "error"); assert.equal(new URL(String(url)).searchParams.get("query.bibliographic"), request.topic);
    return json(catalogue);
  });
  const result = await fetchResearchStarterReport(request);
  assert.deepEqual(calls, ["researchstarter.vercel.app", "api.crossref.org"]);
  assert.equal(result.retrievalProvider, "crossref"); assert.equal(result.status, "partial"); assert.equal(result.analysisProvider, "local");
  assert.equal(result.keyFindings.length, 0); assert.equal(result.references[0].sources[0], "crossref"); assert.ok(result.warnings[0].includes("reduzida"));
});

test("C120: 503, malformed JSON, invalid reference records and failed reports trigger bounded fallback", async () => {
  const failures = [() => new Response("down", { status: 503 }), () => new Response("broken", { status: 200 }), () => json({ ...primary(), references: [null] }), () => json({ ...primary(), status: "failed" })];
  for (const failure of failures) {
    let primaryCalls = 0, fallbackCalls = 0;
    mockFetch(async url => { if (String(url).includes("researchstarter")) { primaryCalls++; return failure(); } fallbackCalls++; return json(catalogue); });
    const result = await fetchResearchStarterReport(request, { maxAttempts: 1 });
    assert.equal(result.retrievalProvider, "crossref"); assert.equal(primaryCalls, 1); assert.equal(fallbackCalls, 1);
  }
});

test("C120: authentication, configuration and invalid request errors are not retried or hidden by fallback", async () => {
  for (const status of [400, 401, 403]) {
    let calls = 0;
    mockFetch(async () => { calls++; return new Response("private upstream message", { status }); });
    await assert.rejects(() => fetchResearchStarterReport(request), e => e instanceof ResearchStarterClientError && !e.retryable && e.code === (status === 400 ? "invalid-request" : "unauthorized") && !e.message.includes("private"));
    assert.equal(calls, 1);
  }
  delete process.env.RESEARCH_STARTER_MAPA_API_KEY;
  globalThis.fetch = async () => assert.fail("configuration must fail before network");
  await assert.rejects(() => fetchResearchStarterReport(request), e => e instanceof ResearchStarterClientError && e.code === "not-configured");
});

test("C120: primary timeout leaves time for the alternate source", async () => {
  let calls = 0;
  mockFetch(async (url, init) => {
    calls++;
    if (String(url).includes("researchstarter")) return new Promise((_resolve, reject) => { init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason), { once: true }); });
    return json(catalogue);
  });
  // A referenced timer keeps the node test process alive during AbortSignal.timeout.
  const keepAlive = setTimeout(() => {}, 1500);
  try { assert.equal((await fetchResearchStarterReport(request, { timeoutMs: 10, maxAttempts: 1, deadline: Date.now() + 1200 })).retrievalProvider, "crossref"); }
  finally { clearTimeout(keepAlive); }
  assert.equal(calls, 2);
});

test("C120: cancellation suppresses retries and fallback, and rejects late results", async () => {
  const abort = new AbortController(); let calls = 0;
  mockFetch(async () => { calls++; abort.abort(); return json(primary()); });
  await assert.rejects(() => aiOperation.run(createOperation(abort.signal), () => fetchResearchStarterReport(request)), /cancelada/);
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(() => fetchResearchStarterReport(request, { deadline: Date.now() - 1 }), e => e instanceof ResearchStarterClientError);
  assert.equal(calls, 0);
});

test("C120: both services failing gives a recoverable sanitized error and no fake report", async () => {
  let calls = 0;
  mockFetch(async () => { calls++; throw new TypeError("SYNTHETIC_SECRET_AND_PRIVATE_QUERY"); });
  await assert.rejects(() => fetchResearchStarterReport(request, { maxAttempts: 1 }), e => e instanceof ResearchStarterClientError && e.retryable && !e.message.includes("SYNTHETIC"));
  assert.equal(calls, 2);
});

test("C120: Crossref rejects missing DOI/title, unrelated items, malformed envelopes; deduplicates and sanitizes", () => {
  const result = crossrefReport({ status: "ok", message: { items: [null, {}, { ...record, DOI: "invalid" }, { ...record, DOI: "10.1234/unrelated", title: ["Medieval architecture"], abstract: "Historical buildings" }, record, record, { ...record, DOI: "10.1234/another", title: ["<b>Graphene</b> lithium batteries"], author: [] }] } }, request);
  assert.equal(result.references.length, 2);
  assert.equal(result.references[1].title, "Graphene lithium batteries");
  assert.deepEqual(result.references[1].authors, []);
  assert.ok(result.references[0].url?.startsWith("https://doi.org/"));
  assert.throws(() => crossrefReport({ status: "ok", message: { items: [] } }, request));
  assert.throws(() => crossrefReport({ message: { items: [record] } }, request));
  assert.equal(discoveryReferenceSchema.parse({ ...result.references[0], source: "crossref" }).source, "crossref");
});

test("C120: Crossref receives date bounds, bounded result count and no credentials or whole briefing", () => {
  const url = crossrefSearchUrl({ ...request, publicationInterval: { kind: "last-10-years" } }, new Date("2026-10-16T12:00:00Z"));
  assert.equal(url.searchParams.get("filter"), "from-pub-date:2016-10-16,until-pub-date:2026-10-16");
  assert.equal(url.searchParams.get("rows"), "20"); assert.equal(url.username, "");
  assert.equal(retryAfterMs("2"), 2000); assert.equal(retryAfterMs("Fri, 16 Oct 2026 12:00:02 GMT", Date.parse("2026-10-16T12:00:00Z")), 2000); assert.equal(retryAfterMs("invalid"), 0);
});

test("C120: progress truthfully identifies Crossref without breaking the existing researching phase", async () => {
  const events: AiProgressEvent[] = [];
  mockFetch(async url => String(url).includes("researchstarter") ? new Response("down", { status: 503 }) : json(catalogue));
  await aiOperation.run(createOperation(new AbortController().signal, event => events.push(event)), () => fetchResearchStarterReport(request, { maxAttempts: 1 }));
  assert.equal(events.at(-1)?.phase, "researching"); assert.equal(events.at(-1)?.literatureSource, "crossref");
  assert.match(progressLabel(events.at(-1)!), /Crossref/);
});
