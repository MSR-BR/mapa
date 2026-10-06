import { researchWorkflowSchema, type ValidatedElement, type WorkflowElementType } from "../../modules/research-workflow/schema";
export const fixtureId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export function versionedWorkflowFixture() {
  const types: WorkflowElementType[] = ["problem_statement", "general_objective", "specific_objective", "specific_objective", "specific_objective", "literature_topic", "literature_topic", "literature_topic", "development_topic", "development_topic", "development_topic", "research_title", "methodology_mapping", "methodology_mapping", "methodology_mapping", "final_map"];
  const elements: ValidatedElement[] = types.map((type, index) => ({
    id: fixtureId(index + 10), type, proposedContent: `Conteúdo sintético de teste: ${type} ${index}.`, approvedContent: `Conteúdo sintético de teste: ${type} ${index}.`,
    referenceIds: ["fixture-reference"], revision: 1, sourceRevision: 1, status: "validated", studentJustification: `Nota sintética validada ${index}.`, updatedBy: "user",
  }));
  const candidates = Array.from({ length: 6 }, (_, i) => ({ id: fixtureId(i + 50), context: `Contexto inteiramente sintético para o teste ${i}.`, kind: i === 0 ? "exact" : "alternative", knowledgeArea: "Educação", knowledgeAreaProposed: false, keywords: ["ensino", "aprendizagem", "método"], position: i + 1, problemQuestion: `Como estudar o cenário sintético de pesquisa número ${i}?`, referenceIds: ["fixture-reference"], title: `Proposta sintética ${i}` }));
  return researchWorkflowSchema.parse({
    ownerId: fixtureId(1), projectId: fixtureId(2), revision: 10, sourceRevision: 5, schemaVersion: "2.0.0", state: "completed", stableState: "completed", updatedAt: "2026-10-06T12:00:00Z",
    content: {
      historyVersion: 1, elements, activeStep: null,
      discovery: { candidates, generatedAt: "2026-10-06T12:00:00Z", interpreted: { knowledgeArea: "Educação", knowledgeAreaProposed: false, keywords: ["ensino", "aprendizagem", "método"], researchQuery: "ensino e aprendizagem sintéticos", title: "Projeto sintético C111" }, originalPrompt: "Fixture sintética de pesquisa para testes.", references: [{ referenceId: "fixture-reference", source: "manual", authors: ["Autor sintético"], doi: null, title: "Referência sintética usada exclusivamente em testes", url: "https://example.invalid/reference", year: 2026 }], reportId: "fixture-only", selectedCandidateId: candidates[0].id, warnings: [] },
      chapterTopicDetails: elements.filter((item) => item.type.endsWith("_topic")).map((item, index) => ({ topicId: item.id, chapter: item.type === "literature_topic" ? "literature" : "development", order: index % 3 + 1, exceptionJustification: null, generalObjectiveAligned: false, objectiveCoverage: [{ objectiveId: fixtureId(12 + index % 3), degree: "partial" }], studentJustification: "Nota sintética do capítulo." })),
      methodologyClassification: { approach: "Qualitativa", nature: "Aplicada", objectives: ["Exploratória"], procedures: ["Estudo de caso"], instruments: ["Entrevista"], analysisTechniques: ["Análise temática"], ethicsWarnings: ["Obter consentimento dos participantes."], rationale: "Classificação sintética da pesquisa para teste de recuperação.", revision: 1, sourceRevision: 1, status: "validated", updatedBy: "user" },
      methodologyRows: [0, 1, 2].map((index) => ({ id: fixtureId(22 + index), objectiveId: fixtureId(12 + index), associatedTopicIds: [fixtureId(15 + index), fixtureId(18 + index)], dataCollection: "Serão recolhidos dados sintéticos para este teste.", analysisTreatment: "Os dados serão analisados apenas como fixture sintética.", expectedResult: "Estrutura sintética de análise para teste.", revision: 1, sourceRevision: 1, status: "validated", updatedBy: "user", studentJustification: "Nota metodológica confirmada.", warnings: [] })),
      traceLinks: elements.slice(1).map((item, index) => ({ fromElementId: elements[index].id, toElementId: item.id, sourceRevision: 1, rule: "Relação sintética preservada." })),
    },
  });
}
