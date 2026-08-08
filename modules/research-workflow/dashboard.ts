import type {
  ResearchWorkflow,
  ResearchWorkflowContent,
  ValidatedElement,
  WorkflowState,
} from "./schema";

export type WorkflowDashboardMeta = {
  area: string;
  progress: number;
  stageLabel: string;
  title: string;
};

const STAGE_LABELS: Record<WorkflowState, string> = {
  choosing_problem: "Escolha da proposta",
  completed: "Mapa final concluído",
  discovering: "Buscando propostas",
  draft_prompt: "Pronto para descoberta",
  failed: "Revisar tentativa",
  reviewing_map: "Revisão final",
  validating_development: "Capítulo 4",
  validating_general_objective: "Objetivo geral",
  validating_literature: "Capítulo 2",
  validating_methodology: "Metodologia",
  validating_specific_objectives: "Objetivos específicos",
};

function approved(element: ValidatedElement | undefined) {
  return element?.approvedContent?.trim() || element?.proposedContent.trim() || "";
}

function findElement(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.find((element) => element.type === type && element.status === "validated");
}

function countCompletedChecks(workflow: ResearchWorkflow) {
  const content = workflow.content;
  const specificObjectives = content.elements.filter((element) => element.type === "specific_objective" && element.status === "validated");
  const literatureTopics = content.elements.filter((element) => element.type === "literature_topic" && element.status === "validated");
  const developmentTopics = content.elements.filter((element) => element.type === "development_topic" && element.status === "validated");
  const checks = [
    Boolean(content.discovery?.selectedCandidateId),
    Boolean(findElement(content, "problem_statement")),
    Boolean(findElement(content, "general_objective")),
    specificObjectives.length >= 3,
    literatureTopics.length >= 3,
    developmentTopics.length >= 3,
    Boolean(content.methodologyClassification) && content.methodologyRows.length >= 3,
    workflow.state === "completed" && Boolean(findElement(content, "final_map")),
  ];
  return checks.filter(Boolean).length;
}

export function workflowProgress(workflow: ResearchWorkflow) {
  return Math.round((countCompletedChecks(workflow) / 8) * 100);
}

export function workflowStageLabel(workflow: ResearchWorkflow) {
  return STAGE_LABELS[workflow.state] ?? "Em construção";
}

export function workflowDashboardTitle(workflow: ResearchWorkflow, fallbackTitle: string) {
  const content = workflow.content;
  const title = approved(findElement(content, "research_title"));
  if (title) return title;

  const selected = content.discovery?.candidates.find((candidate) => candidate.id === content.discovery?.selectedCandidateId);
  if (selected?.title) return selected.title;

  const interpretedTitle = content.discovery?.interpreted.title.trim();
  if (interpretedTitle) return interpretedTitle;

  if (fallbackTitle && !/^nova proposta de pesquisa$/i.test(fallbackTitle.trim())) return fallbackTitle;
  return "Mapa em construção";
}

export function workflowDashboardArea(workflow: ResearchWorkflow, fallbackArea: string | null | undefined) {
  const content = workflow.content;
  const selected = content.discovery?.candidates.find((candidate) => candidate.id === content.discovery?.selectedCandidateId);
  const area = selected?.knowledgeArea || content.discovery?.interpreted.knowledgeArea || fallbackArea || "Área a definir";
  const proposed = selected?.knowledgeAreaProposed ?? content.discovery?.interpreted.knowledgeAreaProposed ?? false;
  return proposed ? `${area} (proposta pela IA)` : area;
}

export function workflowDashboardMeta(workflow: ResearchWorkflow, fallback: { area?: string | null; title: string }): WorkflowDashboardMeta {
  return {
    area: workflowDashboardArea(workflow, fallback.area),
    progress: workflowProgress(workflow),
    stageLabel: workflowStageLabel(workflow),
    title: workflowDashboardTitle(workflow, fallback.title),
  };
}
