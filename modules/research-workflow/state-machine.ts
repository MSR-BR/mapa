import type {
  StableWorkflowState,
  ValidationStatus,
  WorkflowElementType,
  WorkflowState,
} from "./schema";

const allowedTransitions: Readonly<Record<WorkflowState, readonly WorkflowState[]>> = {
  draft_prompt: ["discovering"],
  discovering: ["choosing_problem", "failed"],
  choosing_problem: ["discovering", "validating_general_objective"],
  validating_general_objective: ["choosing_problem", "validating_specific_objectives"],
  validating_specific_objectives: ["validating_general_objective", "validating_literature"],
  validating_literature: ["validating_specific_objectives", "validating_development"],
  validating_development: ["validating_literature", "validating_methodology"],
  validating_methodology: ["validating_development", "reviewing_map"],
  reviewing_map: ["validating_methodology", "completed"],
  completed: ["reviewing_map"],
  failed: [
    "draft_prompt",
    "choosing_problem",
    "validating_general_objective",
    "validating_specific_objectives",
    "validating_literature",
    "validating_development",
    "validating_methodology",
    "reviewing_map",
    "completed",
  ],
};

const dependencies: Readonly<Partial<Record<WorkflowElementType, readonly WorkflowElementType[]>>> = {
  prompt: ["problem_candidate"],
  problem_candidate: ["problem_statement"],
  problem_statement: ["general_objective"],
  general_objective: ["specific_objective", "research_title"],
  specific_objective: ["literature_topic", "development_topic", "methodology_mapping"],
  literature_topic: ["final_map"],
  development_topic: ["final_map"],
  methodology_mapping: ["final_map"],
  research_title: ["final_map"],
};

export function canTransitionWorkflow(from: WorkflowState, to: WorkflowState) {
  return allowedTransitions[from].includes(to);
}

export function assertWorkflowTransition(from: WorkflowState, to: WorkflowState) {
  if (!canTransitionWorkflow(from, to)) {
    throw new Error(`Transição inválida do workflow: ${from} -> ${to}.`);
  }
}

export function recoverWorkflowState(
  state: WorkflowState,
  stableState: StableWorkflowState,
): WorkflowState {
  return state === "failed" ? stableState : state;
}

export function collectDependentElementTypes(source: WorkflowElementType) {
  const visited = new Set<WorkflowElementType>();
  const queue = [...(dependencies[source] ?? [])];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    queue.push(...(dependencies[current] ?? []));
  }

  return [...visited];
}

export function nextValidationStatus(
  current: ValidationStatus,
  actor: "ai" | "user" | "system",
): ValidationStatus {
  if (actor === "system") return "stale";
  if (actor === "user") return "edited";
  return current === "validated" ? "stale" : "suggested";
}
