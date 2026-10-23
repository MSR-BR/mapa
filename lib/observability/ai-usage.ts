import type { LanguageModelUsage } from "ai";
import type { AiProvider, AiRole } from "@/modules/ai/contract";
import { aiOperation } from "@/modules/ai/operation";
import { PRICING_DATE, type AiOperation } from "@/modules/ai/policy";

import { knownAiCost } from "@/modules/ai/cost";

function safeModel(value: string) { return /^[a-z0-9._:-]{1,100}$/i.test(value) ? value : "unknown"; }
function tokens(value: number | undefined) { return Number.isFinite(value) ? Math.max(0, Math.round(value!)) : null; }
/** Fixed metadata only: never include RPC errors, credentials, prompts or project IDs. */
export function observeAiBudgetWarning(event: "ai_budget_estimate_exceeded" | "ai_budget_settlement_pending", provider: AiProvider, operation: AiOperation) {
  console.warn(JSON.stringify({ event, provider, operation }));
}
export function observeAiBudgetPressure(pressure: "80" | "95") {
  console.warn(JSON.stringify({ event: "ai_budget_pressure", thresholdPercent: Number(pressure) }));
}
export function observeAiAttempt(options: {
  operation: AiOperation; provider: AiProvider; role: AiRole; model: string; attempt: number;
  finishReason?: string; warningCount?: number; started: number; maxOutputTokens: number; usage?: LanguageModelUsage; failure?: string; fallbackReason?: string;
}) {
  const usage = options.usage;
  const input = tokens(usage?.inputTokens), output = tokens(usage?.outputTokens);
  const cost = knownAiCost(options.model, usage);
  console.info(JSON.stringify({
    timestamp: new Date().toISOString(), event: `${options.provider === "gemini" ? "gemini" : "openai"}_generation_${options.failure ? "failed" : "completed"}`,
    contractVersion: "ai-usage-v2", operationId: aiOperation.getStore()?.id,
    operation: options.operation, provider: options.provider, role: options.role, model: safeModel(options.model),
    attempt: options.attempt, durationMs: Date.now() - options.started, maxOutputTokens: options.maxOutputTokens,
    inputTokens: input, outputTokens: output, totalTokens: tokens(usage?.totalTokens),
    reasoningTokens: tokens(usage?.outputTokenDetails?.reasoningTokens),
    cachedInputTokens: tokens(usage?.inputTokenDetails?.cacheReadTokens),
    cacheWriteTokens: tokens(usage?.inputTokenDetails?.cacheWriteTokens),
    estimatedCostUsd: cost ? cost.micros / 1_000_000 : null,
    finishReason: options.finishReason ?? null, warningCount: options.warningCount ?? null, priceDate: PRICING_DATE, status: options.failure ? "failed" : "succeeded",
    errorCode: options.failure, fallbackReason: options.fallbackReason,
  }));
}
