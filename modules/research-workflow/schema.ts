import { z } from "zod";

export const RESEARCH_WORKFLOW_SCHEMA_VERSION = "2.0.0" as const;

export const workflowStateSchema = z.enum([
  "draft_prompt",
  "discovering",
  "choosing_problem",
  "validating_general_objective",
  "validating_specific_objectives",
  "validating_literature",
  "validating_development",
  "validating_methodology",
  "reviewing_map",
  "completed",
  "failed",
]);

export type WorkflowState = z.infer<typeof workflowStateSchema>;

export const stableWorkflowStateSchema = workflowStateSchema.exclude([
  "discovering",
  "failed",
]);

export type StableWorkflowState = z.infer<typeof stableWorkflowStateSchema>;

export const workflowElementTypeSchema = z.enum([
  "prompt",
  "problem_candidate",
  "problem_statement",
  "general_objective",
  "specific_objective",
  "literature_topic",
  "development_topic",
  "methodology_mapping",
  "research_title",
  "final_map",
]);

export type WorkflowElementType = z.infer<typeof workflowElementTypeSchema>;

export const validationStatusSchema = z.enum([
  "suggested",
  "edited",
  "validated",
  "stale",
]);

export type ValidationStatus = z.infer<typeof validationStatusSchema>;

export const definitionStepSchema = z.enum([
  "problem_statement",
  "general_objective",
  "specific_objectives",
  "literature_topics",
  "development_topics",
  "methodology_matrix",
]);

export type DefinitionStep = z.infer<typeof definitionStepSchema>;

export const advisorReviewStepSchema = z.enum([
  "problem_statement",
  "general_objective",
  "specific_objectives",
  "literature_topics",
  "development_topics",
  "methodology_matrix",
  "final_map",
]);

export type AdvisorReviewStep = z.infer<typeof advisorReviewStepSchema>;

export const advisorReviewSchema = z.object({
  advisorComments: z.string().trim().max(2_000).nullable().default(null),
  advisorEmail: z.string().trim().email().max(320).nullable().default(null),
  advisorId: z.string().uuid().nullable().default(null),
  id: z.string().uuid(),
  requestedAt: z.string().datetime({ offset: true }),
  reviewedAt: z.string().datetime({ offset: true }).nullable().default(null),
  sourceRevision: z.number().int().positive(),
  status: z.enum(["pending", "changes_requested", "approved"]),
  step: advisorReviewStepSchema,
  targetActiveStep: definitionStepSchema.nullable(),
  targetStableState: stableWorkflowStateSchema,
  targetState: stableWorkflowStateSchema,
});

export type AdvisorReview = z.infer<typeof advisorReviewSchema>;

export const validatedElementSchema = z.object({
  approvedContent: z.string().trim().min(1).max(12_000).nullable(),
  id: z.string().uuid(),
  proposedContent: z.string().trim().min(1).max(12_000),
  referenceIds: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  revision: z.number().int().positive(),
  sourceRevision: z.number().int().positive(),
  status: validationStatusSchema,
  studentJustification: z.string().trim().max(1_000).nullable().default(null),
  type: workflowElementTypeSchema,
  updatedBy: z.enum(["ai", "user", "system"]),
});

export type ValidatedElement = z.infer<typeof validatedElementSchema>;

export const elementVersionSchema = validatedElementSchema.extend({
  archivedAt: z.string().datetime({ offset: true }),
  elementId: z.string().uuid(),
});

export type ElementVersion = z.infer<typeof elementVersionSchema>;

export const objectiveCoverageSchema = z.object({
  degree: z.enum(["partial", "full"]),
  objectiveId: z.string().uuid(),
});

export const chapterTopicDetailSchema = z.object({
  chapter: z.enum(["literature", "development"]),
  exceptionJustification: z.string().trim().max(500).nullable(),
  generalObjectiveAligned: z.boolean(),
  objectiveCoverage: z.array(objectiveCoverageSchema).max(7),
  order: z.number().int().min(1).max(6),
  studentJustification: z.string().trim().max(1_000).nullable().default(null),
  topicId: z.string().uuid(),
});

export type ChapterTopicDetail = z.infer<typeof chapterTopicDetailSchema>;

