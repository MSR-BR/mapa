import { z } from "zod";

export const problemStatementInputSchema = z.string().trim().min(20).max(500);
export const generalObjectiveInputSchema = z.string().trim().min(20).max(700);
export const specificObjectivesInputSchema = z.array(z.object({
  id: z.string().uuid(),
  content: z.string().trim().min(15).max(700),
})).min(3).max(6);

const QUESTION_OPENING = /^(Como|De que forma)\b/i;
const INFINITIVE_OPENING = /^(?:[A-Za-zÀ-ÿ]+(?:ar|er|ir|or)|pôr)\b/i;
const STOP_WORDS = new Set([
  "a", "ao", "aos", "as", "com", "como", "da", "das", "de", "do", "dos", "e", "em", "entre",
  "geral", "na", "nas", "no", "nos", "o", "objetivo", "os", "para", "por", "que", "sua", "um", "uma",
]);

function normalizedTokens(value: string) {
  return new Set(value.toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token)));
}

function overlap(left: Set<string>, right: Set<string>) {
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared;
}

function similarity(left: string, right: string) {
  const leftTokens = normalizedTokens(left);
  const rightTokens = normalizedTokens(right);
  const union = new Set([...leftTokens, ...rightTokens]);
  return union.size === 0 ? 0 : overlap(leftTokens, rightTokens) / union.size;
}

export function validateProblemStatement(value: string) {
  const parsed = problemStatementInputSchema.safeParse(value);
  if (!parsed.success) return ["A problemática deve ter entre 20 e 500 caracteres."];
  const errors: string[] = [];
  if (!QUESTION_OPENING.test(parsed.data)) errors.push("A problemática deve começar com “Como” ou “De que forma”.");
  if ((parsed.data.match(/\?/g) ?? []).length !== 1 || !parsed.data.endsWith("?")) {
    errors.push("A problemática deve conter uma única grande pergunta.");
  }
  return errors;
}

export function validateGeneralObjective(value: string, problemStatement: string) {
  const parsed = generalObjectiveInputSchema.safeParse(value);
  if (!parsed.success) return ["O objetivo geral deve ter entre 20 e 700 caracteres."];
  const errors: string[] = [];
  if (!INFINITIVE_OPENING.test(parsed.data)) errors.push("O objetivo geral deve começar com verbo no infinitivo.");
  if (overlap(normalizedTokens(parsed.data), normalizedTokens(problemStatement)) === 0) {
    errors.push("O objetivo geral precisa manter relação explícita com a problemática.");
  }
  return errors;
}

export function validateSpecificObjectives(
  objectives: Array<{ id: string; content: string }>,
  generalObjective: string,
) {
  const parsed = specificObjectivesInputSchema.safeParse(objectives);
  if (!parsed.success) return ["Informe entre três e seis objetivos específicos válidos."];
  const errors: string[] = [];
  const generalTokens = normalizedTokens(generalObjective);
  const ids = new Set(parsed.data.map((objective) => objective.id));
  if (ids.size !== parsed.data.length) errors.push("Cada objetivo específico deve possuir um ID estável e exclusivo.");

  parsed.data.forEach((objective, index) => {
    if (!INFINITIVE_OPENING.test(objective.content)) {
      errors.push(`O objetivo específico ${index + 1} deve começar com verbo no infinitivo.`);
    }
    if (overlap(normalizedTokens(objective.content), generalTokens) === 0) {
      errors.push(`O objetivo específico ${index + 1} não apresenta relação clara com o objetivo geral.`);
    }
  });
  for (let left = 0; left < parsed.data.length; left += 1) {
    for (let right = left + 1; right < parsed.data.length; right += 1) {
      if (similarity(parsed.data[left].content, parsed.data[right].content) >= 0.72) {
        errors.push(`Os objetivos específicos ${left + 1} e ${right + 1} são redundantes.`);
      }
    }
  }
  return [...new Set(errors)];
}
