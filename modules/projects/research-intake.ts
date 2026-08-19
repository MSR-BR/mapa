import { z } from "zod";

import {
  RESEARCH_PRODUCT_TYPES,
  researchProductTypeSchema,
  type ResearchProductType,
} from "@/modules/research-workflow/research-level-guidance";

export const researchIntakeFieldSchema = z.string().trim().min(1).max(2_000);

export const researchIntakeSchema = z.object({
  problemContext: researchIntakeFieldSchema,
  observedSituation: researchIntakeFieldSchema,
  discrepancyConsequences: researchIntakeFieldSchema,
  existingKnowledgeGap: researchIntakeFieldSchema,
  delimitationQuestion: researchIntakeFieldSchema,
  researchType: researchProductTypeSchema.nullable().default(null),
});

export type ResearchIntake = z.infer<typeof researchIntakeSchema>;

export type ResearchIntakeDraft = {
  problemContext: string;
  observedSituation: string;
  discrepancyConsequences: string;
  existingKnowledgeGap: string;
  delimitationQuestion: string;
  researchType: ResearchProductType | "" | null;
};

export const EMPTY_RESEARCH_INTAKE: ResearchIntakeDraft = {
  problemContext: "",
  observedSituation: "",
  discrepancyConsequences: "",
  existingKnowledgeGap: "",
  delimitationQuestion: "",
  researchType: null,
};

export const RESEARCH_INTAKE_FIELDS = [
  {
    name: "problemContext",
    label: "Contextualização do problema",
    help: "Apresente o contexto, o fenômeno e por que ele é relevante para a pesquisa.",
    placeholder: "Em que contexto esse fenômeno acontece e por que merece ser investigado?",
  },
  {
    name: "observedSituation",
    label: "Situação observada",
    help: "Descreva o que está acontecendo, a inquietação inicial e as evidências ou experiências que a sustentam.",
    placeholder: "O que foi observado, por quem e em quais evidências você se apoia?",
  },
  {
    name: "discrepancyConsequences",
    label: "Discrepância e consequências",
    help: "Compare o que ocorre com o que seria esperado e explique as consequências para os envolvidos.",
    placeholder: "O que deveria ocorrer, o que ocorre de fato e quais são as consequências?",
  },
  {
    name: "existingKnowledgeGap",
    label: "Conhecimento existente e lacuna",
    help: "Indique o que a literatura já explica e qual dúvida, limite ou lacuna ainda precisa ser esclarecida.",
    placeholder: "O que já se sabe e o que ainda não está suficientemente explicado?",
  },
  {
    name: "delimitationQuestion",
    label: "Delimitação e pergunta de pesquisa",
    help: "Defina o recorte de objeto, contexto e relação investigada. Termine com uma pergunta clara.",
    placeholder: "Como ou de que forma você investigará esse recorte específico?",
  },
] as const;

export function composeResearchBrief(intake: Pick<ResearchIntakeDraft, "problemContext" | "observedSituation" | "discrepancyConsequences" | "existingKnowledgeGap" | "delimitationQuestion">) {
  return RESEARCH_INTAKE_FIELDS
    .map((field) => `${field.label}: ${intake[field.name].trim()}`)
    .join("\n\n")
    .trim()
    .slice(0, 5_000);
}

export function researchIntakeFromPrompt(prompt: string): ResearchIntakeDraft {
  const value = prompt.trim().slice(0, 2_000);
  return {
    ...EMPTY_RESEARCH_INTAKE,
    problemContext: value,
    observedSituation: value,
    discrepancyConsequences: value,
    existingKnowledgeGap: value,
    delimitationQuestion: value,
  };
}

export function parseResearchIntakeJson(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = researchIntakeSchema.safeParse(parsed);
    return result.success && isCompleteResearchIntake(result.data) ? result.data : null;
  } catch {
    return null;
  }
}

export function isCompleteResearchIntake(value: ResearchIntakeDraft) {
  return RESEARCH_INTAKE_FIELDS.every((field) => value[field.name].trim().length >= 10);
}

export function hasResearchProductType(value: ResearchIntakeDraft) {
  return RESEARCH_PRODUCT_TYPES.some((item) => item.id === value.researchType);
}
