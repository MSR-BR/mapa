import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_WORKFLOW_CONTENT,
  RESEARCH_WORKFLOW_SCHEMA_VERSION,
  problemCandidatesSchema,
  researchWorkflowContentSchema,
  researchWorkflowSchema,
  type MethodologyClassification,
  type MethodologyRow,
  type ResearchWorkflow,
  type ValidatedElement,
} from "../modules/research-workflow/schema";
import {
  assertWorkflowTransition,
  canTransitionWorkflow,
  collectDependentElementTypes,
  nextValidationStatus,
  recoverWorkflowState,
} from "../modules/research-workflow/state-machine";
import {
  validateGeneralObjective,
  validateProblemStatement,
  validateSpecificObjectives,
} from "../modules/research-workflow/definition-validation";
import {
  objectiveCoverageStatus,
  validateChapterTopics,
  validateCompleteObjectiveCoverage,
  type ChapterTopicInput,
} from "../modules/research-workflow/chapter-validation";
import {
  methodologyCompatibilityWarnings,
  validateMethodologyPlan,
  type MethodologyPlanInput,
} from "../modules/research-workflow/methodology-validation";
import {
  buildFinalMap,
  canCompleteFinalMap,
  finalMapSummary,
} from "../modules/research-workflow/final-map";
import { cloneResearchWorkflowContent } from "../modules/research-workflow/clone";
import {
  workflowDashboardMeta,
  workflowDashboardTitle,
} from "../modules/research-workflow/dashboard";
import {
  buildOptimizedDiscoveryKeywords,
  buildOptimizedResearchQuery,
  normalizeLiteratureSearchTerms,
} from "../modules/research-workflow/literature-optimization";
import { isResearchMapV2EnabledForClaims } from "../modules/research-workflow/rollout";
import {
  createFinalMapDocxExport,
} from "../modules/export/docx";
import {
  createFinalMapPdfExport,
} from "../modules/export/pdf";

test("accepts the empty versioned workflow foundation", () => {
  const workflow = researchWorkflowSchema.parse({
    content: EMPTY_WORKFLOW_CONTENT,
    ownerId: "16ba4d4e-bf5b-49d6-8f65-8a678103194b",
    projectId: "f5ce3156-7832-4717-8268-12dcf81fe1c0",
    revision: 1,
    schemaVersion: RESEARCH_WORKFLOW_SCHEMA_VERSION,
    sourceRevision: 1,
    stableState: "draft_prompt",
    state: "draft_prompt",
    updatedAt: "2026-08-07T22:55:00.000Z",
  });

  assert.equal(workflow.schemaVersion, "2.0.0");
  assert.deepEqual(workflow.content, {
    activeStep: null,
    chapterTopicDetails: [],
    coherenceFindings: [],
    discovery: null,
    elementVersions: [],
    elements: [],
    knowledgeSuggestions: [],
    methodologyClassification: null,
    methodologyRows: [],
    referenceArchive: [],
    traceLinks: [],
  });
});

test("rejects unversioned or structurally invalid workflow content", () => {
  assert.equal(researchWorkflowContentSchema.safeParse([]).success, false);
  assert.equal(researchWorkflowContentSchema.safeParse({ elements: "invalid" }).success, false);
});

test("allows only explicit workflow transitions", () => {
  assert.equal(canTransitionWorkflow("draft_prompt", "discovering"), true);
  assert.equal(canTransitionWorkflow("draft_prompt", "completed"), false);
  assert.equal(canTransitionWorkflow("discovering", "failed"), true);
  assert.doesNotThrow(() => assertWorkflowTransition("reviewing_map", "completed"));
  assert.throws(
    () => assertWorkflowTransition("choosing_problem", "validating_literature"),
    /Transição inválida/,
  );
});

test("recovers a failed workflow from its last stable state", () => {
  assert.equal(
    recoverWorkflowState("failed", "validating_specific_objectives"),
    "validating_specific_objectives",
  );
  assert.equal(recoverWorkflowState("reviewing_map", "validating_methodology"), "reviewing_map");
});

test("invalidates all and only descendants of an edited origin", () => {
  assert.deepEqual(
    new Set(collectDependentElementTypes("problem_statement")),
    new Set([
      "general_objective",
      "specific_objective",
      "research_title",
      "literature_topic",
      "development_topic",
      "methodology_mapping",
      "final_map",
    ]),
  );
  assert.deepEqual(
    new Set(collectDependentElementTypes("specific_objective")),
    new Set([
      "literature_topic",
      "development_topic",
      "methodology_mapping",
      "final_map",
    ]),
  );
  assert.deepEqual(collectDependentElementTypes("final_map"), []);
});

