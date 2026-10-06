import { mergeReferenceArchive } from "./workflow-references";
import { pendingAdvisorReview } from "./advisor-review";
import { researchWorkflowContentSchema, type AdvisorReviewStep, type ResearchWorkflow, type ResearchWorkflowContent } from "./schema";
import { academicFingerprint, markAffectedUnits, workflowUnit } from "./versioned-context";
import { workflowStateRank } from "./workflow-navigation";

function withoutStep<T>(items: Partial<Record<AdvisorReviewStep, T>>, step: AdvisorReviewStep) {
  const copy = { ...items }; delete copy[step]; return copy;
}

export type WorkflowEdit = {
  base: ResearchWorkflow;
  content: ResearchWorkflowContent;
  step: AdvisorReviewStep;
  action: string;
  sourceRevision: number;
  state: ResearchWorkflow["state"];
  stableState: ResearchWorkflow["stableState"];
};

export function prepareWorkflowEdit(edit: WorkflowEdit) {
  const { base, step, action } = edit;
  const draftBase = base.content.stepDrafts[step]?.baseRevision;
  if (action === "validate" && draftBase !== undefined && draftBase !== base.sourceRevision) {
    throw new Error("O contexto mudou depois deste rascunho. Revise as etapas alteradas e confirme a revisão do contexto antes de validar.");
  }
  const unit = workflowUnit(edit.content, step);
  const now = new Date().toISOString();
  let content = edit.content;
  let state = base.state;
  let stableState = base.stableState;
  let sourceRevision = base.sourceRevision;
  const proposal = ["regenerate", "optimize"].includes(action);
  const draft = ["save", "initialize", "restore", "accept_proposal"].includes(action);
  if (draft || proposal) {
    const key = proposal ? "stepProposals" : "stepDrafts";
    const previous = base.content[key][step]?.unit ?? workflowUnit(base.content, step);
    if (action !== "accept_proposal" && action !== "restore" && academicFingerprint(previous) === academicFingerprint(unit)) return { content: base.content, sourceRevision, stableState, state, unchanged: true };
    content = researchWorkflowContentSchema.parse({
      ...base.content,
      [key]: { ...base.content[key], [step]: { baseRevision: base.sourceRevision, savedAt: now, unit } },
      ...(action === "accept_proposal" ? { stepProposals: withoutStep(base.content.stepProposals, step) } : {}),
      // Keep newly fetched, validated references available without copying them into every version.
      referenceArchive: mergeReferenceArchive(edit.content.referenceArchive, [...(base.content.discovery?.references ?? []), ...(edit.content.discovery?.references ?? [])]),
    });
  } else if (action === "validate" || action === "complete") {
    if (pendingAdvisorReview(base.content)) throw new Error("A versão enviada está aguardando o orientador. Consulte as etapas e aguarde a revisão antes de confirmar alterações.");
    content = markAffectedUnits(edit.content, base.content, step);
    content = researchWorkflowContentSchema.parse({
      ...content,
      stepDrafts: withoutStep(base.content.stepDrafts, step),
      stepProposals: withoutStep(base.content.stepProposals, step),
    });
    sourceRevision = edit.sourceRevision;
    const newReview = pendingAdvisorReview(content);
    const revisiting = workflowStateRank(newReview?.targetStableState ?? edit.stableState) <= workflowStateRank(base.stableState);
    if (newReview) {
      // Revalidation of an earlier step cannot rewind or grant progress.
      content = researchWorkflowContentSchema.parse({
        ...content, activeStep: base.content.activeStep,
        advisorReviews: content.advisorReviews.map((review) => review.id === newReview.id && revisiting
          ? { ...review, targetActiveStep: base.content.activeStep, targetState: base.stableState, targetStableState: base.stableState } : review),
      });
    } else if (revisiting) {
      content = { ...content, activeStep: base.content.activeStep };
      // A confirmed academic edit reopens a completed map, retaining its historical approval.
      if (state === "completed" && step !== "final_map") state = stableState = "reviewing_map";
    } else {
      state = edit.state;
      stableState = edit.stableState;
    }
  } else {
    content = { ...content, activeStep: base.content.activeStep };
  }
  return { content: { ...content, elementVersions: [], historyVersion: 1 as const }, sourceRevision, stableState, state, unchanged: false };
}
