import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output, type LanguageModelUsage } from "ai";
import { z } from "zod";
import { observeAiAttempt } from "@/lib/observability/ai-usage";
import { reserveAdditionalAiBudget } from "./budget";
import type { AiProvider, AiRole } from "./contract";
import { AiError, canFallback, classifyAiFailure } from "./failure";
import { aiOperation, assertOperationActive, claimAttempt, createOperation, emitProgress } from "./operation";
import { AI_LIMITS, OUTPUT_TOKEN_BUDGETS, configuredModel, priceFor, providerEnabled, type AiOperation } from "./policy";

export type StructuredRequest<T> = {
  operation: AiOperation; schema: z.ZodType<T>; prompt: string;
  provider?: AiProvider; role?: AiRole; allowFallback?: boolean; additional?: boolean; validate?: (output: T) => void;
};
export type ProviderCall = { request: Omit<StructuredRequest<unknown>, "validate">; prompt: string; provider: AiProvider; model: string; maxOutputTokens: number; signal: AbortSignal };
export type ProviderResult = { output: unknown; totalUsage: LanguageModelUsage; response: { modelId: string }; finishReason: string; warnings?: readonly unknown[] };
export type GenerationDependencies = { invoke: (call: ProviderCall) => Promise<ProviderResult>; reserve: (micros: number) => Promise<void> };
async function invokeProvider({ request, prompt, provider, model, maxOutputTokens, signal }: ProviderCall): Promise<ProviderResult> {
  return generateText({
        model: provider === "gemini"
          ? createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })(model)
          : createOpenAI({ apiKey: process.env.OPENAI_API_KEY, fetch: refusalAwareFetch }).responses(model),
        output: Output.object({ schema: request.schema }), prompt, maxOutputTokens, maxRetries: 0, abortSignal: signal,
        providerOptions: provider === "gemini"
          ? { google: { thinkingConfig: { thinkingLevel: "minimal" } } }
          : { openai: { store: false, serviceTier: "default", reasoningEffort: "low", strictJsonSchema: true } },
      });
}
// Responses can return a refusal inside a completed message. Detect it before
// structured-output parsing could mistake it for a repairable malformed response.
async function refusalAwareFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.ok) {
    const body: unknown = await response.clone().json().catch(() => null);
    if (body && typeof body === "object" && "output" in body && Array.isArray(body.output)
      && body.output.some((item: { content?: Array<{ type?: string }> }) => item.content?.some((part) => part.type === "refusal"))) throw new AiError("refusal");
  }
  return response;
}
export const productionDependencies: GenerationDependencies = { invoke: invokeProvider, reserve: reserveAdditionalAiBudget };

export async function generateStructured<T>(request: StructuredRequest<T>, dependencies: GenerationDependencies = productionDependencies): Promise<{ output: T; provider: AiProvider; model: string }> {
  if (!aiOperation.getStore()) {
    const signal = AbortSignal.timeout(AI_LIMITS.totalMs);
    return aiOperation.run(createOperation(signal), () => generateStructured(request, dependencies));
  }
  const state = aiOperation.getStore()!;
  const role = request.role ?? "generator";
  let provider = request.provider ?? "gemini";
  let fallbackReason: string | undefined;
  // At most two SDK calls for this operation (all internal SDK retries disabled).
  for (let index = 0; index < 2; index++) {
    assertOperationActive();
    if (!providerEnabled(provider)) throw new AiError("configuration");
    const model = configuredModel(provider);
    const price = priceFor(model);
    if (!price) throw new AiError("configuration");
    const prompt = request.prompt + (fallbackReason === "invalid_output"
      ? "\nA resposta anterior falhou na validação. Confira todas as regras, os limites do schema e os IDs permitidos antes de responder." : "");
    // UTF-8 bytes bound text tokens conservatively; include schema and framing overhead.
    const bytes = Buffer.byteLength(prompt + JSON.stringify(z.toJSONSchema(request.schema, { unrepresentable: "any" })), "utf8") + 4096;
    if (bytes > AI_LIMITS.maxPromptBytes) throw new AiError("configuration");
    const maxOutputTokens = OUTPUT_TOKEN_BUDGETS[request.operation];
    const micros = Math.ceil(bytes * price.reserveInput + maxOutputTokens * price.output);
    const attempt = claimAttempt(request.operation, micros);
    if (provider === "openai" || request.additional || role === "reviewer" && request.operation === "review_workflow_impact" || index > 0 && request.provider === "openai") {
      await dependencies.reserve(micros);
    }
    assertOperationActive();
    emitProgress(fallbackReason ? "fallback" : role === "reviewer" ? "reviewing" : "generating", provider);
    const started = Date.now();
    const signal = AbortSignal.any([state.signal, AbortSignal.timeout(Math.max(1, Math.min(AI_LIMITS.attemptMs, state.deadline - Date.now())))]);
    let usage: LanguageModelUsage | undefined;
    let actualModel = model;
    try {
      const result = await dependencies.invoke({ request, prompt, provider, model, maxOutputTokens, signal });
      usage = result.totalUsage; actualModel = result.response.modelId || model;
      if (result.finishReason === "content-filter") throw new AiError("refusal");
      assertOperationActive();
      emitProgress("validating");
      const output = request.schema.parse(result.output);
      request.validate?.(output);
      observeAiAttempt({ ...request, provider, role, model: actualModel, attempt, started, maxOutputTokens, usage, fallbackReason, finishReason: result.finishReason, warningCount: result.warnings?.length ?? 0 });
      if (role === "generator") { state.lastGenerator = provider; state.lastModel = actualModel; }
      return { output, provider, model: actualModel };
    } catch (error) {
      const failure = state.signal.aborted ? "cancelled" : signal.aborted ? "timeout" : classifyAiFailure(error);
      observeAiAttempt({ ...request, provider, role, model: actualModel, attempt, started, maxOutputTokens, usage, failure, fallbackReason });
      if (request.allowFallback === false || index > 0 || !canFallback(failure)) throw new AiError(failure);
      const alternate = provider === "gemini" ? "openai" : "gemini";
      if (providerEnabled(alternate)) provider = alternate;
      else if (failure !== "invalid_output") throw new AiError(failure);
      fallbackReason = failure;
    }
  }
  throw new AiError("unavailable");
}
