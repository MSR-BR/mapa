import "server-only";

import { createGoogleGenerativeAI, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

import type { Project } from "@/modules/projects/types";
import type { ResearchStarterSuccess } from "@/modules/research-starter/types";
import type { StoredReference } from "./types";
import type { ChapterTopicInput } from "@/modules/research-workflow/chapter-validation";
import { formatResearchProductGuidance, type ResearchProductType } from "@/modules/research-workflow/research-level-guidance";
import type { ResearchIntake } from "@/modules/projects/research-intake";
import { methodologyPlanInputSchema, type MethodologyPlanInput } from "@/modules/research-workflow/methodology-validation";
import type { FinalMap } from "@/modules/research-workflow/final-map";
import {
  coherenceFindingSchema,
  problemCandidateSchema,
  problemCandidatesSchema,
  type InterpretedDiscovery,
  type ProblemCandidate,
  type ProposalDiscovery,
} from "@/modules/research-workflow/schema";

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
  researchType: z.string().trim().min(2).max(40).nullable().default(null),
  researchGuidance: z.string().trim().max(8_000).nullable().default(null),
  title: z.string().trim().min(3).max(80),
});

const promptSuggestionsSchema = z.object({
  suggestions: z.array(z.object({
    kind: z.enum(["tema", "formulacao"]),
    text: z.string().trim().min(12).max(500),
  })).min(2).max(3),
});

