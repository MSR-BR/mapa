import type { LanguageModelUsage } from "ai";
import { priceFor } from "./policy";

export type KnownAiCost = { micros: number; inputTokens: number; outputTokens: number };
/** Token-based estimate at the approved conservative tariff, not a provider invoice.
 * Cache inputs use the highest approved input tariff. Output already includes reasoning.
 * Incomplete/invalid usage is unknown, never zero or a reason to refund a reservation.
 */
export function knownAiCost(model: string, usage?: LanguageModelUsage): KnownAiCost | null {
  const price = priceFor(model);
  const input = usage?.inputTokens, output = usage?.outputTokens;
  if (!price || !Number.isSafeInteger(input) || !Number.isSafeInteger(output)
    || input! < 0 || output! < 0 || input! > 1_000_000_000 || output! > 1_000_000_000) return null;
  const micros = Math.ceil(input! * price.reserveInput + output! * price.output);
  if (!Number.isSafeInteger(micros) || micros > 1_000_000_000) return null;
  return { micros, inputTokens: input!, outputTokens: output! };
}