test("distinguishes AI suggestions, user edits and system invalidation", () => {
  assert.equal(nextValidationStatus("suggested", "user"), "edited");
  assert.equal(nextValidationStatus("validated", "ai"), "stale");
  assert.equal(nextValidationStatus("validated", "system"), "stale");
});

function makeCandidate(position: number) {
  return {
    context: `Contexto acadêmico suficientemente detalhado para a proposta número ${position}.`,
    id: `00000000-0000-4000-8000-00000000000${position}`,
    kind: position === 1 ? "exact" as const : "alternative" as const,
    knowledgeArea: "Educação",
    knowledgeAreaProposed: true,
    keywords: ["inteligência artificial", "ensino superior", `recorte ${position}`],
    position,
    problemQuestion: `Como o recorte ${position} influencia o ensino superior contemporâneo?`,
    referenceIds: [`ref-${position}`],
    title: `Proposta acadêmica distinta ${position}`,
  };
}

test("requires one exact proposal followed by five distinct alternatives", () => {
  const candidates = Array.from({ length: 6 }, (_, index) => makeCandidate(index + 1));
  assert.equal(problemCandidatesSchema.safeParse(candidates).success, true);

  const duplicated = candidates.map((candidate, index) => index === 5
    ? { ...candidate, title: candidates[0].title }
    : candidate);
  assert.equal(problemCandidatesSchema.safeParse(duplicated).success, false);

  const misplacedExact = candidates.map((candidate, index) => index === 1
    ? { ...candidate, kind: "exact" as const }
    : candidate);
  assert.equal(problemCandidatesSchema.safeParse(misplacedExact).success, false);
});

test("requires each problem to be one explicit research question", () => {
  const candidates = Array.from({ length: 6 }, (_, index) => makeCandidate(index + 1));
  candidates[2] = { ...candidates[2], problemQuestion: "Qual é a influência observada?" };
  assert.equal(problemCandidatesSchema.safeParse(candidates).success, false);
});

test("validates a single research problem with the approved opening", () => {
  assert.deepEqual(
    validateProblemStatement("Como a inteligência artificial influencia a aprendizagem no ensino superior?"),
    [],
  );
  assert.match(validateProblemStatement("Qual é a influência observada?")[0], /começar/);
  assert.match(
    validateProblemStatement("Como ocorre a aprendizagem? E como ocorre a autoria?")[0],
    /única grande pergunta/,
  );
});

test("requires one infinitive general objective aligned with the problem", () => {
  const problem = "Como a inteligência artificial influencia a aprendizagem no ensino superior?";
  assert.deepEqual(
    validateGeneralObjective("Analisar a influência da inteligência artificial na aprendizagem no ensino superior.", problem),
    [],
  );
  assert.match(validateGeneralObjective("A influência será analisada no estudo.", problem)[0], /infinitivo/);
  assert.match(validateGeneralObjective("Caracterizar práticas hospitalares contemporâneas.", problem)[0], /relação explícita/);
});

test("accepts three to six stable specific objectives and detects redundancy", () => {
  const general = "Analisar a influência da inteligência artificial na aprendizagem no ensino superior.";
  const objectives = [
    { content: "Caracterizar o uso da inteligência artificial por estudantes do ensino superior.", id: "00000000-0000-4000-8000-000000000001" },
    { content: "Identificar dimensões da aprendizagem associadas ao uso da inteligência artificial.", id: "00000000-0000-4000-8000-000000000002" },
    { content: "Analisar relações entre inteligência artificial e aprendizagem no ensino superior.", id: "00000000-0000-4000-8000-000000000003" },
    { content: "Propor orientações para o uso da inteligência artificial no ensino superior.", id: "00000000-0000-4000-8000-000000000004" },
  ];
  assert.deepEqual(validateSpecificObjectives(objectives, general), []);
  const redundant = objectives.map((objective, index) => index === 3
    ? { ...objective, content: objectives[2].content }
    : objective);
  assert.match(validateSpecificObjectives(redundant, general).at(-1) ?? "", /redundantes/);
  assert.match(validateSpecificObjectives(objectives.slice(0, 2), general)[0], /três e seis/);
});