const broaderResearchQuerySchema = z.object({
  searchTerms: z.array(z.string().trim().min(2).max(40)).min(3).max(5),
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

const generatedProblemCandidatesSchema = z.object({
  candidates: z.array(problemCandidateSchema.omit({ id: true })).length(6),
});

const generatedDefinitionSchema = z.object({
  content: z.string().trim().min(20).max(700),
  referenceIds: z.array(z.string().trim().min(1).max(120)).max(12),
});

const generatedSpecificObjectivesSchema = z.object({
  objectives: z.array(generatedDefinitionSchema).length(4),
});

const generatedChapterTopicsSchema = z.object({
  topics: z.array(z.object({
    exceptionJustification: z.string().trim().min(10).max(500).nullable(),
    generalObjectiveAligned: z.boolean(),
    objectiveCoverage: z.array(z.object({
      degree: z.enum(["partial", "full"]),
      objectiveId: z.string().uuid(),
    })).max(7),
    referenceIds: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
    studentJustification: z.string().trim().max(1_000).nullable().default(null),
    title: z.string().trim().min(3).max(180),
  })).min(3).max(6),
});

const generatedMethodologyPlanSchema = z.object({
  classification: z.object({
    analysisTechniques: z.array(z.string().trim().min(2).max(120)).min(1).max(6),
    approach: z.enum(["Qualitativa", "Quantitativa", "Mista"]),
    ethicsWarnings: z.array(z.string().trim().min(10).max(400)).max(6),
    instruments: z.array(z.string().trim().min(2).max(120)).min(1).max(8),
    nature: z.enum(["Básica", "Aplicada"]),
    objectives: z.array(z.enum(["Exploratória", "Descritiva", "Explicativa"])).min(1).max(3),
    procedures: z.array(z.string().trim().min(2).max(120)).min(1).max(8),
    rationale: z.string().trim().min(20).max(800),
  }),
  rows: z.array(z.object({
    analysisTreatment: z.string().trim().min(20).max(1_200),
    associatedTopicIds: z.array(z.string().uuid()).max(12),
    dataCollection: z.string().trim().min(20).max(1_200),
    expectedResult: z.string().trim().min(20).max(1_000),
    objectiveId: z.string().uuid(),
    studentJustification: z.string().trim().max(1_000).nullable().default(null),
  })).min(3).max(7),
  title: z.string().trim().min(3).max(120),
});

const generatedCoherenceReviewSchema = z.object({
  findings: z.array(coherenceFindingSchema.omit({ id: true }).extend({
    severity: z.enum(["warning", "suggestion"]),
  })).max(8),
});

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

function compactDiscoveryEvidence(discovery: ProposalDiscovery) {
  return discovery.references.map((reference) => ({
    abstract: reference.abstract?.slice(0, 1_500) ?? null,
    authors: reference.authors,
    doi: reference.doi,
    journal: reference.journal,
    referenceId: reference.referenceId,
    source: reference.source,
    title: reference.title,
    volumeIssuePages: reference.volumeIssuePages,
    year: reference.year,
  }));
}

function studentContextPrompt(studentContext: string[]) {
  return studentContext.length > 0
    ? `Reflexões/justificativas registradas pelo aluno, que devem orientar a geração sem serem copiadas literalmente: ${JSON.stringify(studentContext.slice(0, 20))}`
    : "Não há justificativas adicionais do aluno registradas para esta geração.";
}

function assertDiscoveryReferenceIds(referenceIds: string[], discovery: ProposalDiscovery) {
  const allowed = new Set(discovery.references.map((reference) => reference.referenceId));
  const invalid = referenceIds.filter((referenceId) => !allowed.has(referenceId));
  if (invalid.length > 0) throw new Error(`Referências não verificadas: ${[...new Set(invalid)].join(", ")}`);
}

export async function suggestResearchPrompts(prompt: string) {
  const { output } = await generateText({
    maxOutputTokens: 500,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: promptSuggestionsSchema }),
    prompt: [
      "Ajude o usuário a consolidar um pedido para criar um mapa de pesquisa acadêmica.",
      "Retorne exatamente 3 sugestões curtas em português.",
      "Cada sugestão deve ser um pedido completo que possa substituir o texto atual no campo.",
      "Inclua pelo menos uma sugestão de tema: um recorte relevante e coerente com a intenção já escrita.",
      "Inclua pelo menos uma sugestão de formulação: reescreva o pedido com maior precisão acadêmica.",
      "Quando houver informação suficiente, explicite objeto, relação investigada, contexto ou população.",
      "Não invente instituições, locais, períodos, populações ou métodos não indicados pelo usuário.",
      "Não responda ao tema e não crie a estrutura da pesquisa; apenas aprimore o pedido.",
      `Texto em elaboração: ${JSON.stringify(prompt.slice(0, 5_000))}`,
    ].join("\n"),
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      } satisfies GoogleLanguageModelOptions,
    },
    temperature: 0.45,
  });

  return promptSuggestionsSchema.parse(output).suggestions.map((suggestion) => ({
    kind: suggestion.kind,
    text: suggestion.text.trim(),
  }));
}

export async function broadenResearchQuery(
  project: ResearchRequestInput,
  currentQuery: string,
) {
  const { output } = await generateText({
    maxOutputTokens: 160,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: broaderResearchQuerySchema }),
    prompt: [
      "Crie uma consulta bibliográfica mais ampla em inglês para bases acadêmicas.",
      "Retorne entre 3 e 5 termos de busca, cada um com no máximo 3 palavras.",
      "Preserve o objeto científico e a relação principal do pedido.",
      "Remova tipos de documento, grau acadêmico e formulações restritivas como doctoral thesis, dissertation, alignment ou compliance.",
      "Mantenha país ou população somente quando forem essenciais ao recorte.",
      "Não acrescente sinônimos, explicações, operadores booleanos, aspas, métodos ou conceitos ausentes do pedido.",
      `Consulta que não retornou referências verificáveis: ${JSON.stringify(currentQuery)}`,
      `Contexto: ${JSON.stringify({
        knowledgeArea: project.knowledge_area,
        keywords: project.keywords,
        prompt: project.problem_statement,
        title: project.title,
      })}`,
    ].join("\n"),
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      } satisfies GoogleLanguageModelOptions,
    },
    temperature: 0.1,
  });

  return broaderResearchQuerySchema.parse(output).searchTerms.join(" ").trim();
}

