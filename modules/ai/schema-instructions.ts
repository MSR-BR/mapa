import { z } from "zod";

/** Derive prompt constraints from the same schema that accepts the response. */
export function schemaTextLimits(schema: z.ZodType) {
  const limits = new Map<string, number>();
  function visit(node: unknown, path: string) {
    if (!node || typeof node !== "object") return;
    const item = node as Record<string, unknown>;
    if (typeof item.maxLength === "number") limits.set(path, item.maxLength);
    if (item.properties && typeof item.properties === "object") {
      for (const [key, child] of Object.entries(item.properties)) visit(child, path ? `${path}.${key}` : key);
    }
    if (item.items) visit(item.items, `${path}[]`);
    for (const union of [item.anyOf, item.oneOf, item.allOf]) {
      if (Array.isArray(union)) union.forEach((child) => visit(child, path));
    }
  }
  visit(z.toJSONSchema(schema, { unrepresentable: "any" }), "");
  return [...limits].map(([field, limit]) => `${field}: ${limit}`).join("; ");
}

export function structuredTextInstruction(schema: z.ZodType) {
  const limits = schemaTextLimits(schema);
  return limits ? `\nLimites máximos de caracteres por campo (incluem espaços e pontuação; [] indica cada item): ${limits}. Escreva de forma concisa, com margem abaixo do limite. Se exceder, reformule preservando o sentido e frases completas; não corte palavras, não omita a conclusão e não altere IDs ou referências para caber.` : "";
}