const OBJECTIVE_1 = "10000000-0000-4000-8000-000000000001";
const OBJECTIVE_2 = "10000000-0000-4000-8000-000000000002";
const OBJECTIVE_3 = "10000000-0000-4000-8000-000000000003";

function makeChapterTopic(
  id: string,
  title: string,
  objectiveId = OBJECTIVE_1,
  overrides: Partial<ChapterTopicInput> = {},
): ChapterTopicInput {
  return {
    exceptionJustification: null,
    generalObjectiveAligned: false,
    id,
    objectiveCoverage: [{ degree: "partial", objectiveId }],
    referenceIds: ["ref-1"],
    title,
    ...overrides,
  };
}

test("validates chapter limits, distinct titles and verified links", () => {
  const topics = [
    makeChapterTopic("20000000-0000-4000-8000-000000000001", "Fundamentos conceituais"),
    makeChapterTopic("20000000-0000-4000-8000-000000000002", "Modelos explicativos"),
    makeChapterTopic("20000000-0000-4000-8000-000000000003", "Evidências acadêmicas", OBJECTIVE_2),
  ];
  const options = {
    allowedObjectiveIds: new Set([OBJECTIVE_1, OBJECTIVE_2]),
    allowedReferenceIds: new Set(["ref-1"]),
    chapter: "literature" as const,
  };
  assert.deepEqual(validateChapterTopics(topics, options), []);
  assert.match(validateChapterTopics(topics.slice(0, 2), options)[0], /três e seis/);
  assert.match(validateChapterTopics([
    topics[0],
    { ...topics[1], title: topics[0].title },
    topics[2],
  ], options)[0], /redundantes/);
  assert.match(validateChapterTopics([
    { ...topics[0], referenceIds: ["inventada"] },
    topics[1],
    topics[2],
  ], options)[0], /não verificada/);
});

test("accepts a single phrase for literature optimization searches", () => {
  const terms = normalizeLiteratureSearchTerms(" efeito barocalorico ");
  assert.deepEqual(terms, ["efeito barocalorico"]);
  assert.equal(buildOptimizedResearchQuery(terms), "efeito barocalorico");

  const keywords = buildOptimizedDiscoveryKeywords(terms, {
    interpretedTopic: "barocaloric effect in solid-state cooling",
    query: {
      correctedTopic: null,
      interpretedTopic: "barocaloric materials",
      method: "test",
      originalTopic: "efeito barocalorico",
    },
    summary: {
      currentState: "A literatura discute materiais barocalóricos e aplicações em refrigeração.",
      headline: "Materiais barocalóricos para refrigeração",
      overview: "Síntese de teste.",
    },
    topic: "efeito barocalorico",
  }, ["efeito magnetocalorico"]);

  assert.equal(keywords[0], "efeito barocalorico");
  assert.equal(keywords.length >= 3, true);
  assert.equal(keywords.includes("barocaloric"), true);
});

test("blocks premature results and requires a justified final Chapter 4 topic", () => {
  const topics = [
    makeChapterTopic("30000000-0000-4000-8000-000000000001", "Desenho do estudo"),
    makeChapterTopic("30000000-0000-4000-8000-000000000002", "Resultados encontrados na amostra"),
    makeChapterTopic("30000000-0000-4000-8000-000000000003", "Síntese analítica", OBJECTIVE_2),
  ];
  const options = {
    allowedObjectiveIds: new Set([OBJECTIVE_1, OBJECTIVE_2]),
    allowedReferenceIds: new Set(["ref-1"]),
    chapter: "development" as const,
  };
  const errors = validateChapterTopics(topics, options);
  assert.equal(errors.some((error) => /antecipa resultados/.test(error)), true);
  assert.equal(errors.some((error) => /último tópico/.test(error)), true);
  const valid = topics.map((topic, index) => index === 1
    ? { ...topic, title: "Procedimentos de análise" }
    : index === 2
      ? { ...topic, generalObjectiveAligned: true }
      : topic);
  assert.deepEqual(validateChapterTopics(valid, options), []);
});

