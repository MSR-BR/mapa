import type { FinishReason, LanguageModelUsage } from "ai";

export const GEMINI_OPERATIONS = [
  "suggest_research_prompts",
  "broaden_research_query",
  "interpret_research_request",
  "generate_problem_candidates",
  "regenerate_problem_statement",
  "generate_general_objective",
  "generate_specific_objectives",
  "generate_literature_topics",
  "generate_development_topics",
  "generate_methodology_plan",
  "review_final_map_coherence",
  "generate_research_structure",
  "merge_research_structures",
] as const;

export type GeminiOperation = (typeof GEMINI_OPERATIONS)[number];

type GeminiObservedResult = {
  totalUsage: LanguageModelUsage;
  finishReason: FinishReason;
  warnings?: readonly unknown[];
  response: {
    modelId: string;
  };
};

type GeminiObservationOptions = {
  operation: GeminiOperation;
  configuredModel: string;
  maxOutputTokens: number;
  attempt?: number;
};

type StatusBearingError = {
  status?: unknown;
  statusCode?: unknown;
};

function safeInteger(value: number | undefined) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value ?? 0)) : 0;
}

function safeModelId(value: string) {
  return /^[a-z0-9._:-]{1,100}$/i.test(value) ? value : "unknown";
}

function readHttpStatus(error: unknown) {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as StatusBearingError;
  const status = candidate.statusCode ?? candidate.status;
  return typeof status === "number" && Number.isInteger(status) ? status : undefined;
}

export function classifyGeminiFailure(error: unknown) {
  const httpStatus = readHttpStatus(error);

  if (httpStatus === 400) return { errorCode: "invalid_request", httpStatus } as const;
  if (httpStatus === 401 || httpStatus === 403) {
    return { errorCode: "provider_auth", httpStatus } as const;
  }
  if (httpStatus === 429) return { errorCode: "rate_limited", httpStatus } as const;
  if (httpStatus === 500) return { errorCode: "provider_error", httpStatus } as const;
  if (httpStatus === 503) return { errorCode: "provider_unavailable", httpStatus } as const;

  return { errorCode: "unknown", httpStatus } as const;
}

export async function observeGeminiGeneration<T extends GeminiObservedResult>(
  options: GeminiObservationOptions,
  generation: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  const operationId = crypto.randomUUID();

  try {
    const result = await generation();
    const usage = result.totalUsage;

    console.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: "gemini_generation_completed",
        provider: "gemini",
        contractVersion: "gemini-usage-v1",
        operationId,
        operation: options.operation,
        model: safeModelId(result.response.modelId || options.configuredModel),
        durationMs: Math.max(0, Date.now() - startedAt),
        maxOutputTokens: options.maxOutputTokens,
        inputTokens: safeInteger(usage.inputTokens),
        outputTokens: safeInteger(usage.outputTokens),
        reasoningTokens: safeInteger(usage.outputTokenDetails.reasoningTokens),
        cachedInputTokens: safeInteger(usage.inputTokenDetails.cacheReadTokens),
        cacheWriteTokens: safeInteger(usage.inputTokenDetails.cacheWriteTokens),
        totalTokens: safeInteger(usage.totalTokens),
        finishReason: result.finishReason,
        warningCount: result.warnings?.length ?? 0,
        attempt: options.attempt ?? 1,
        status: "succeeded",
      }),
    );

    return result;
  } catch (error) {
    const failure = classifyGeminiFailure(error);

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: "gemini_generation_failed",
        provider: "gemini",
        contractVersion: "gemini-usage-v1",
        operationId,
        operation: options.operation,
        model: safeModelId(options.configuredModel),
        durationMs: Math.max(0, Date.now() - startedAt),
        maxOutputTokens: options.maxOutputTokens,
        attempt: options.attempt ?? 1,
        status: "failed",
        ...failure,
      }),
    );

    throw error;
  }
}