export async function interpretResearchRequest(
  project: ResearchRequestInput,
  options: { replacementKeywords?: string[]; initialBriefing?: ResearchIntake | null } = {},
) {
  const researchType = options.initialBriefing?.researchType ?? null;
  const researchGuidance = formatResearchProductGuidance(researchType as ResearchProductType | null);
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
    ...(researchGuidance ? [
      "Respeite o tipo de produto acadêmico selecionado ao resumir o pedido e propor o título; não aumente o escopo apenas para cumprir o nível.",
      `Guia de aprofundamento do produto: ${researchGuidance}`,
    ] : []),
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
    researchType,
    researchGuidance,
    title: output.title.trim(),
  });
}

export async function generateProblemCandidates(
  originalPrompt: string,
  interpreted: InterpretedDiscovery,
  report: ResearchStarterSuccess,
): Promise<ProblemCandidate[]> {
  const evidence = compactEvidence(report);
  const { output } = await generateText({
    maxOutputTokens: 4_500,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: generatedProblemCandidatesSchema }),
    prompt: [
      "Crie exatamente seis propostas acadêmicas distintas para o Mapa da Pesquisa.",
      "Escreva em português do Brasil.",
      "A proposta 1 deve ter kind=exact e ser a correspondência mais fiel possível ao pedido, sem trocar seu objeto central.",
      "As propostas 2 a 6 devem ter kind=alternative e variar de forma material apenas recorte, relação, contexto, perspectiva teórica ou aplicação sustentada pelo pedido ou pelas evidências.",
      "Não produza seis paráfrases do mesmo título e não invente instituições, populações, locais, períodos, métodos ou resultados.",
      "Cada proposta deve conter um título curto, uma única grande pergunta e uma ou duas frases curtas de contexto.",
      "Toda problemQuestion deve começar exatamente por 'Como' ou 'De que forma', ser investigável e não antecipar a resposta.",
      "Use de três a cinco palavras-chave específicas por proposta.",
      "Mantenha knowledgeAreaProposed=true quando a área tiver sido proposta, e false quando estiver explícita no pedido.",
      "Use somente referenceIds presentes nas evidências. Não invente referências.",
      "A posição deve corresponder à ordem de 1 a 6.",
      `Pedido original: ${JSON.stringify(originalPrompt.slice(0, 5_000))}`,
      `Interpretação: ${JSON.stringify(interpreted)}`,
      `Evidências verificadas: ${JSON.stringify(evidence)}`,
    ].join("\n"),
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      } satisfies GoogleLanguageModelOptions,
    },
    temperature: 0.35,
  });

  const candidates = output.candidates.map((candidate) => ({
    ...candidate,
    id: crypto.randomUUID(),
    keywords: [...new Set(candidate.keywords.map((keyword) => keyword.trim()).filter(Boolean))].slice(0, 5),
    referenceIds: [...new Set(candidate.referenceIds.map((referenceId) => referenceId.trim()).filter(Boolean))].slice(0, 12),
  }));
  const parsed = problemCandidatesSchema.parse(candidates);
  const allowedReferenceIds = new Set(report.references.map((reference) => reference.referenceId));
  const unknownReferenceIds = parsed.flatMap((candidate) => candidate.referenceIds)
    .filter((referenceId) => !allowedReferenceIds.has(referenceId));
  if (unknownReferenceIds.length > 0) {
    throw new Error(`Referências não verificadas: ${[...new Set(unknownReferenceIds)].join(", ")}`);
  }
  return parsed;
}

