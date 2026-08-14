import {
  researchWorkflowContentSchema,
  type AdvisorReview,
  type AdvisorReviewStep,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type StableWorkflowState,
  type DefinitionStep,
} from "./schema";

export const ADVISOR_REVIEW_LABELS: Record<AdvisorReviewStep, string> = {
  development_topics: "Capítulo 4",
  final_map: "Mapa final",
  general_objective: "Objetivo geral",
  literature_topics: "Capítulo 2",
  methodology_matrix: "Metodologia",
  problem_statement: "Problemática",
  specific_objectives: "Objetivos específicos",
};

export type AdvisorTransition = {
  targetActiveStep: DefinitionStep | null;
  targetStableState: StableWorkflowState;
  targetState: StableWorkflowState;
};

export function currentAdvisorReview(content: ResearchWorkflowContent) {
  return [...content.advisorReviews].reverse().find((review) => review.status === "pending" || review.status === "changes_requested") ?? null;
}

export function pendingAdvisorReview(content: ResearchWorkflowContent) {
  const review = currentAdvisorReview(content);
  return review?.status === "pending" ? review : null;
}

export function requiresAdvisorReview(project: { advisor_email?: string | null }) {
  return Boolean(project.advisor_email?.trim());
}

export function advisorReviewEmail(project: { advisor_email?: string | null }) {
  return project.advisor_email?.trim().toLocaleLowerCase("pt-BR") || null;
}

export function withAdvisorReviewRequest(
  content: ResearchWorkflowContent,
  input: {
    advisorEmail: string | null;
    sourceRevision: number;
    step: AdvisorReviewStep;
    transition: AdvisorTransition;
  },
) {
  const now = new Date().toISOString();
  const previous = content.advisorReviews.map((review) => review.status === "pending" || review.status === "changes_requested"
    ? { ...review, reviewedAt: review.reviewedAt ?? now, status: "changes_requested" as const }
    : review);
  const review: AdvisorReview = {
    advisorComments: null,
    advisorEmail: input.advisorEmail,
    advisorId: null,
    id: crypto.randomUUID(),
    requestedAt: now,
    reviewedAt: null,
    sourceRevision: input.sourceRevision,
    status: "pending",
    step: input.step,
    targetActiveStep: input.transition.targetActiveStep,
    targetStableState: input.transition.targetStableState,
    targetState: input.transition.targetState,
  };
  return researchWorkflowContentSchema.parse({
    ...content,
    advisorReviews: [...previous, review],
  });
}

export function withAdvisorReviewDecision(
  content: ResearchWorkflowContent,
  input: {
    advisorComments: string | null;
    advisorId: string;
    reviewId: string;
    status: "approved" | "changes_requested";
  },
) {
  const now = new Date().toISOString();
  return researchWorkflowContentSchema.parse({
    ...content,
    advisorReviews: content.advisorReviews.map((review) => review.id === input.reviewId
      ? {
          ...review,
          advisorComments: input.advisorComments,
          advisorId: input.advisorId,
          reviewedAt: now,
          status: input.status,
        }
      : review),
  });
}

export function withAdvisorReviewComment(
  content: ResearchWorkflowContent,
  input: {
    advisorComments: string | null;
    advisorId: string;
    reviewId: string;
  },
) {
  return researchWorkflowContentSchema.parse({
    ...content,
    advisorReviews: content.advisorReviews.map((review) => review.id === input.reviewId
      ? {
          ...review,
          advisorComments: input.advisorComments,
          advisorId: input.advisorId,
        }
      : review),
  });
}

export function workflowAdvisorStatus(workflow: ResearchWorkflow) {
  const review = currentAdvisorReview(workflow.content);
  if (!review) return null;
  return {
    comments: review.advisorComments,
    label: ADVISOR_REVIEW_LABELS[review.step],
    status: review.status,
  };
}
