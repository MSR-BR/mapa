import "server-only";

import { createGoogleGenerativeAI, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

import type { Project } from "@/modules/projects/types";
import type { ResearchStarterSuccess } from "@/modules/research-starter/types";
import type { StoredReference } from "./types";

import { STRUCTURE_PROMPT_VERSION, STRUCTURE_SYSTEM_RULES } from "./prompts/structure-v1";
import {
  REQUIRED_CHAPTERS,
  RESEARCH_STRUCTURE_SCHEMA_VERSION,
  researchStructureSchema,
  type ResearchStructure,
  validateReferenceIds,
} from "./schema";

export const GENERATION_MODEL = "gemini-2.5-flash";

const generatedStructureSchema = z.object({
  chapters: z.array(z.object({
    sections: z.array(z.object({
      content: z.string(),
      optional: z.boolean(),
      provenance: z.enum(["briefing", "suggestion", "user"]),
      referenceIds: z.array(z.string()),
      title: z.string(),
    })).min(1).max(8),
  })).length(REQUIRED_CHAPTERS.length),
  title: z.string().trim().min(3).max(80),
  warnings: z.array(z.string()),
});

type GeneratedStructure = z.infer<typeof generatedStructureSchema>;

function normalizeGeneratedStructure(output: GeneratedStructure) {
  return researchStructureSchema.parse({
    chapters: output.chapters.map((chapter, chapterIndex) => ({
      id: `chapter-${chapterIndex + 1}`,
      number: chapterIndex + 1,
      sections: chapter.sections.map((section, sectionIndex) => ({
        content: section.content.trim().slice(0, 12_000),
        id: `chapter-${chapterIndex + 1}-section-${sectionIndex + 1}`,
        optional: section.optional,
        provenance: section.provenance,
        referenceIds: [...new Set(section.referenceIds.map((referenceId) => referenceId.trim()).filter(Boolean))].slice(0, 12),
        title: section.title.trim().slice(0, 160),
      })),
      title: REQUIRED_CHAPTERS[chapterIndex],
    })),
    schemaVersion: RESEARCH_STRUCTURE_SCHEMA_VERSION,
    title: output.title.trim().slice(0, 80),
    warnings: output.warnings.map((warning) => warning.trim()).filter(Boolean).slice(0, 12),
  });
}

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
    "Crie um título curto, específico e informativo, com no máximo 80 caracteres.",
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
    output: Output.object({ schema: generatedStructureSchema }),
    prompt,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      } satisfies GoogleLanguageModelOptions,
    },
    temperature: 0.25,
  });

  const structure = normalizeGeneratedStructure(output);
  const allowedReferenceIds = new Set(report.references.map((reference) => reference.referenceId));
  const invalidReferenceIds = validateReferenceIds(structure, allowedReferenceIds);
  if (invalidReferenceIds.length > 0) {
    throw new Error(`Referências não verificadas: ${invalidReferenceIds.join(", ")}`);
  }
  return structure;
}

export async function mergeResearchStructures(
  sources: Array<{ structure: ResearchStructure; title: string }>,
  references: StoredReference[],
): Promise<ResearchStructure> {
  const prompt = [
    ...STRUCTURE_SYSTEM_RULES,
    "Integre os mapas fornecidos em uma única estrutura acadêmica coerente.",
    "Elimine repetições, preserve divergências relevantes e não acrescente fatos que não estejam nas fontes.",
    "Use somente os referenceIds fornecidos. Não invente referências.",
    "Crie um título curto, específico e informativo, com no máximo 80 caracteres.",
    `Mapas de origem: ${JSON.stringify(sources.map((source) => ({
      chapters: source.structure.chapters,
      title: source.title,
      warnings: source.structure.warnings,
    })))}`,
    `Referências verificadas: ${JSON.stringify(references)}`,
  ].join("\n");

  const { output } = await generateText({
    maxOutputTokens: 8_000,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: generatedStructureSchema }),
    prompt,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      } satisfies GoogleLanguageModelOptions,
    },
    temperature: 0.2,
  });
  const structure = normalizeGeneratedStructure(output);
  const invalidReferenceIds = validateReferenceIds(
    structure,
    new Set(references.map((reference) => reference.referenceId)),
  );
  if (invalidReferenceIds.length > 0) {
    throw new Error(`Referências não verificadas: ${invalidReferenceIds.join(", ")}`);
  }
  return structure;
}
