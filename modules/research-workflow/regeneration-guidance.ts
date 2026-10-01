import { z } from "zod";

export const regenerationGuidanceSchema = z.array(z.object({
  id: z.string().min(1).max(64),
  instruction: z.string().trim().min(1).max(1000),
})).max(8).optional();

export const currentGuidanceNotesSchema = z.array(z.object({
  id: z.string().uuid(),
  note: z.string().trim().max(1000).nullable(),
})).max(8).optional();

export function scopedRegenerationGuidance(
  entries: z.infer<typeof regenerationGuidanceSchema>,
  allowedLabels: Map<string, string>,
) {
  const seen = new Set<string>();
  return (entries ?? []).map(({ id, instruction }) => {
    const label = allowedLabels.get(id);
    if (!label || seen.has(id)) throw new Error("Pedido de regeneração fora da etapa atual.");
    seen.add(id);
    return `Pedido pontual do autor para ${label}, apenas nesta regeneração: ${instruction}`;
  });
}

export function scopedCurrentGuidanceNotes(
  entries: z.infer<typeof currentGuidanceNotesSchema>,
  allowedIds: Set<string>,
) {
  const seen = new Set<string>();
  return (entries ?? []).map(({ id, note }) => {
    if (!allowedIds.has(id) || seen.has(id)) throw new Error("Contexto acadêmico fora da etapa atual.");
    seen.add(id);
    return { id, note: note?.trim() || null };
  });
}