export async function regenerateProblemStatement(
  candidate: ProblemCandidate,
  discovery: ProposalDiscovery,
  studentContext: string[] = [],
) {
  const { output } = await generateText({
    maxOutputTokens: 700,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: generatedDefinitionSchema }),
    prompt: [
      "Reescreva uma única problemática de pesquisa em português do Brasil.",
      "Comece exatamente por 'Como' ou 'De que forma' e termine com um único ponto de interrogação.",
      "Mantenha objeto, relação e recorte da proposta escolhida. Não acrescente método, instituição, população ou resultado.",
      "Use somente referenceIds presentes nas evidências.",
      "Considere referências externas manuais como evidências fornecidas pelo aluno; use especialmente título e abstract.",
      `Proposta escolhida: ${JSON.stringify(candidate)}`,
      studentContextPrompt(studentContext),
      `Evidências: ${JSON.stringify(compactDiscoveryEvidence(discovery))}`,
    ].join("\n"),
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } satisfies GoogleLanguageModelOptions },
    temperature: 0.25,
  });
  const result = generatedDefinitionSchema.parse(output);
  assertDiscoveryReferenceIds(result.referenceIds, discovery);
  return result;
}

export async function generateGeneralObjective(
  problemStatement: string,
  candidate: ProblemCandidate,
  discovery: ProposalDiscovery,
  studentContext: string[] = [],
) {
  const { output } = await generateText({
    maxOutputTokens: 700,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: generatedDefinitionSchema }),
    prompt: [
      "Crie exatamente um objetivo geral em português do Brasil.",
      "Inicie com verbo no infinitivo e responda diretamente à problemática.",
      "Expresse o principal resultado intelectual pretendido, sem antecipar resultado empírico e sem ampliar o escopo.",
      "Não acrescente método, instituição, população ou recorte ausente.",
      "Use somente referenceIds presentes nas evidências.",
      "Considere referências externas manuais como evidências fornecidas pelo aluno; use especialmente título e abstract.",
      `Problemática validada: ${JSON.stringify(problemStatement)}`,
      `Proposta escolhida: ${JSON.stringify(candidate)}`,
      studentContextPrompt(studentContext),
      `Evidências: ${JSON.stringify(compactDiscoveryEvidence(discovery))}`,
    ].join("\n"),
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } satisfies GoogleLanguageModelOptions },
    temperature: 0.2,
  });
  const result = generatedDefinitionSchema.parse(output);
  assertDiscoveryReferenceIds(result.referenceIds, discovery);
  return result;
}

export async function generateSpecificObjectives(
  problemStatement: string,
  generalObjective: string,
  discovery: ProposalDiscovery,
  studentContext: string[] = [],
) {
  const { output } = await generateText({
    maxOutputTokens: 2_400,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: generatedSpecificObjectivesSchema }),
    prompt: [
      "Crie exatamente quatro objetivos específicos em português do Brasil.",
      "Cada objetivo começa com verbo no infinitivo e representa uma etapa necessária para atender o objetivo geral.",
      "Organize uma progressão lógica, sem impor verbos mecanicamente, sem redundâncias e sem objetivos mais amplos que o geral.",
      "Não acrescente método, instituição, população, resultado ou produto ausente no escopo validado.",
      "Use somente referenceIds presentes nas evidências.",
      "Considere referências externas manuais como evidências fornecidas pelo aluno; use especialmente título e abstract.",
      `Problemática validada: ${JSON.stringify(problemStatement)}`,
      `Objetivo geral validado: ${JSON.stringify(generalObjective)}`,
      studentContextPrompt(studentContext),
      `Evidências: ${JSON.stringify(compactDiscoveryEvidence(discovery))}`,
    ].join("\n"),
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } satisfies GoogleLanguageModelOptions },
    temperature: 0.25,
  });
  const objectives = generatedSpecificObjectivesSchema.parse(output).objectives;
  assertDiscoveryReferenceIds(objectives.flatMap((objective) => objective.referenceIds), discovery);
  return objectives;
}

function assertGeneratedTopicLinks(
  topics: Omit<ChapterTopicInput, "id">[],
  objectiveIds: Set<string>,
  discovery: ProposalDiscovery,
) {
  assertDiscoveryReferenceIds(topics.flatMap((topic) => topic.referenceIds), discovery);
  const invalidObjectives = topics.flatMap((topic) => topic.objectiveCoverage)
    .filter((coverage) => !objectiveIds.has(coverage.objectiveId));
  if (invalidObjectives.length > 0) throw new Error("A IA relacionou um tópico a objetivo inexistente.");
}

