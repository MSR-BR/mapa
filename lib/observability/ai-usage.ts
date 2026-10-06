import type { LanguageModelUsage } from "ai";
import type { AiProvider, AiRole } from "@/modules/ai/contract";
import { aiOperation } from "@/modules/ai/operation";
import { PRICING_DATE, priceFor, type AiOperation } from "@/modules/ai/policy";

function safeModel(value: string) { return /^[a-z0-9._:-]{1,100}$/i.test(value) ? value : "unknown"; }
function tokens(value: number | undefined) { return Number.isFinite(value) ? Math.max(0, Math.round(value!)) : null; }
export function observeAiAttempt(options: {
  operation: AiOperation; provider: AiProvider; role: AiRole; model: string; attempt: number;
  finishReason?: string; warningCount?: number; started: number; maxOutputTokens: number; usage?: LanguageModelUsage; failure?: string; fallbackReason?: string;
}) {
  const usage = options.usage;
  const input = tokens(usage?.inputTokens), output = tokens(usage?.outputTokens);
  const price = priceFor(options.model);
  console.info(JSON.stringify({
    timestamp: new Date().toISOString(), event: `${options.provider === "gemini" ? "gemini" : "openai"}_generation_${options.failure ? "failed" : "completed"}`,
    contractVersion: "ai-usage-v2", operationId: aiOperation.getStore()?.id,
    operation: options.operation, provider: options.provider, role: options.role, model: safeModel(options.model),
    attempt: options.attempt, durationMs: Date.now() - options.started, maxOutputTokens: options.maxOutputTokens,
    inputTokens: input, outputTokens: output, totalTokens: tokens(usage?.totalTokens),
    reasoningTokens: tokens(usage?.outputTokenDetails?.reasoningTokens),
    cachedInputTokens: tokens(usage?.inputTokenDetails?.cacheReadTokens),
    cacheWriteTokens: tokens(usage?.inputTokenDetails?.cacheWriteTokens),
    estimatedCostUsd: price && input !== null && output !== null ? (input * price.reserveInput + output * price.output) / 1_000_000 : null,
    finishReason: options.finishReason ?? null, warningCount: options.warningCount ?? null, priceDate: PRICING_DATE, status: options.failure ? "failed" : "succeeded",
    errorCode: options.failure, fallbackReason: options.fallbackReason,
  }));
}