test("reports objective coverage states and blocks uncovered objectives", () => {
  const literature = [
    makeChapterTopic("40000000-0000-4000-8000-000000000001", "Base teórica", OBJECTIVE_1),
    makeChapterTopic("40000000-0000-4000-8000-000000000002", "Conceitos centrais", OBJECTIVE_1),
    makeChapterTopic("40000000-0000-4000-8000-000000000003", "Contexto normativo", OBJECTIVE_1),
  ];
  const development = [
    makeChapterTopic("50000000-0000-4000-8000-000000000001", "Aplicação empírica", OBJECTIVE_1),
    makeChapterTopic("50000000-0000-4000-8000-000000000002", "Procedimentos analíticos", OBJECTIVE_1),
    makeChapterTopic("50000000-0000-4000-8000-000000000003", "Síntese da proposta", OBJECTIVE_1, { generalObjectiveAligned: true }),
  ];
  assert.equal(objectiveCoverageStatus(OBJECTIVE_1, literature, development), "Atendido em ambos");
  assert.equal(objectiveCoverageStatus(OBJECTIVE_2, literature, development), "Não atendido");
  assert.match(validateCompleteObjectiveCoverage(literature, development, [OBJECTIVE_1, OBJECTIVE_2])[0], /sem destino/);
  const literatureFull = literature.map((topic, index) => index === 0
    ? { ...topic, objectiveCoverage: [{ degree: "full" as const, objectiveId: OBJECTIVE_2 }] }
    : topic);
  assert.equal(objectiveCoverageStatus(OBJECTIVE_2, literatureFull, development), "Atendido no Capítulo 2");
  assert.deepEqual(validateCompleteObjectiveCoverage(literatureFull, development, [OBJECTIVE_1, OBJECTIVE_2]), []);
});

function makeMethodologyPlan(overrides: Partial<MethodologyPlanInput> = {}): MethodologyPlanInput {
  return {
    classification: {
      analysisTechniques: ["Análise de conteúdo", "Estatística descritiva"],
      approach: "Mista",
      ethicsWarnings: ["Avaliar necessidade de aprovação institucional caso haja participantes humanos."],
      instruments: ["Documentos acadêmicos", "Questionário estruturado"],
      nature: "Aplicada",
      objectives: ["Exploratória", "Descritiva"],
      procedures: ["Pesquisa documental", "Survey"],
      rationale: "A classificação combina revisão documental e levantamento estruturado para atender aos objetivos validados.",
    },
    rows: [
      {
        analysisTreatment: "Os dados serão organizados por categorias temáticas e confrontados com a literatura selecionada.",
        associatedTopicIds: ["40000000-0000-4000-8000-000000000001"],
        dataCollection: "Serão levantados documentos, artigos e registros acadêmicos relacionados ao primeiro objetivo.",
        expectedResult: "Espera-se produzir uma síntese conceitual que delimite o fenômeno investigado.",
        id: "60000000-0000-4000-8000-000000000001",
        objectiveId: OBJECTIVE_1,
        warnings: [],
      },
      {
        analysisTreatment: "As respostas serão tratadas por estatística descritiva e interpretação comparativa dos padrões.",
        associatedTopicIds: ["50000000-0000-4000-8000-000000000001"],
        dataCollection: "Serão coletadas respostas por questionário estruturado junto ao público definido no projeto.",
        expectedResult: "Espera-se caracterizar dimensões relevantes para orientar a discussão da proposta.",
        id: "60000000-0000-4000-8000-000000000002",
        objectiveId: OBJECTIVE_2,
        warnings: [],
      },
      {
        analysisTreatment: "Os achados documentais e descritivos serão triangulados para elaborar recomendações coerentes.",
        associatedTopicIds: ["50000000-0000-4000-8000-000000000002"],
        dataCollection: "Serão reunidos registros e evidências derivados das etapas anteriores da proposta.",
        expectedResult: "Espera-se formular recomendações acadêmicas alinhadas ao objetivo geral da pesquisa.",
        id: "60000000-0000-4000-8000-000000000003",
        objectiveId: OBJECTIVE_3,
        warnings: [],
      },
    ],
    title: "Inteligência Artificial e Aprendizagem no Ensino Superior",
    ...overrides,
  };
}