export async function generateLiteratureTopics(
  problemStatement: string,
  generalObjective: string,
  specificObjectives: Array<{ content: string; id: string }>,
  discovery: ProposalDiscovery,
  acceptedConcepts: string[] = [],
  studentContext: string[] = [],
) {
  const { output } = await generateText({
    maxOutputTokens: 3_200,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: generatedChapterTopicsSchema }),
    prompt: [
      "Crie exatamente quatro tópicos para o Capítulo 2 — Revisão da Literatura, em português do Brasil.",
      "Cubra conceitos, teorias, modelos, contexto normativo ou evidências necessários à problemática e aos objetivos.",
      "Cada título deve ser curto, acadêmico e não pode afirmar resultados da pesquisa.",
      "Relacione cada tópico a um ou mais IDs reais de objetivos específicos e indique cobertura partial ou full.",
      "Use somente referenceIds presentes nas evidências e associe ao menos uma referência verificável por tópico.",
      "Conceitos controlados aceitos são vocabulário candidato; só os inclua se forem coerentes com o tema e sustentados pelas evidências.",
      "Considere referências externas manuais como evidências fornecidas pelo aluno; use especialmente título e abstract.",
      `Problemática: ${JSON.stringify(problemStatement)}`,
      `Objetivo geral: ${JSON.stringify(generalObjective)}`,
      `Objetivos específicos: ${JSON.stringify(specificObjectives)}`,
      `Conceitos controlados aceitos: ${JSON.stringify(acceptedConcepts)}`,
      studentContextPrompt(studentContext),
      `Evidências: ${JSON.stringify(compactDiscoveryEvidence(discovery))}`,
    ].join("\n"),
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } satisfies GoogleLanguageModelOptions },
    temperature: 0.25,
  });
  const topics = generatedChapterTopicsSchema.parse(output).topics.map((topic) => ({
    ...topic,
    exceptionJustification: null,
    generalObjectiveAligned: false,
    studentJustification: null,
  }));
  assertGeneratedTopicLinks(topics, new Set(specificObjectives.map((objective) => objective.id)), discovery);
  return topics;
}

export async function generateDevelopmentTopics(
  problemStatement: string,
  generalObjective: string,
  generalObjectiveId: string,
  specificObjectives: Array<{ content: string; id: string }>,
  literatureTopics: ChapterTopicInput[],
  discovery: ProposalDiscovery,
  studentContext: string[] = [],
) {
  const { output } = await generateText({
    maxOutputTokens: 3_200,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: generatedChapterTopicsSchema }),
    prompt: [
      "Crie exatamente quatro tópicos para o Capítulo 4 — Desenvolvimento, Estudo de Caso, Análise e Discussão, em português do Brasil.",
      "Operacionalize os objetivos específicos que não foram atendidos exclusivamente pela revisão da literatura.",
      "Se a pesquisa for estudo de caso, o tópico 4.1 pode ser apenas a apresentação do caso, suas características e contexto; nesse caso, pode retornar objectiveCoverage=[] com exceptionJustification explicando que se trata de apresentação do estudo de caso.",
      "Derive semanticamente os títulos das ações dos objetivos sem copiá-los mecanicamente.",
      "Não use expressões como 'resultados encontrados' ou 'resultados obtidos', pois a pesquisa ainda é uma proposta.",
      "Relacione os demais tópicos a um ou mais IDs reais de objetivos específicos.",
      "O objetivo geral também pode ser usado no Capítulo 4 com o ID informado como OEG; ele deve aparecer sobretudo no último tópico ou em tópico de síntese.",
      "O último tópico deve se relacionar diretamente ao objetivo geral e retornar generalObjectiveAligned=true ou incluir o ID do objetivo geral em objectiveCoverage; use justificativa somente se isso for metodologicamente impossível.",
      "Use somente referenceIds presentes nas evidências e associe ao menos uma referência verificável por tópico.",
      "Considere referências externas manuais como evidências fornecidas pelo aluno; use especialmente título e abstract.",
      `Problemática: ${JSON.stringify(problemStatement)}`,
      `Objetivo geral: ${JSON.stringify(generalObjective)}`,
      `ID do objetivo geral (OEG): ${JSON.stringify(generalObjectiveId)}`,
      `Objetivos específicos: ${JSON.stringify(specificObjectives)}`,
      `Cobertura do Capítulo 2: ${JSON.stringify(literatureTopics)}`,
      studentContextPrompt(studentContext),
      `Evidências: ${JSON.stringify(compactDiscoveryEvidence(discovery))}`,
    ].join("\n"),
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } satisfies GoogleLanguageModelOptions },
    temperature: 0.25,
  });
  const topics = generatedChapterTopicsSchema.parse(output).topics;
  assertGeneratedTopicLinks(topics, new Set([...specificObjectives.map((objective) => objective.id), generalObjectiveId]), discovery);
  return topics;
}

