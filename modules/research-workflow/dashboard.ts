import type {
  ResearchWorkflow,
  ResearchWorkflowContent,
  ValidatedElement,
  WorkflowState,
} from "./schema";
import { currentAdvisorReview } from "./advisor-review";
import { workflowNavigationPosition } from "./workflow-navigation";

export type WorkflowDashboardMeta = {
  area: string;
  progress: number;
  stageLabel: string;
  title: string;
};

type DashboardTitleFallback = {
  area?: string | null;
  problemStatement?: string | null;
  theme?: string | null;
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

function compactDashboardTitle(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= 96) return compact;
  return `${compact.slice(0, 93).replace(/[ ,;:.!?-]+$/, "")}...`;
}

export function workflowDashboardTitle(workflow: ResearchWorkflow, fallback: DashboardTitleFallback | string) {
  const normalizedFallback: DashboardTitleFallback = typeof fallback === "string" ? { title: fallback } : fallback;
  const content = workflow.content;
  const title = approved(findElement(content, "research_title"));
  if (title) return title;

  const selected = content.discovery?.candidates.find((candidate) => candidate.id === content.discovery?.selectedCandidateId);
  if (selected?.title) return selected.title;

  const interpretedTitle = content.discovery?.interpreted.title.trim();
  if (interpretedTitle) return interpretedTitle;

  if (normalizedFallback.title && !/^(nova proposta de pesquisa|mapa em construção)$/i.test(normalizedFallback.title.trim())) {
    return compactDashboardTitle(normalizedFallback.title);
  }

  const projectContext = [normalizedFallback.theme, normalizedFallback.problemStatement, content.discovery?.originalPrompt]
    .find((value) => typeof value === "string" && value.trim().length >= 8);
  if (projectContext) return compactDashboardTitle(projectContext);

  return "Projeto de pesquisa sem título";
}

export function workflowDashboardArea(workflow: ResearchWorkflow, fallbackArea: string | null | undefined) {
  const content = workflow.content;
  const selected = content.discovery?.candidates.find((candidate) => candidate.id === content.discovery?.selectedCandidateId);
  const area = selected?.knowledgeArea || content.discovery?.interpreted.knowledgeArea || fallbackArea || "Área a definir";
  const proposed = selected?.knowledgeAreaProposed ?? content.discovery?.interpreted.knowledgeAreaProposed ?? false;
  return proposed ? `${area} (proposta pela IA)` : area;
}

export function workflowDashboardMeta(workflow: ResearchWorkflow, fallback: DashboardTitleFallback): WorkflowDashboardMeta {
  return {
    area: workflowDashboardArea(workflow, fallback.area),
    progress: workflowProgress(workflow),
    stageLabel: workflowStageLabel(workflow),
    title: workflowDashboardTitle(workflow, fallback),
  };
}

const CONTINUATION_STEPS = {
  problem_statement: "Problemática",
  general_objective: "Objetivo geral",
  specific_objectives: "Objetivos específicos",
  literature_topics: "Capítulo 2",
  development_topics: "Capítulo 4",
  methodology_matrix: "Metodologia",
  final_map: "Mapa final",
} as const;

/** Only persisted, actionable student workflows can receive the continuation prompt. */
export function studentContinuationMeta(
  project: {
    authoring_role: string;
    owner_id: string;
    status: string;
    workflow_version: number;
    advisor_email: string | null;
  },
  workflow: ResearchWorkflow | undefined,
  actor: { activeRole: string; userId: string },
) {
  if (actor.activeRole !== "student" || project.owner_id !== actor.userId || project.authoring_role !== "student"
    || project.workflow_version !== 2 || !["draft", "ready", "generated"].includes(project.status)
    || !project.advisor_email?.trim() || !workflow || workflow.ownerId !== actor.userId
    || ["completed", "failed", "discovering"].includes(workflow.state)
    || currentAdvisorReview(workflow.content)) return null;

  const position = workflowNavigationPosition(workflow);
  const stageLabel = position ? CONTINUATION_STEPS[position] : workflow.state === "draft_prompt"
    ? "Descoberta de propostas" : workflow.state === "choosing_problem"
      ? "Escolha da proposta" : null;
  return stageLabel ? { stageLabel, progress: workflowProgress(workflow) } : null;
}
