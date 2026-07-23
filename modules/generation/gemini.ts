import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";

import type { Project } from "@/modules/projects/types";
import type { ResearchStarterSuccess } from "@/modules/research-starter/types";

import { STRUCTURE_PROMPT_VERSION, STRUCTURE_SYSTEM_RULES } from "./prompts/structure-v1";
import {
  researchStructureSchema,
  type ResearchStructure,
  validateReferenceIds,
} from "./schema";

export const GENERATION_MODEL = "gemini-2.5-flash";

function getGoogleProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini não está configurado.");
  return createGoogleGenerativeAI({ apiKey });
}

function compactEvidence(report: ResearchStarterSuccess) {
  return {
    findings: report.keyFindings.slice(0, 8),
    limitations: report.limitations.slice(0, 8),
    references: report.references.slice(0, 20).map((reference) => ({
      authors: reference.authors.slice(0, 6),
      doi: reference.doi,
      referenceId: reference.referenceId,
      title: reference.title,
      url: reference.url,
      year: reference.year,
    })),
    summary: report.summary,
    warnings: report.warnings.slice(0, 8),
  };
}

export async function generateResearchStructure(
  project: Project,
  report: ResearchStarterSuccess,
): Promise<ResearchStructure> {
  const evidence = compactEvidence(report);
  const prompt = [
    ...STRUCTURE_SYSTEM_RULES,
    "Use referenceIds somente quando a afirmação estiver apoiada pela evidência fornecida.",
    "Não escreva bibliografia fictícia. Quando faltar evidência, declare a lacuna em warnings.",
    `Versão do prompt: ${STRUCTURE_PROMPT_VERSION}.`,
    `Briefing do projeto: ${JSON.stringify({
      academicLevel: project.academic_level,
      knowledgeArea: project.knowledge_area,
      keywords: project.keywords,
      problemStatement: project.problem_statement,
      theme: project.theme,
      title: project.title,
    })}`,
    `Evidências verificadas: ${JSON.stringify(evidence)}`,
  ].join("\n");

  const { output } = await generateText({
    maxOutputTokens: 8_000,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: researchStructureSchema }),
    prompt,
    temperature: 0.25,
  });

  const structure = researchStructureSchema.parse(output);
  const allowedReferenceIds = new Set(report.references.map((reference) => reference.referenceId));
  const invalidReferenceIds = validateReferenceIds(structure, allowedReferenceIds);
  if (invalidReferenceIds.length > 0) {
    throw new Error(`Referências não verificadas: ${invalidReferenceIds.join(", ")}`);
  }
  return structure;
}
