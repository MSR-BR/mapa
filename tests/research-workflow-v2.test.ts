import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_WORKFLOW_CONTENT,
  RESEARCH_WORKFLOW_SCHEMA_VERSION,
  problemCandidatesSchema,
  researchWorkflowContentSchema,
  researchWorkflowSchema,
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