test("validates methodology matrix coverage and expected-result wording", () => {
  const options = {
    allowedObjectiveIds: new Set([OBJECTIVE_1, OBJECTIVE_2, OBJECTIVE_3]),
    allowedTopicIds: new Set([
      "40000000-0000-4000-8000-000000000001",
      "50000000-0000-4000-8000-000000000001",
      "50000000-0000-4000-8000-000000000002",
    ]),
    generalObjective: "Analisar a influência da inteligência artificial na aprendizagem no ensino superior.",
  };
  assert.deepEqual(validateMethodologyPlan(makeMethodologyPlan(), options).errors, []);
  assert.match(validateMethodologyPlan(makeMethodologyPlan({
    rows: makeMethodologyPlan().rows.map((row, index) => index === 2 ? { ...row, objectiveId: OBJECTIVE_1 } : row),
  }), options).errors.join(" "), /objetivo específico/);
  assert.match(validateMethodologyPlan(makeMethodologyPlan({
    rows: makeMethodologyPlan().rows.map((row, index) => index === 0
      ? { ...row, expectedResult: "Foram encontrados resultados conclusivos sobre a aprendizagem." }
      : row),
  }), options).errors[0], /já tivesse sido executada/);
});

test("warns about uncertain methodology compatibility without blocking", () => {
  const plan = makeMethodologyPlan({
    classification: {
      ...makeMethodologyPlan().classification,
      approach: "Qualitativa",
      analysisTechniques: ["Estatística inferencial"],
    },
    rows: makeMethodologyPlan().rows.map((row, index) => index === 0
      ? { ...row, analysisTreatment: "Os relatos serão analisados por regressão estatística inferencial.", dataCollection: "Serão realizadas entrevistas semiestruturadas com participantes." }
      : row),
  });
  const warnings = methodologyCompatibilityWarnings(plan.rows, plan.classification);
  assert.equal(warnings.some((warning) => /entrevistas/.test(warning)), true);
  assert.equal(warnings.some((warning) => /^OE1 \(objetivo específico 1\)/.test(warning)), true);
  assert.equal(warnings.every((warning) => !/Linha/.test(warning)), true);
  assert.equal(warnings.some((warning) => /abordagem qualitativa/.test(warning)), true);
});

const PROBLEM_ID = "70000000-0000-4000-8000-000000000001";
const GENERAL_ID = "70000000-0000-4000-8000-000000000002";
const TITLE_ID = "70000000-0000-4000-8000-000000000003";
const LITERATURE_1 = "40000000-0000-4000-8000-000000000001";
const LITERATURE_2 = "40000000-0000-4000-8000-000000000002";
const LITERATURE_3 = "40000000-0000-4000-8000-000000000003";
const DEVELOPMENT_1 = "50000000-0000-4000-8000-000000000001";
const DEVELOPMENT_2 = "50000000-0000-4000-8000-000000000002";
const DEVELOPMENT_3 = "50000000-0000-4000-8000-000000000003";

function validatedElement(id: string, type: ValidatedElement["type"], approvedContent: string, referenceIds: string[] = []): ValidatedElement {
  return {
    approvedContent,
    id,
    proposedContent: approvedContent,
    referenceIds,
    revision: 1,
    sourceRevision: 1,
    status: "validated",
    type,
    updatedBy: "user",
  };
}

