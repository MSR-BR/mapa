import { z } from "zod";
import { methodologyClassificationSchema, methodologyRowSchema } from "./schema";
import { FINAL_TITLE_MAX_LENGTH, methodologyPlanInputSchema, type MethodologyPlanInput } from "./methodology-validation";

export const methodologyDraftInputSchema = z.object({
  title: z.string().trim().max(FINAL_TITLE_MAX_LENGTH),
  classification: methodologyClassificationSchema.omit({ revision: true, sourceRevision: true, status: true, updatedBy: true }),
  rows: z.array(methodologyRowSchema.omit({ revision: true, sourceRevision: true, status: true, updatedBy: true })).max(7),
});

type Objective = { id: string; label: string };
export type MethodologyIssue = { fieldId: string; message: string };
const fields: Record<string, string> = {
  title: "Título final", nature: "Natureza", approach: "Abordagem", objectives: "Objetivos metodológicos",
  procedures: "Procedimentos", instruments: "Instrumentos", analysisTechniques: "Técnicas de análise",
  rationale: "Justificativa metodológica", ethicsWarnings: "Avisos éticos ou de acesso",
  dataCollection: "Levantamento", analysisTreatment: "Análise/tratamento", expectedResult: "Resultado esperado",
  associatedTopicIds: "Tópicos associados", studentJustification: "Contexto opcional",
};

/** Shared by UI and route: exact locations, not heuristic academic judgements. */
export function methodologyIssues(input: MethodologyPlanInput, objectives: Objective[], topicIds: Set<string>): MethodologyIssue[] {
  const parsed = methodologyPlanInputSchema.safeParse(input);
  const issues: MethodologyIssue[] = parsed.success ? [] : parsed.error.issues.map((issue) => {
    const [section, index, key] = issue.path;
    const row = section === "rows" && typeof index === "number" ? input.rows[index] : undefined;
    const label = row ? objectives.find((objective) => objective.id === row.objectiveId)?.label ?? `Linha ${Number(index) + 1}` : "";
    const field = section === "rows" ? String(key ?? "rows") : section === "classification" ? String(index ?? "classification") : String(section);
    const fieldId = row ? `methodology-${row.id}-${field}` : `methodology-${field}`;
    const requirement = issue.code === "too_big" ? `respeite o limite de ${issue.maximum} ${issue.origin === "array" ? "itens" : "caracteres"}` : issue.code === "too_small" && issue.origin === "string" ? `escreva pelo menos ${issue.minimum} caracteres` : "preencha este campo";
    return { fieldId, message: field === "rows" ? "A matriz precisa de uma linha por objetivo. Use Completar campos com IA."
      : `${label ? `${label} · ` : ""}${fields[field] ?? "Matriz"}: ${requirement}.` };
  });
  const seen = new Set<string>();
  for (const row of input.rows) {
    const label = objectives.find((objective) => objective.id === row.objectiveId)?.label;
    if (!label || seen.has(row.objectiveId)) issues.push({ fieldId: "methodology-rows", message: "A matriz contém um objetivo inexistente ou repetido. Recarregue a página para recuperar os vínculos." });
    seen.add(row.objectiveId);
    if (row.associatedTopicIds.length === 0 || row.associatedTopicIds.some((id) => !topicIds.has(id))) {
      issues.push({ fieldId: `methodology-${row.id}-associatedTopicIds`, message: `${label ?? "Linha"} · associe ao menos um tópico existente ou use Completar campos com IA.` });
    }
  }
  for (const objective of objectives) if (!seen.has(objective.id)) {
    issues.push({ fieldId: "methodology-rows", message: `${objective.label} · falta a linha metodológica. Use Completar campos com IA.` });
  }
  return issues.filter((issue, index, all) => all.findIndex((other) => other.fieldId === issue.fieldId && other.message === issue.message) === index);
}

/** Fill gaps only. Existing author text, row IDs and notes always win. */
export function mergeMethodologyCompletion(current: MethodologyPlanInput, generated: MethodologyPlanInput, preserveClassification: boolean): MethodologyPlanInput {
  const classification = preserveClassification ? {
    ...current.classification,
    analysisTechniques: current.classification.analysisTechniques.length ? current.classification.analysisTechniques : generated.classification.analysisTechniques,
    instruments: current.classification.instruments.length ? current.classification.instruments : generated.classification.instruments,
    objectives: current.classification.objectives.length ? current.classification.objectives : generated.classification.objectives,
    procedures: current.classification.procedures.length ? current.classification.procedures : generated.classification.procedures,
    rationale: current.classification.rationale.trim() ? current.classification.rationale : generated.classification.rationale,
    ethicsWarnings: [...new Set([...current.classification.ethicsWarnings, ...generated.classification.ethicsWarnings])].slice(0, 6),
  } : generated.classification;
  const rows = current.rows.map((row) => {
    const suggestion = generated.rows.find((item) => item.objectiveId === row.objectiveId);
    return suggestion ? {
      ...row,
      dataCollection: row.dataCollection.trim() ? row.dataCollection : suggestion.dataCollection,
      analysisTreatment: row.analysisTreatment.trim() ? row.analysisTreatment : suggestion.analysisTreatment,
      expectedResult: row.expectedResult.trim() ? row.expectedResult : suggestion.expectedResult,
      associatedTopicIds: row.associatedTopicIds.length ? row.associatedTopicIds : suggestion.associatedTopicIds,
    } : row;
  });
  for (const row of generated.rows) if (!rows.some((existing) => existing.objectiveId === row.objectiveId)) rows.push(row);
  return { classification, rows, title: current.title.trim() ? current.title : generated.title };
}
