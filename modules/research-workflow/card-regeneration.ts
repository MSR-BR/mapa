import { z } from "zod";
import type { AiOperation } from "@/modules/ai/policy";
import { researchWorkflowContentSchema, type AdvisorReviewStep, type ResearchWorkflowContent } from "./schema";
import { methodologyClassificationInputSchema } from "./methodology-validation";
import { workflowUnit } from "./versioned-context";

export function regenerationCard(content: ResearchWorkflowContent, step: AdvisorReviewStep, targetId: string) {
  const unit = workflowUnit(content, step);
  const element = unit.elements.find((item) => item.id === targetId
    || targetId === "problem" && item.type === "problem_statement"
    || targetId === "general" && item.type === "general_objective"
    || targetId === "title" && item.type === "research_title");
  const row = step === "methodology_matrix" ? unit.methodologyRows.find((item) => item.id === targetId) : undefined;
  if (row) return { kind: "row" as const, row, operation: "generate_methodology_plan" as AiOperation };
  if (step === "methodology_matrix" && targetId === "classification" && unit.methodologyClassification) {
    return { kind: "classification" as const, classification: unit.methodologyClassification, operation: "generate_methodology_plan" as AiOperation };
  }
  if (!element || ["final_map", "methodology_mapping"].includes(element.type)) throw new Error("Quadro não encontrado nesta etapa. Salve a página e tente novamente.");
  const maxLength = element.type.endsWith("_topic") ? 180 : element.type === "problem_statement" ? 500 : element.type === "research_title" ? 240 : 700;
  const operation: AiOperation = element.type.endsWith("_topic") ? element.type === "literature_topic" ? "generate_literature_topics" : "generate_development_topics"
    : element.type === "problem_statement" ? "regenerate_problem_statement" : element.type === "general_objective" ? "generate_general_objective" : element.type === "specific_objective" ? "generate_specific_objectives" : "generate_methodology_plan";
  return { kind: "element" as const, element, maxLength, operation };
}

export type RegenerationCard = ReturnType<typeof regenerationCard>;
export const cardClassificationSchema = methodologyClassificationInputSchema;
export const cardRowSchema = z.object({
  dataCollection: z.string().trim().min(20).max(1200),
  analysisTreatment: z.string().trim().min(20).max(1200),
  expectedResult: z.string().trim().min(20).max(1000),
});
export type CardResult = { kind: "element"; text: string } | { kind: "row"; value: z.infer<typeof cardRowSchema> } | { kind: "classification"; value: z.infer<typeof cardClassificationSchema> };

/** Only fields belonging to the selected card may change. IDs, notes and links stay intact. */
export function applyRegeneratedCard(content: ResearchWorkflowContent, card: RegenerationCard, result: CardResult) {
  if (card.kind !== result.kind) throw new Error("Resposta incompatível com o quadro solicitado.");
  const next = structuredClone(content);
  if (card.kind === "element" && result.kind === "element") {
    const text = z.string().trim().min(3).max(card.maxLength).parse(result.text);
    next.elements = next.elements.map((item) => item.id === card.element.id
      ? { ...item, proposedContent: text, status: "suggested", updatedBy: "ai", revision: item.revision + 1 } : item);
  } else if (card.kind === "row" && result.kind === "row") {
    const value = cardRowSchema.parse(result.value);
    next.methodologyRows = next.methodologyRows.map((row) => row.id === card.row.id
      ? { ...row, ...value, status: "suggested", updatedBy: "ai", revision: row.revision + 1 } : row);
    const text = `Levantamento: ${value.dataCollection}\nAnálise/tratamento: ${value.analysisTreatment}\nResultado esperado: ${value.expectedResult}${card.row.studentJustification ? `\nJustificativa do aluno: ${card.row.studentJustification}` : ""}`;
    next.elements = next.elements.map((item) => item.id === card.row.id
      ? { ...item, proposedContent: text, status: "suggested", updatedBy: "ai", revision: item.revision + 1 } : item);
  } else if (card.kind === "classification" && result.kind === "classification") {
    next.methodologyClassification = { ...card.classification, ...cardClassificationSchema.parse(result.value), status: "suggested", updatedBy: "ai", revision: card.classification.revision + 1 };
  }
  return researchWorkflowContentSchema.parse(next);
}