function makeCompleteWorkflow(overrides: Partial<ResearchWorkflow> = {}): ResearchWorkflow {
  const candidates = Array.from({ length: 6 }, (_, index) => makeCandidate(index + 1));
  const methodologyPlan = makeMethodologyPlan();
  const methodologyClassification: MethodologyClassification = {
    ...methodologyPlan.classification,
    revision: 1,
    sourceRevision: 1,
    status: "validated",
    updatedBy: "ai",
  };
  const methodologyRows: MethodologyRow[] = methodologyPlan.rows.map((row) => ({
    ...row,
    revision: 1,
    sourceRevision: 1,
    status: "validated",
    updatedBy: "ai",
  }));
  return researchWorkflowSchema.parse({
    content: {
      activeStep: null,
      chapterTopicDetails: [
        { chapter: "literature", exceptionJustification: null, generalObjectiveAligned: false, objectiveCoverage: [{ degree: "partial", objectiveId: OBJECTIVE_1 }], order: 1, topicId: LITERATURE_1 },
        { chapter: "literature", exceptionJustification: null, generalObjectiveAligned: false, objectiveCoverage: [{ degree: "partial", objectiveId: OBJECTIVE_2 }], order: 2, topicId: LITERATURE_2 },
        { chapter: "literature", exceptionJustification: null, generalObjectiveAligned: false, objectiveCoverage: [{ degree: "partial", objectiveId: OBJECTIVE_3 }], order: 3, topicId: LITERATURE_3 },
        { chapter: "development", exceptionJustification: null, generalObjectiveAligned: false, objectiveCoverage: [{ degree: "partial", objectiveId: OBJECTIVE_1 }], order: 1, topicId: DEVELOPMENT_1 },
        { chapter: "development", exceptionJustification: null, generalObjectiveAligned: false, objectiveCoverage: [{ degree: "partial", objectiveId: OBJECTIVE_2 }], order: 2, topicId: DEVELOPMENT_2 },
        { chapter: "development", exceptionJustification: null, generalObjectiveAligned: true, objectiveCoverage: [{ degree: "full", objectiveId: OBJECTIVE_3 }], order: 3, topicId: DEVELOPMENT_3 },
      ],
      coherenceFindings: [],
      discovery: {
        candidates,
        generatedAt: "2026-08-08T10:00:00.000Z",
        interpreted: {
          knowledgeArea: "Educação",
          knowledgeAreaProposed: true,
          keywords: ["inteligência artificial", "aprendizagem", "ensino superior"],
          researchQuery: "inteligência artificial aprendizagem ensino superior",
          title: "IA e aprendizagem",
        },
        originalPrompt: "Crie um roteiro de pesquisa sobre inteligência artificial e aprendizagem no ensino superior.",
        references: Array.from({ length: 6 }, (_, index) => ({
          authors: [`Autor ${index + 1}`],
          doi: null,
          referenceId: `ref-${index + 1}`,
          title: `Fonte verificável ${index + 1}`,
          url: `https://example.com/ref-${index + 1}`,
          year: 2024,
        })),
        reportId: "rs-test",
        selectedCandidateId: candidates[0].id,
        warnings: [],
      },
      elementVersions: [],
      elements: [
        validatedElement(PROBLEM_ID, "problem_statement", "Como a inteligência artificial influencia a aprendizagem no ensino superior?", ["ref-1"]),
        validatedElement(GENERAL_ID, "general_objective", "Analisar a influência da inteligência artificial na aprendizagem no ensino superior.", ["ref-1"]),
        validatedElement(OBJECTIVE_1, "specific_objective", "Caracterizar o uso da inteligência artificial por estudantes do ensino superior.", ["ref-1"]),
        validatedElement(OBJECTIVE_2, "specific_objective", "Identificar dimensões da aprendizagem associadas à inteligência artificial no ensino superior.", ["ref-1"]),
        validatedElement(OBJECTIVE_3, "specific_objective", "Propor recomendações para integrar inteligência artificial à aprendizagem no ensino superior.", ["ref-1"]),
        validatedElement(LITERATURE_1, "literature_topic", "Fundamentos conceituais da inteligência artificial na educação", ["ref-1"]),
        validatedElement(LITERATURE_2, "literature_topic", "Aprendizagem no ensino superior mediada por tecnologias", ["ref-1"]),
        validatedElement(LITERATURE_3, "literature_topic", "Evidências acadêmicas sobre uso educacional de IA", ["ref-1"]),
        validatedElement(DEVELOPMENT_1, "development_topic", "Contexto institucional do uso de IA no ensino superior", ["ref-1"]),
        validatedElement(DEVELOPMENT_2, "development_topic", "Procedimentos de análise das práticas de aprendizagem", ["ref-1"]),
        validatedElement(DEVELOPMENT_3, "development_topic", "Síntese propositiva para integração da IA à aprendizagem", ["ref-1"]),
        validatedElement(TITLE_ID, "research_title", "Inteligência Artificial e Aprendizagem no Ensino Superior", ["ref-1"]),
      ],
      knowledgeSuggestions: [],
      methodologyClassification,
      methodologyRows,
      referenceArchive: [],
      traceLinks: [
        { fromElementId: PROBLEM_ID, rule: "Problemática orienta o objetivo geral.", sourceRevision: 1, toElementId: GENERAL_ID },
        { fromElementId: GENERAL_ID, rule: "Objetivo geral se desdobra em objetivo específico.", sourceRevision: 1, toElementId: OBJECTIVE_1 },
        { fromElementId: GENERAL_ID, rule: "Objetivo geral se desdobra em objetivo específico.", sourceRevision: 1, toElementId: OBJECTIVE_2 },
        { fromElementId: GENERAL_ID, rule: "Objetivo geral se desdobra em objetivo específico.", sourceRevision: 1, toElementId: OBJECTIVE_3 },
        { fromElementId: OBJECTIVE_1, rule: "Objetivo específico fundamenta tópico.", sourceRevision: 1, toElementId: LITERATURE_1 },
        { fromElementId: OBJECTIVE_2, rule: "Objetivo específico fundamenta tópico.", sourceRevision: 1, toElementId: LITERATURE_2 },
        { fromElementId: OBJECTIVE_3, rule: "Objetivo específico fundamenta tópico.", sourceRevision: 1, toElementId: LITERATURE_3 },
        { fromElementId: OBJECTIVE_1, rule: "Objetivo específico orienta desenvolvimento.", sourceRevision: 1, toElementId: DEVELOPMENT_1 },
        { fromElementId: OBJECTIVE_2, rule: "Objetivo específico orienta desenvolvimento.", sourceRevision: 1, toElementId: DEVELOPMENT_2 },
        { fromElementId: OBJECTIVE_3, rule: "Objetivo específico orienta desenvolvimento.", sourceRevision: 1, toElementId: DEVELOPMENT_3 },
        { fromElementId: OBJECTIVE_1, rule: "Objetivo específico orienta linha metodológica.", sourceRevision: 1, toElementId: methodologyRows[0].id },
        { fromElementId: OBJECTIVE_2, rule: "Objetivo específico orienta linha metodológica.", sourceRevision: 1, toElementId: methodologyRows[1].id },
        { fromElementId: OBJECTIVE_3, rule: "Objetivo específico orienta linha metodológica.", sourceRevision: 1, toElementId: methodologyRows[2].id },
        { fromElementId: GENERAL_ID, rule: "Objetivo geral sustenta o título final.", sourceRevision: 1, toElementId: TITLE_ID },
      ],
    },
    ownerId: "16ba4d4e-bf5b-49d6-8f65-8a678103194b",
    projectId: "f5ce3156-7832-4717-8268-12dcf81fe1c0",
    revision: 7,
    schemaVersion: RESEARCH_WORKFLOW_SCHEMA_VERSION,
    sourceRevision: 3,
    stableState: "reviewing_map",
    state: "reviewing_map",
    updatedAt: "2026-08-08T10:00:00.000Z",
    ...overrides,
  });
}

