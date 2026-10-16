import "server-only";
import { setTimeout as delay } from "node:timers/promises";
import { aiOperation, assertOperationActive, emitProgress } from "@/modules/ai/operation";
import { logOperationalEvent } from "@/lib/observability/request-context";
import { readBoundedJson } from "@/modules/research-workflow/doi-lookup";
import { fetchCrossrefReport } from "./crossref";
import { researchStarterRequestSchema } from "./request";
import { researchStarterResponseSchema } from "./response";
import type { ResearchStarterRequest, ResearchStarterSuccess } from "./types";

const RESEARCH_STARTER_ENDPOINT = "https://researchstarter.vercel.app/api/v1/reports";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_ATTEMPTS = 2;
const TOTAL_SEARCH_MS = 50_000;
const FALLBACK_RESERVE_MS = 10_000;

function readResearchStarterApiKey() {
  return process.env.RESEARCH_STARTER_MAPA_API_KEY?.trim();
}
export type ResearchStarterClientErrorCode = "not-configured" | "invalid-response" | "unauthorized" | "invalid-request" | "temporary-unavailable" | "request-failed";
export class ResearchStarterClientError extends Error {
  readonly code: ResearchStarterClientErrorCode;
  readonly status: number | null;
  readonly retryable: boolean;
  constructor(message: string, options: { code: ResearchStarterClientErrorCode; status?: number | null; retryable?: boolean }) {
    super(message);
    this.name = "ResearchStarterClientError";
    this.code = options.code;
    this.status = options.status ?? null;
    this.retryable = options.retryable ?? false;
  }
}
const unavailable = () => new ResearchStarterClientError("A busca bibliográfica está temporariamente indisponível. Seu pedido foi preservado; tente novamente.", { code: "temporary-unavailable", retryable: true });
function retryableStatus(status: number) { return status === 408 || status === 429 || status >= 500; }
function requestSignal(deadline: number) {
  const operation = aiOperation.getStore();
  return AbortSignal.any([AbortSignal.timeout(Math.max(1, Math.ceil(deadline - Date.now()))), ...(operation ? [operation.signal] : [])]);
}
export function retryAfterMs(value: string | null, now = Date.now()) {
  if (!value) return 0;
  const seconds = Number(value);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now;
  return Number.isFinite(ms) ? Math.max(0, ms) : 0;
}

export async function fetchResearchStarterReport(
  input: ResearchStarterRequest,
  options: { maxAttempts?: number; requestId?: string; timeoutMs?: number; deadline?: number } = {},
): Promise<ResearchStarterSuccess> {
  assertOperationActive();
  const parsed = researchStarterRequestSchema.safeParse(input);
  if (!parsed.success) throw new ResearchStarterClientError("A consulta bibliográfica precisa ser ajustada.", { code: "invalid-request" });
  const request = parsed.data;
  const apiKey = readResearchStarterApiKey();
  if (!apiKey) throw new ResearchStarterClientError("Research Starter não está configurado.", { code: "not-configured" });
  const started = Date.now();
  const deadline = Math.min(started + TOTAL_SEARCH_MS, options.deadline ?? Infinity, aiOperation.getStore()?.deadline ?? Infinity);
  if (deadline - started < 1000) throw unavailable();
  const primaryDeadline = deadline - Math.min(FALLBACK_RESERVE_MS, (deadline - started) / 3);
  const maxAttempts = Math.max(1, Math.min(options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS, 2));
  const timeoutMs = Math.max(1, Math.min(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 45_000));
  const requestId = options.requestId ?? aiOperation.getStore()?.id ?? crypto.randomUUID();
  let lastError: ResearchStarterClientError = unavailable();

  for (let attempt = 1; attempt <= maxAttempts && Date.now() < primaryDeadline; attempt++) {
    let retryDelay = 350 * attempt;
    try {
      assertOperationActive();
      emitProgress("researching");
      const response = await fetch(RESEARCH_STARTER_ENDPOINT, {
        body: JSON.stringify(request), cache: "no-store", redirect: "error",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        method: "POST", signal: requestSignal(Math.min(primaryDeadline, Date.now() + timeoutMs)),
      });
      retryDelay = Math.max(retryDelay, retryAfterMs(response.headers.get("retry-after")));
      // Classify status before parsing: gateways may return HTML for 401/429/503.
      if (response.status === 401 || response.status === 403 || response.status === 400) {
        await response.body?.cancel();
        throw new ResearchStarterClientError("A integração bibliográfica recusou a consulta.", { code: response.status === 400 ? "invalid-request" : "unauthorized", status: response.status });
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new ResearchStarterClientError("O serviço bibliográfico não respondeu adequadamente.", { code: retryableStatus(response.status) ? "temporary-unavailable" : "request-failed", status: response.status, retryable: retryableStatus(response.status) });
      }
      let raw: unknown;
      try { raw = await readBoundedJson(response, 2_000_000); }
      catch { throw new ResearchStarterClientError("Resposta inválida do Research Starter.", { code: "invalid-response", status: response.status, retryable: true }); }
      const payload = researchStarterResponseSchema.safeParse(raw);
      if (!payload.success) throw new ResearchStarterClientError("Resposta inválida do Research Starter.", { code: "invalid-response", status: response.status, retryable: true });
      if (!payload.data.ok) {
        const code = payload.data.code;
        const permanent = code === "unauthorized" || code === "invalid-request" || code === "api-not-configured";
        throw new ResearchStarterClientError("O serviço bibliográfico não concluiu a consulta.", { code: code === "unauthorized" ? "unauthorized" : code === "invalid-request" ? "invalid-request" : code === "api-not-configured" ? "not-configured" : "temporary-unavailable", status: response.status, retryable: !permanent });
      }
      if (payload.data.status === "failed" || payload.data.confidenceLevel === "unavailable") throw unavailable();
      assertOperationActive();
      logOperationalEvent("research_starter_completed", { requestId }, { attempt, durationMs: Date.now() - started, queryLength: request.topic.length, rankedPapers: payload.data.references.length, stage: "research_starter" });
      return { ...payload.data, retrievalProvider: "research_starter" };
    } catch (error) {
      assertOperationActive(); // Cancellation/deadline never starts another provider.
      if (!(error instanceof ResearchStarterClientError) && !(error instanceof TypeError) && !(error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name))) throw error;
      lastError = error instanceof ResearchStarterClientError ? error : unavailable();
      logOperationalEvent("research_starter_request_failed", { requestId }, { attempt, code: lastError.code, status: lastError.status, queryLength: request.topic.length, durationMs: Date.now() - started });
      if (!lastError.retryable) throw lastError;
      if (attempt >= maxAttempts || Date.now() + retryDelay + 1000 >= primaryDeadline) break;
      try { await delay(retryDelay, undefined, { signal: requestSignal(primaryDeadline) }); }
      catch { assertOperationActive(); break; }
    }
  }
  assertOperationActive();
  if (Date.now() >= deadline) throw lastError;
  logOperationalEvent("research_starter_fallback_started", { requestId }, { code: lastError.code, stage: "crossref" });
  emitProgress("researching", null, "crossref");
  try {
    const fallback = await fetchCrossrefReport(request, requestSignal(deadline));
    assertOperationActive();
    logOperationalEvent("research_starter_fallback_completed", { requestId }, { stage: "crossref", durationMs: Date.now() - started, rankedPapers: fallback.references.length });
    return fallback;
  } catch {
    assertOperationActive();
    logOperationalEvent("research_starter_fallback_failed", { requestId }, { stage: "crossref", durationMs: Date.now() - started, code: "temporary-unavailable" });
    throw unavailable();
  }
}
