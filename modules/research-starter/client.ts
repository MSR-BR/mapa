import "server-only";

import { logOperationalEvent } from "@/lib/observability/request-context";
import type { ResearchStarterRequest, ResearchStarterResponse, ResearchStarterSuccess } from "./types";

const RESEARCH_STARTER_ENDPOINT = "https://research-starter-six.vercel.app/api/v1/reports";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_ATTEMPTS = 2;

export type ResearchStarterClientErrorCode =
  | "not-configured"
  | "invalid-response"
  | "unauthorized"
  | "invalid-request"
  | "temporary-unavailable"
  | "request-failed";

export class ResearchStarterClientError extends Error {
  readonly code: ResearchStarterClientErrorCode;
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: { code: ResearchStarterClientErrorCode; status?: number | null; retryable?: boolean },
  ) {
    super(message);
    this.name = "ResearchStarterClientError";
    this.code = options.code;
    this.status = options.status ?? null;
    this.retryable = options.retryable ?? false;
  }
}

function isResponse(value: unknown): value is ResearchStarterResponse {
  if (!value || typeof value !== "object" || !("ok" in value)) return false;
  const candidate = value as Partial<ResearchStarterResponse>;
  if (candidate.ok === false) return "code" in candidate && Array.isArray(candidate.errors);
  return candidate.ok === true
    && "summary" in candidate
    && Array.isArray(candidate.references)
    && Array.isArray(candidate.warnings)
    && Array.isArray(candidate.keyFindings);
}

export async function fetchResearchStarterReport(
  input: ResearchStarterRequest,
  options: { maxAttempts?: number; requestId?: string; timeoutMs?: number } = {},
): Promise<ResearchStarterSuccess> {
  const apiKey = process.env.RESEARCH_STARTER_API_KEY;
  if (!apiKey) {
    throw new ResearchStarterClientError("Research Starter não está configurado.", {
      code: "not-configured",
    });
  }

  const maxAttempts = Math.max(1, Math.min(options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS, 2));
  const timeoutMs = Math.max(5_000, Math.min(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 45_000));
  const requestId = options.requestId ?? "research-starter";
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(RESEARCH_STARTER_ENDPOINT, {
        body: JSON.stringify(input),
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: AbortSignal.timeout(timeoutMs),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new ResearchStarterClientError("O Research Starter devolveu uma resposta inválida.", {
          code: "invalid-response",
          status: response.status,
          retryable: response.status >= 500 || response.status === 408,
        });
      }

      if (!isResponse(payload)) {
        logOperationalEvent("research_starter_invalid_response", { requestId }, { attempt, status: response.status });
        throw new ResearchStarterClientError("Resposta inválida do Research Starter.", {
          code: "invalid-response",
          status: response.status,
          retryable: response.status >= 500 || response.status === 408,
        });
      }
      if (!response.ok || !payload.ok) {
        const code = payload.ok ? `http-${response.status}` : payload.code;
        logOperationalEvent("research_starter_request_failed", { requestId }, { attempt, code, status: response.status });
        const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        throw new ResearchStarterClientError(`Research Starter indisponível (${code}).`, {
          code: payload.ok
            ? retryable ? "temporary-unavailable" : "request-failed"
            : payload.code === "unauthorized"
              ? "unauthorized"
              : payload.code === "invalid-request"
                ? "invalid-request"
                : retryable ? "temporary-unavailable" : "request-failed",
          status: response.status,
          retryable,
        });
      }
      return payload;
    } catch (error) {
      lastError = error;
      const retryable = error instanceof ResearchStarterClientError
        ? error.retryable
        : error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
      if (!retryable || attempt >= maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }

  if (lastError instanceof ResearchStarterClientError) throw lastError;
  throw new ResearchStarterClientError("Não foi possível conectar ao Research Starter.", {
    code: "temporary-unavailable",
    retryable: true,
  });
}
