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

type ResearchRequestInput = Pick<
  Project,
  "academic_level" | "keywords" | "knowledge_area" | "problem_statement" | "theme" | "title"
>;

const interpretedResearchRequestSchema = z.object({
  knowledgeArea: z.string().trim().min(2).max(100),
  knowledgeAreaProposed: z.boolean(),
  keywords: z.array(z.string().trim().min(2).max(80)).min(3).max(10),
  researchQuery: z.string().trim().min(8).max(240),
  title: z.string().trim().min(3).max(80),
});

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

export async function interpretResearchRequest(
  project: ResearchRequestInput,
  options: { replacementKeywords?: string[] } = {},
) {
  const prompt = [
    "Interprete o pedido de pesquisa sem inventar informações.",
    "Produza um título curto e acadêmico, com no máximo 80 caracteres.",
    "Produza a consulta temática para busca bibliográfica em inglês, com no máximo 240 caracteres.",
    "Mantenha título e área do conhecimento no idioma do pedido; somente researchQuery deve estar em inglês.",
    "A consulta deve conter apenas o objeto de estudo, relações centrais, população ou contexto relevante.",
    "Remova instruções operacionais como 'preciso', 'crie', 'faça', 'estrutura', 'monografia', 'tese' ou pedidos sobre formato.",
    "Escolha termos que funcionem em bases acadêmicas e preserve o sentido do usuário.",
    "Extraia de 3 a 10 palavras-chave específicas. Não inclua termos genéricos sobre escrita acadêmica.",
    "Identifique a área do conhecimento. Se ela estiver explícita, preserve-a e retorne knowledgeAreaProposed=false.",
    "Se a área não estiver explícita, proponha a mais adequada e retorne knowledgeAreaProposed=true.",
    "Quando houver palavras-chave fornecidas pelo usuário, trate-as como orientação prioritária para a consulta.",
    ...(options.replacementKeywords?.length
      ? [
          "As novas palavras-chave abaixo substituem o foco anterior da pesquisa.",
          "Crie título, área, palavras-chave e researchQuery a partir desse novo foco. Não preserve um objeto de estudo conflitante do briefing original.",
          `Novo foco obrigatório: ${JSON.stringify(options.replacementKeywords)}`,
        ]
      : []),
    `Pedido integral: ${JSON.stringify({
      academicLevel: project.academic_level,
      knowledgeArea: project.knowledge_area,
      keywords: project.keywords,
      prompt: project.problem_statement,
      theme: project.theme,
      provisionalTitle: project.title,
    })}`,
  ].join("\n");

  const { output } = await generateText({
    maxOutputTokens: 500,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: interpretedResearchRequestSchema }),
    prompt,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      } satisfies GoogleLanguageModelOptions,
    },
    temperature: 0.1,
  });

  return interpretedResearchRequestSchema.parse({
    knowledgeArea: output.knowledgeArea.trim(),
    knowledgeAreaProposed: output.knowledgeAreaProposed,
    keywords: [...new Set(output.keywords.map((keyword) => keyword.trim()).filter(Boolean))].slice(0, 10),
    researchQuery: output.researchQuery.trim(),
    title: output.title.trim(),
  });
}

export async function generateResearchStructure(
  project: Project,
  report: ResearchStarterSuccess,
  options: { replacementFocus?: boolean } = {},
): Promise<ResearchStructure> {
  const evidence = compactEvidence(report);
  const prompt = [
    ...STRUCTURE_SYSTEM_RULES,
    "Use referenceIds somente quando a afirmação estiver apoiada pela evidência fornecida.",
    "Não escreva bibliografia fictícia. Quando faltar evidência, declare a lacuna em warnings.",
    "Crie um título curto, específico e informativo, com no máximo 80 caracteres.",
    ...(options.replacementFocus
      ? ["O tema e as palavras-chave atuais substituem o foco conflitante do briefing original. Toda a estrutura deve refletir o foco atual e as novas evidências."]
      : []),
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
