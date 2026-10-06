import { z } from "zod";

export const providerSchema = z.enum(["gemini", "openai"]);
export type AiProvider = z.infer<typeof providerSchema>;
export type AiRole = "generator" | "reviewer";
export const progressEventSchema = z.object({
  operationId: z.string().uuid(), sequence: z.number().int().nonnegative(),
  phase: z.enum(["preparing", "generating", "reviewing", "fallback", "researching", "validating", "saving", "completed", "failed"]),
  provider: providerSchema.nullable(), state: z.enum(["running", "succeeded", "failed"]),
});
export type AiProgressEvent = z.infer<typeof progressEventSchema>;
export function providerLabel(provider: AiProvider) { return provider === "openai" ? "GPT" : "Gemini"; }
export function progressLabel(event: AiProgressEvent | null) {
  if (!event) return "Preparando sua solicitação…";
  const name = event.provider ? providerLabel(event.provider) : "IA";
  switch (event.phase) {
    case "generating": return `Gerando sugestões com ${name}…`;
    case "reviewing": return `Revisando a coerência com ${name}…`;
    case "fallback": return `Continuando com ${name}…`;
    case "researching": return "Consultando literatura no Research Starter…";
    case "validating": return "Conferindo o conteúdo e as referências…";
    case "saving": return "Salvando suas alterações…";
    case "completed": return "Solicitação concluída.";
    case "failed": return "Não foi possível concluir esta solicitação.";
    default: return "Preparando sua solicitação…";
  }
}
export const collaborativeReviewSchema = z.object({
  provider: providerSchema, model: z.string().max(100),
  baseRevision: z.number().int().positive(),
  status: z.enum(["completed", "unavailable", "disabled"]),
  findings: z.array(z.object({
    elementIds: z.array(z.string().uuid()).min(1).max(12),
    referenceIds: z.array(z.string().max(240)).max(12),
    reason: z.string().min(1).max(600), suggestion: z.string().min(1).max(1000),
  })).max(8),
});
export type CollaborativeReview = z.infer<typeof collaborativeReviewSchema>;