test("builds a final map with traceability and completion gate", () => {
  const finalMap = buildFinalMap(makeCompleteWorkflow());
  assert.equal(canCompleteFinalMap(finalMap), true);
  assert.equal(finalMap.findings.filter((finding) => finding.severity === "blocking").length, 0);
  assert.ok(finalMap.nodes.some((node) => node.kind === "prompt"));
  assert.ok(finalMap.nodes.some((node) => node.kind === "reference"));
  assert.ok(finalMap.edges.some((edge) => edge.label === "originou proposta escolhida"));
  assert.match(finalMapSummary(finalMap), /Objetivos específicos:/);
  assert.match(finalMapSummary(finalMap), /Referências verificáveis:/);
});

test("keeps final map warnings in the persisted summary for later exports", () => {
  const workflow = makeCompleteWorkflow();
  workflow.content.coherenceFindings = [{
    elementIds: [GENERAL_ID],
    id: "80000000-0000-4000-8000-000000000001",
    message: "O objetivo geral pode explicitar melhor o recorte temporal.",
    resolution: "Ajuste o objetivo geral se quiser maior precisão.",
    rule: "IA: precisão do recorte",
    severity: "warning",
  }];
  assert.match(finalMapSummary(buildFinalMap(workflow)), /recorte temporal/);
});

test("blocks final map completion when a reference was not verified by Research Starter", () => {
  const workflow = makeCompleteWorkflow();
  workflow.content.elements = workflow.content.elements.map((item) => item.id === LITERATURE_1
    ? { ...item, referenceIds: ["referencia-inventada"] }
    : item);
  const finalMap = buildFinalMap(workflow);
  assert.equal(canCompleteFinalMap(finalMap), false);
  assert.equal(finalMap.findings.some((finding) => /referência/i.test(finding.message) && finding.severity === "blocking"), true);
});

test("blocks final map completion when methodology rows do not cover every objective", () => {
  const workflow = makeCompleteWorkflow();
  workflow.content.methodologyRows = workflow.content.methodologyRows.slice(0, 2);
  const finalMap = buildFinalMap(workflow);
  assert.equal(canCompleteFinalMap(finalMap), false);
  assert.equal(finalMap.findings.some((finding) => /matriz metodológica/i.test(finding.message) && finding.severity === "blocking"), true);
});