export async function generateMethodologyPlan(
  problemStatement: string,
  generalObjective: string,
  generalObjectiveId: string,
  specificObjectives: Array<{ content: string; id: string }>,
  literatureTopics: ChapterTopicInput[],
  developmentTopics: ChapterTopicInput[],
  discovery: ProposalDiscovery,
  existingRows: MethodologyPlanInput["rows"] = [],
  improvementNotes: string[] = [],
  studentContext: string[] = [],
) {
  const chapterTopics = [...literatureTopics, ...developmentTopics].map((topic) => ({
    chapter: literatureTopics.some((item) => item.id === topic.id) ? "Capítulo 2" : "Capítulo 4",
    id: topic.id,
    objectiveCoverage: topic.objectiveCoverage,
    title: topic.title,
  }));
  const objectiveIds = new Set(specificObjectives.map((objective) => objective.id));
  const topicIds = new Set(chapterTopics.map((topic) => topic.id));
  const existingByObjective = new Map(existingRows.map((row) => [row.objectiveId, row.id]));

  const { output } = await generateText({
    maxOutputTokens: 5_000,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: generatedMethodologyPlanSchema }),
    prompt: [
      "Crie a matriz metodológica de uma proposta de pesquisa em português do Brasil.",
      "A matriz deve ter exatamente uma linha para cada objetivo específico validado e uma linha final para o objetivo geral, usando o ID informado como OEG.",
      "Para cada linha, descreva como as informações/dados serão levantados, como serão analisados/tratados e qual resultado esperado ou impacto é pretendido.",
      "Resultados esperados são contribuições, produtos intelectuais, sínteses ou impactos pretendidos. Nunca escreva achados como se a pesquisa já tivesse sido executada.",
      "Classifique a metodologia de modo editável: natureza, objetivos, abordagem, procedimentos, instrumentos, técnicas de análise e avisos éticos.",
      "A classificação deve ser coerente com os instrumentos e técnicas usados nas linhas.",
      "Use apenas objectiveId dos objetivos específicos fornecidos ou o ID do objetivo geral (OEG), e associatedTopicIds dos tópicos dos capítulos 2 e 4 fornecidos.",
      "Cada linha precisa estar ligada a pelo menos um tópico dos capítulos 2 ou 4.",
      improvementNotes.length > 0
        ? `Corrija especificamente estes avisos da versão anterior, sem repetir a mesma deficiência: ${JSON.stringify(improvementNotes)}`
        : "Se estiver regenerando, revise criticamente a coerência entre instrumentos, abordagem e técnicas antes de responder.",
      "Sugira um título final curto derivado do objetivo geral, sem copiar integralmente o objetivo.",
      "Não invente instituição, amostra, local, período, aprovação ética ou dado sensível ausente. Se houver risco ético ou de acesso, registre como aviso.",
      "Considere referências externas manuais como evidências fornecidas pelo aluno; use especialmente título e abstract.",
      `Problemática: ${JSON.stringify(problemStatement)}`,
      `Objetivo geral: ${JSON.stringify(generalObjective)}`,
      `ID do objetivo geral (OEG): ${JSON.stringify(generalObjectiveId)}`,
      `Objetivos específicos: ${JSON.stringify(specificObjectives)}`,
      `Tópicos dos capítulos: ${JSON.stringify(chapterTopics)}`,
      studentContextPrompt(studentContext),
      `Evidências verificadas: ${JSON.stringify(compactDiscoveryEvidence(discovery))}`,
    ].join("\n"),
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } satisfies GoogleLanguageModelOptions },
    temperature: 0.22,
  });

  const generated = generatedMethodologyPlanSchema.parse(output);
  const invalidObjectiveIds = generated.rows.map((row) => row.objectiveId).filter((objectiveId) => !objectiveIds.has(objectiveId) && objectiveId !== generalObjectiveId);
  if (invalidObjectiveIds.length > 0) throw new Error("A IA relacionou uma linha metodológica a objetivo inexistente.");
  const invalidTopicIds = generated.rows.flatMap((row) => row.associatedTopicIds).filter((topicId) => !topicIds.has(topicId));
  if (invalidTopicIds.length > 0) throw new Error("A IA relacionou metodologia a tópico inexistente.");

  return methodologyPlanInputSchema.parse({
    classification: generated.classification,
    rows: generated.rows.map((row) => ({
      ...row,
      id: existingByObjective.get(row.objectiveId) ?? crypto.randomUUID(),
      warnings: [],
    })),
    title: generated.title,
  });
}

