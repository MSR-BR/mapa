import "server-only";

import type { ResearchStarterRequest, ResearchStarterResponse, ResearchStarterSuccess } from "./types";

const RESEARCH_STARTER_ENDPOINT = "https://research-starter-six.vercel.app/api/v1/reports";

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
): Promise<ResearchStarterSuccess> {
  const apiKey = process.env.RESEARCH_STARTER_API_KEY;
  if (!apiKey) throw new Error("Research Starter não está configurado.");

  const response = await fetch(RESEARCH_STARTER_ENDPOINT, {
    body: JSON.stringify(input),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(45_000),
  });
  const payload: unknown = await response.json();

  if (!isResponse(payload)) {
    console.error("research_starter_invalid_response", { status: response.status });
    throw new Error("Resposta inválida do Research Starter.");
  }
  if (!response.ok || !payload.ok) {
    const code = payload.ok ? `http-${response.status}` : payload.code;
    console.error("research_starter_request_failed", { code, status: response.status });
    throw new Error(`Research Starter indisponível (${code}).`);
  }
  return payload;
}