test("clones v2 workflow content with independent IDs and traceability", () => {
  const workflow = makeCompleteWorkflow();
  const cloned = cloneResearchWorkflowContent(workflow.content);
  assert.notEqual(cloned.discovery?.selectedCandidateId, workflow.content.discovery?.selectedCandidateId);
  assert.notEqual(cloned.elements[0].id, workflow.content.elements[0].id);
  assert.notEqual(cloned.methodologyRows[0].id, workflow.content.methodologyRows[0].id);
  assert.equal(cloned.traceLinks.length, workflow.content.traceLinks.length);
  assert.equal(cloned.coherenceFindings.length, 0);
});

test("summarizes v2 dashboard cards without exposing the raw prompt as title", () => {
  const workflow = makeCompleteWorkflow();
  const meta = workflowDashboardMeta(workflow, { area: null, title: "Nova proposta de pesquisa" });
  assert.equal(meta.progress, 88);
  assert.equal(meta.stageLabel, "Revisão final");
  assert.equal(meta.title, "Inteligência Artificial e Aprendizagem no Ensino Superior");

  const draft = researchWorkflowSchema.parse({
    ...workflow,
    content: researchWorkflowContentSchema.parse({
      ...EMPTY_WORKFLOW_CONTENT,
      discovery: {
        candidates: Array.from({ length: 6 }, (_, index) => makeCandidate(index + 1)),
        generatedAt: "2026-08-08T10:00:00.000Z",
        interpreted: {
          knowledgeArea: "Educação",
          knowledgeAreaProposed: true,
          keywords: ["inteligência artificial", "aprendizagem", "ensino superior"],
          researchQuery: "inteligência artificial aprendizagem ensino superior",
          title: "IA e aprendizagem",
        },
        originalPrompt: "Crie uma frase enorme que não deve virar exatamente o título do card do projeto.",
        references: [{
          authors: ["Autora"],
          doi: null,
          referenceId: "ref-1",
          title: "Fonte verificável",
          url: "https://example.com/ref-1",
          year: 2024,
        }],
        reportId: "rs-test",
        selectedCandidateId: null,
        warnings: [],
      },
    }),
    state: "choosing_problem",
    stableState: "choosing_problem",
  });
  assert.equal(workflowDashboardTitle(draft, "Nova proposta de pesquisa"), "IA e aprendizagem");
});

test("supports server-side rollout control for v2 creation", () => {
  const previousRollout = process.env.MAPA_V2_ROLLOUT;
  const previousEmails = process.env.MAPA_V2_ALLOWED_EMAILS;
  try {
    process.env.MAPA_V2_ROLLOUT = "disabled";
    assert.equal(isResearchMapV2EnabledForClaims({ email: "mario.reis.junior@gmail.com" }), false);
    process.env.MAPA_V2_ROLLOUT = "admin_only";
    process.env.MAPA_V2_ALLOWED_EMAILS = "mario.reis.junior@gmail.com";
    assert.equal(isResearchMapV2EnabledForClaims({ email: "mario.reis.junior@gmail.com" }), true);
    assert.equal(isResearchMapV2EnabledForClaims({ email: "outra@example.com" }), false);
  } finally {
    if (previousRollout === undefined) delete process.env.MAPA_V2_ROLLOUT;
    else process.env.MAPA_V2_ROLLOUT = previousRollout;
    if (previousEmails === undefined) delete process.env.MAPA_V2_ALLOWED_EMAILS;
    else process.env.MAPA_V2_ALLOWED_EMAILS = previousEmails;
  }
});

test("creates DOCX and PDF exports for the v2 final map preset", async () => {
  const finalMap = buildFinalMap(makeCompleteWorkflow());
  const input = {
    draft: false,
    exportedAt: new Date("2026-08-08T10:00:00-03:00"),
    finalMap,
    project: {
      academic_level: "masters",
      keywords: ["inteligência artificial", "aprendizagem", "ensino superior"],
      knowledge_area: "Educação",
      problem_statement: "Como a inteligência artificial influencia a aprendizagem no ensino superior?",
      theme: "IA no ensino superior",
      title: "Inteligência Artificial e Aprendizagem",
    },
    revision: 7,
  };
  const [docx, pdf] = await Promise.all([
    createFinalMapDocxExport(input),
    createFinalMapPdfExport(input),
  ]);
  assert.equal(docx.subarray(0, 2).toString(), "PK");
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
});
