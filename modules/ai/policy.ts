import type { GeminiOperation } from "@/lib/observability/gemini-usage";
import type { AiProvider } from "./contract";

export type AiOperation = GeminiOperation | "review_workflow_impact";
export const OUTPUT_TOKEN_BUDGETS: Record<AiOperation, number> = {
  broaden_research_query: 160, generate_development_topics: 3200, generate_general_objective: 700,
  generate_literature_topics: 3200, generate_methodology_plan: 5000, generate_problem_candidates: 4500,
  generate_research_structure: 8000, generate_specific_objectives: 2400, interpret_research_request: 500,
  merge_research_structures: 8000, regenerate_problem_statement: 700, review_final_map_coherence: 2400,
  suggest_research_prompts: 500, review_workflow_impact: 2400,
};
export const AI_LIMITS = {
  totalMs: 105_000, attemptMs: 35_000, totalAttempts: 6, attemptsPerOperation: 2,
  maxPromptBytes: 100_000, maxOperationMicros: 500_000,
} as const;
export const PRICING_DATE = "2026-10-06";
// USD per million tokens. Conservative input reservation includes cache-write premium.
// See C112 notes for official sources. Unknown models fail closed; no price upgrades.
export const PRICES = {
  "gemini-3.6-flash": { input: 0.75, output: 3.75, reserveInput: 0.75 },
  "gpt-6-luna": { input: 0.10, output: 0.50, reserveInput: 0.125 },
} as const;
export function configuredModel(provider: AiProvider) {
  return provider === "gemini" ? process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash" : process.env.OPENAI_MODEL?.trim() || "gpt-6-luna";
}
export function providerEnabled(provider: AiProvider) {
  return provider === "gemini" ? Boolean(process.env.GEMINI_API_KEY?.trim())
    : process.env.MAPA_OPENAI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY?.trim());
}
export function priceFor(model: string) {
  // The already published end of the Gemini discount changes the reservation,
  // never the configured model or the monthly spending limit.
  if (model === "gemini-3.6-flash" && Date.now() >= Date.parse("2027-01-01T00:00:00Z")) return { input: 1.50, output: 7.50, reserveInput: 1.50 };
  return PRICES[model as keyof typeof PRICES] ?? null;
}