export const knowledgeSuggestionSchema = z.object({
  id: z.string().uuid(),
  libraryVersion: z.string().trim().min(1).max(40),
  rationale: z.string().trim().min(10).max(300),
  status: z.enum(["suggested", "accepted", "rejected"]),
  term: z.string().trim().min(2).max(100),
});

export type KnowledgeSuggestion = z.infer<typeof knowledgeSuggestionSchema>;

export const methodologyClassificationSchema = z.object({
  analysisTechniques: z.array(z.string().trim().min(2).max(120)).min(1).max(6),
  approach: z.enum(["Qualitativa", "Quantitativa", "Mista"]),
  ethicsWarnings: z.array(z.string().trim().min(10).max(400)).max(6),
  instruments: z.array(z.string().trim().min(2).max(120)).min(1).max(8),
  nature: z.enum(["Básica", "Aplicada"]),
  objectives: z.array(z.enum(["Exploratória", "Descritiva", "Explicativa"])).min(1).max(3),
  procedures: z.array(z.string().trim().min(2).max(120)).min(1).max(8),
  rationale: z.string().trim().min(20).max(800),
  revision: z.number().int().positive(),
  sourceRevision: z.number().int().positive(),
  status: validationStatusSchema,
  updatedBy: z.enum(["ai", "user", "system"]),
});

export type MethodologyClassification = z.infer<typeof methodologyClassificationSchema>;

export const methodologyRowSchema = z.object({
  analysisTreatment: z.string().trim().min(20).max(1_200),
  associatedTopicIds: z.array(z.string().uuid()).max(12),
  dataCollection: z.string().trim().min(20).max(1_200),
  expectedResult: z.string().trim().min(20).max(1_000),
  id: z.string().uuid(),
  objectiveId: z.string().uuid(),
  revision: z.number().int().positive(),
  sourceRevision: z.number().int().positive(),
  status: validationStatusSchema,
  studentJustification: z.string().trim().max(1_000).nullable().default(null),
  updatedBy: z.enum(["ai", "user", "system"]),
  warnings: z.array(z.string().trim().min(1).max(500)).max(6),
});

export type MethodologyRow = z.infer<typeof methodologyRowSchema>;

export const traceLinkSchema = z.object({
  fromElementId: z.string().uuid(),
  rule: z.string().trim().min(1).max(240),
  sourceRevision: z.number().int().positive(),
  toElementId: z.string().uuid(),
});

export type TraceLink = z.infer<typeof traceLinkSchema>;

export const coherenceFindingSchema = z.object({
  elementIds: z.array(z.string().uuid()).min(1).max(12),
  id: z.string().uuid(),
  message: z.string().trim().min(1).max(500),
  resolution: z.string().trim().min(1).max(1_000).nullable(),
  rule: z.string().trim().min(1).max(120),
  severity: z.enum(["blocking", "warning", "suggestion"]),
});

export type CoherenceFinding = z.infer<typeof coherenceFindingSchema>;

export const discoveryReferenceSchema = z.object({
  abstract: z.string().trim().max(5_000).nullable().default(null),
  authors: z.array(z.string().trim().min(1).max(160)).max(8),
  doi: z.string().trim().max(240).nullable(),
  journal: z.string().trim().max(240).nullable().default(null),
  referenceId: z.string().trim().min(1).max(120),
  source: z.enum(["manual", "research_starter"]).default("research_starter"),
  title: z.string().trim().min(1).max(500).nullable(),
  url: z.string().url().max(1_000).nullable(),
  volumeIssuePages: z.string().trim().max(240).nullable().default(null),
  year: z.number().int().min(1400).max(2200).nullable(),
});

export type DiscoveryReference = z.infer<typeof discoveryReferenceSchema>;

export const interpretedDiscoverySchema = z.object({
  knowledgeArea: z.string().trim().min(2).max(100),
  knowledgeAreaProposed: z.boolean(),
  keywords: z.array(z.string().trim().min(2).max(80)).min(3).max(10),
  researchQuery: z.string().trim().min(8).max(240),
  title: z.string().trim().min(3).max(80),
});

export type InterpretedDiscovery = z.infer<typeof interpretedDiscoverySchema>;

