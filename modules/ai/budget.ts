import "server-only";
import { createClient } from "@/lib/supabase/server";
import { AiError } from "./failure";
import type { AiProvider } from "./contract";
import type { AiOperation } from "./policy";
import type { KnownAiCost } from "./cost";
import { observeAiBudgetPressure } from "@/lib/observability/ai-usage";

export type BudgetMetadata = { provider: AiProvider; model: string; operation: AiOperation };
/** Additive v2 ledger; legacy calls keep the original conservative reservation. */
export async function reserveAiBudget(micros: number, metadata?: BudgetMetadata): Promise<string | void> {
  const secret = process.env.MAPA_AI_BUDGET_SECRET;
  if (!secret) throw new AiError("configuration");
  const supabase = await createClient();
  if (!metadata) {
    const { data, error } = await supabase.rpc("reserve_ai_budget", { p_secret: secret, p_micros: micros }).abortSignal(AbortSignal.timeout(5_000));
    if (error) throw new AiError("configuration");
    if (data !== true) throw new AiError("budget");
    return;
  }
  const id = crypto.randomUUID();
  const { data, error } = await supabase.rpc("reserve_ai_budget_v2", {
    p_secret: secret, p_id: id, p_micros: micros,
    p_provider: metadata.provider, p_model: metadata.model, p_operation: metadata.operation,
  }).abortSignal(AbortSignal.timeout(5_000));
  if (error || !data || typeof data !== "object" || Array.isArray(data)) throw new AiError("configuration");
  if (data.allowed !== true) throw new AiError(data.code === "budget" ? "budget" : "configuration");
  if (data.pressure === "80" || data.pressure === "95") observeAiBudgetPressure(data.pressure);
  return id;
}

/** A failed/ambiguous settlement leaves the reservation in place. Never retry AI for this. */
export async function settleAiBudget(id: string, cost: KnownAiCost): Promise<void> {
  const secret = process.env.MAPA_AI_BUDGET_SECRET;
  if (!secret) throw new AiError("configuration");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("settle_ai_budget", {
    p_secret: secret, p_id: id, p_actual_micros: cost.micros,
    p_input_tokens: cost.inputTokens, p_output_tokens: cost.outputTokens,
  }).abortSignal(AbortSignal.timeout(2_500));
  if (error || data !== true) throw new AiError("configuration");
}
