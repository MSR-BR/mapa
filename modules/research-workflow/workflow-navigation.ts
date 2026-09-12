import type {
  DefinitionStep,
  ResearchWorkflow,
  StableWorkflowState,
  WorkflowState,
} from "./schema";

export const WORKFLOW_NAVIGATION_TARGETS = [
  "problem_statement",
  "general_objective",
  "specific_objectives",
  "literature_topics",
  "development_topics",
  "methodology_matrix",
] as const;

export type WorkflowNavigationTarget = typeof WORKFLOW_NAVIGATION_TARGETS[number];
export type WorkflowNavigationPosition = WorkflowNavigationTarget | "final_map";

const POSITION_ORDER: Record<WorkflowNavigationPosition, number> = {
  problem_statement: 1,
  general_objective: 2,
  specific_objectives: 3,
  literature_topics: 4,
  development_topics: 5,
  methodology_matrix: 6,
  final_map: 7,
};

const TARGET_STATE: Record<WorkflowNavigationTarget, {
  activeStep: DefinitionStep;
  stableState: StableWorkflowState;
  state: WorkflowState;
}> = {
  problem_statement: { activeStep: "problem_statement", stableState: "choosing_problem", state: "choosing_problem" },
  general_objective: { activeStep: "general_objective", stableState: "validating_general_objective", state: "validating_general_objective" },
  specific_objectives: { activeStep: "specific_objectives", stableState: "validating_specific_objectives", state: "validating_specific_objectives" },
  literature_topics: { activeStep: "literature_topics", stableState: "validating_literature", state: "validating_literature" },
  development_topics: { activeStep: "development_topics", stableState: "validating_development", state: "validating_development" },
  methodology_matrix: { activeStep: "methodology_matrix", stableState: "validating_methodology", state: "validating_methodology" },
};

export function workflowNavigationPosition(
  workflow: Pick<ResearchWorkflow, "content" | "state">,
): WorkflowNavigationPosition | null {
  if (workflow.content.activeStep) return workflow.content.activeStep;
  if (workflow.state === "reviewing_map" || workflow.state === "completed") return "final_map";
  if (workflow.state === "validating_methodology") return "methodology_matrix";
  if (workflow.state === "validating_development") return "development_topics";
  if (workflow.state === "validating_literature") return "literature_topics";
  if (workflow.state === "validating_specific_objectives") return "specific_objectives";
  if (workflow.state === "validating_general_objective") return "general_objective";
  if (workflow.state === "choosing_problem" && workflow.content.discovery?.selectedCandidateId) return "problem_statement";
  return null;
}

export function canNavigateToWorkflowTarget(
  workflow: Pick<ResearchWorkflow, "content" | "state">,
  target: WorkflowNavigationTarget,
) {
  const current = workflowNavigationPosition(workflow);
  return current ? POSITION_ORDER[target] < POSITION_ORDER[current] : false;
}

export function workflowNavigationState(target: WorkflowNavigationTarget) {
  return TARGET_STATE[target];
}

export function workflowNavigationUrl(
  projectId: string,
  workflow: Pick<ResearchWorkflow, "content" | "revision" | "state">,
) {
  const position = workflowNavigationPosition(workflow) ?? workflow.state;
  const query = new URLSearchParams({
    workflowRevision: String(workflow.revision),
    workflowStep: position,
  });
  return `/dashboard/projects/${encodeURIComponent(projectId)}?${query.toString()}`;
}