export const problemCandidateSchema = z.object({
  context: z.string().trim().min(20).max(420),
  id: z.string().uuid(),
  kind: z.enum(["exact", "alternative"]),
  knowledgeArea: z.string().trim().min(2).max(100),
  knowledgeAreaProposed: z.boolean(),
  keywords: z.array(z.string().trim().min(2).max(80)).min(3).max(5),
  position: z.number().int().min(1).max(6),
  problemQuestion: z.string().trim().min(20).max(500).regex(/^(Como|De que forma)\b/i),
  referenceIds: z.array(z.string().trim().min(1).max(120)).max(12),
  title: z.string().trim().min(3).max(100),
});

export type ProblemCandidate = z.infer<typeof problemCandidateSchema>;

export const problemCandidatesSchema = z.array(problemCandidateSchema).length(6).superRefine((candidates, context) => {
  const positions = new Set(candidates.map((candidate) => candidate.position));
  const titles = new Set(candidates.map((candidate) => candidate.title.toLocaleLowerCase("pt-BR")));
  const questions = new Set(candidates.map((candidate) => candidate.problemQuestion.toLocaleLowerCase("pt-BR")));

  if (positions.size !== 6 || candidates.some((candidate, index) => candidate.position !== index + 1)) {
    context.addIssue({ code: "custom", message: "As seis propostas devem estar ordenadas de 1 a 6." });
  }
  if (candidates[0]?.kind !== "exact" || candidates.slice(1).some((candidate) => candidate.kind !== "alternative")) {
    context.addIssue({ code: "custom", message: "A primeira proposta deve ser exata e as demais alternativas." });
  }
  if (titles.size !== 6 || questions.size !== 6) {
    context.addIssue({ code: "custom", message: "As propostas devem ser materialmente distintas." });
  }
});

export const proposalDiscoverySchema = z.object({
  candidates: problemCandidatesSchema,
  generatedAt: z.string().datetime({ offset: true }),
  interpreted: interpretedDiscoverySchema,
  originalPrompt: z.string().trim().min(8).max(5_000),
  references: z.array(discoveryReferenceSchema).min(1).max(80),
  reportId: z.string().trim().min(1).max(160),
  selectedCandidateId: z.string().uuid().nullable(),
  warnings: z.array(z.string().trim().min(1).max(500)).max(12),
});

export type ProposalDiscovery = z.infer<typeof proposalDiscoverySchema>;

export const researchWorkflowContentSchema = z.object({
  activeStep: definitionStepSchema.nullable().default(null),
  advisorReviews: z.array(advisorReviewSchema).max(120).default([]),
  chapterTopicDetails: z.array(chapterTopicDetailSchema).max(12).default([]),
  coherenceFindings: z.array(coherenceFindingSchema).max(40).default([]),
  discovery: proposalDiscoverySchema.nullable().default(null),
  elementVersions: z.array(elementVersionSchema).max(300).default([]),
  elements: z.array(validatedElementSchema).max(120).default([]),
  knowledgeSuggestions: z.array(knowledgeSuggestionSchema).max(20).default([]),
  methodologyClassification: methodologyClassificationSchema.nullable().default(null),
  methodologyRows: z.array(methodologyRowSchema).max(7).default([]),
  referenceArchive: z.array(discoveryReferenceSchema).max(100).default([]),
  traceLinks: z.array(traceLinkSchema).max(240).default([]),
});

export type ResearchWorkflowContent = z.infer<typeof researchWorkflowContentSchema>;

export const researchWorkflowSchema = z.object({
  content: researchWorkflowContentSchema,
  ownerId: z.string().uuid(),
  projectId: z.string().uuid(),
  revision: z.number().int().positive(),
  schemaVersion: z.literal(RESEARCH_WORKFLOW_SCHEMA_VERSION),
  sourceRevision: z.number().int().positive(),
  stableState: stableWorkflowStateSchema,
  state: workflowStateSchema,
  updatedAt: z.string().datetime({ offset: true }),
});

export type ResearchWorkflow = z.infer<typeof researchWorkflowSchema>;

export const EMPTY_WORKFLOW_CONTENT: ResearchWorkflowContent = {
  activeStep: null,
  advisorReviews: [],
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
};