export async function reviewFinalMapCoherence(finalMap: FinalMap) {
  const allowedElementIds = new Set(finalMap.nodes.filter((node) => /^[0-9a-f-]{36}$/i.test(node.id)).map((node) => node.id));
  const { output } = await generateText({
    maxOutputTokens: 2_400,
    model: getGoogleProvider()(GENERATION_MODEL),
    output: Output.object({ schema: generatedCoherenceReviewSchema }),
    prompt: [
      "Revise a coerência de uma proposta de pesquisa já validada por regras determinísticas.",
      "Escreva em português do Brasil.",
      "Retorne apenas avisos ou sugestões; não use severity=blocking.",
      "Não reclassifique nem contradiga as inconsistências determinísticas já listadas.",
      "Não invente resultados empíricos, instituições, amostras, autores ou fontes.",
      "Aponte somente problemas acionáveis de alinhamento entre problemática, objetivo geral, objetivos específicos, capítulos, metodologia, resultados esperados e título.",
      "Use somente elementIds presentes nos nós fornecidos e que sejam UUIDs.",
      `Nós: ${JSON.stringify(finalMap.nodes.map((node) => ({
        content: node.content,
        id: node.id,
        kind: node.kind,
        label: node.label,
        title: node.title,
      })))}`,
      `Relações: ${JSON.stringify(finalMap.edges)}`,
      `Achados determinísticos já existentes: ${JSON.stringify(finalMap.findings.map((finding) => ({
        message: finding.message,
        rule: finding.rule,
        severity: finding.severity,
      })))}`,
    ].join("\n"),
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } satisfies GoogleLanguageModelOptions },
    temperature: 0.1,
  });

  return generatedCoherenceReviewSchema.parse(output).findings
    .map((finding) => ({
      ...finding,
      elementIds: finding.elementIds.filter((id) => allowedElementIds.has(id)).slice(0, 12),
      id: crypto.randomUUID(),
      rule: `IA: ${finding.rule}`.slice(0, 120),
    }))
    .filter((finding) => finding.elementIds.length > 0);
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
