export type AiFailureCode = "cancelled" | "timeout" | "rate_limited" | "provider_quota" | "unavailable" | "invalid_output" | "refusal" | "auth" | "configuration" | "budget" | "unknown";
export class AiError extends Error {
  constructor(readonly code: AiFailureCode) {
    super(code === "budget" ? "O limite de uso da IA foi atingido. Seu conteúdo foi preservado."
      : code === "cancelled" ? "Solicitação cancelada. Confira a versão salva antes de tentar novamente."
      : code === "auth" || code === "configuration" ? "A integração de IA precisa de configuração. Seu conteúdo foi preservado."
      : "A IA não conseguiu concluir agora. Seu conteúdo foi preservado; tente novamente.");
    this.name = "AiError";
  }
}
export function classifyAiFailure(error: unknown): AiFailureCode {
  if (error instanceof AiError) return error.code;
  if (!error || typeof error !== "object") return "unknown";
  const e = error as { code?: string; name?: string; statusCode?: number; status?: number; cause?: unknown; finishReason?: string; responseBody?: string; data?: { error?: { code?: string; type?: string } } };
  let code = e.data?.error?.code ?? e.data?.error?.type;
  // Read only standardized codes; never log response bodies, prompts or exception text.
  if (!code && e.responseBody) { try { code = JSON.parse(e.responseBody)?.error?.code; } catch {} }
  if (e.finishReason === "content-filter" || code === "content_policy_violation" || code === "content_filter") return "refusal";
  if (code === "insufficient_quota" || code === "billing_hard_limit_reached") return "provider_quota";
  const status = e.statusCode ?? e.status;
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limited";
  if (status === 408 || e.name === "TimeoutError") return "timeout";
  if (status && status >= 500) return "unavailable";
  if (status === 400 || status === 404) return "configuration";
  if (e.name === "AbortError") return "cancelled";
  if (["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN"].includes(e.code ?? "")) return "unavailable";
  if (e.cause) { const cause = classifyAiFailure(e.cause); if (cause !== "unknown") return cause; }
  if (["AI_NoObjectGeneratedError", "AI_NoOutputGeneratedError", "AI_TypeValidationError", "AI_JSONParseError", "ZodError"].includes(e.name ?? "")) return "invalid_output";
  return "unknown";
}
export function canFallback(code: AiFailureCode) {
  return ["timeout", "rate_limited", "unavailable", "invalid_output"].includes(code);
}
