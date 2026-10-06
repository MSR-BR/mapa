import { collectDependentElementTypes } from "./state-machine";
import {
  researchWorkflowContentSchema,
  type AdvisorReviewStep,
  type ResearchWorkflowContent,
  type WorkflowElementType,
  type WorkflowUnit,
} from "./schema";

export const UNIT_TYPES: Record<AdvisorReviewStep, readonly WorkflowElementType[]> = {
  problem_statement: ["problem_statement"],
  general_objective: ["general_objective"],
  // Promotion of a specific objective is one recoverable editing operation.
  specific_objectives: ["general_objective", "specific_objective"],
  literature_topics: ["literature_topic"],
  development_topics: ["development_topic"],
  methodology_matrix: ["research_title", "methodology_mapping"],
  final_map: ["final_map"],
};

export function workflowUnit(content: ResearchWorkflowContent, step: AdvisorReviewStep): WorkflowUnit {
  const elements = content.elements.filter((item) => UNIT_TYPES[step].includes(item.type));
  const ids = new Set([...elements.map((item) => item.id), ...(step === "methodology_matrix" ? content.methodologyRows.map((row) => row.id) : [])]);
  return {
    elements,
    chapterTopicDetails: content.chapterTopicDetails.filter((item) => ids.has(item.topicId)),
    methodologyClassification: step === "methodology_matrix" ? content.methodologyClassification : null,
    methodologyRows: step === "methodology_matrix" ? content.methodologyRows : [],
    traceLinks: content.traceLinks.filter((item) => ids.has(item.toElementId) || ids.has(item.fromElementId)),
  };
}

export function applyWorkflowUnit(content: ResearchWorkflowContent, step: AdvisorReviewStep, unit: WorkflowUnit) {
  const oldIds = new Set([...workflowUnit(content, step).elements.map((item) => item.id), ...(step === "methodology_matrix" ? content.methodologyRows.map((row) => row.id) : [])]);
  const retained = content.elements.filter((item) => !UNIT_TYPES[step].includes(item.type));
  const validIds = new Set([...retained.map((item) => item.id), ...unit.elements.map((item) => item.id), ...(step === "methodology_matrix" ? unit.methodologyRows : content.methodologyRows).map((row) => row.id)]);
  const links = [...content.traceLinks.filter((item) => !oldIds.has(item.fromElementId) && !oldIds.has(item.toElementId)), ...unit.traceLinks];
  return researchWorkflowContentSchema.parse({
    ...content,
    elements: [...retained, ...unit.elements],
    chapterTopicDetails: [...content.chapterTopicDetails.filter((item) => !oldIds.has(item.topicId)), ...unit.chapterTopicDetails],
    methodologyClassification: step === "methodology_matrix" ? unit.methodologyClassification : content.methodologyClassification,
    methodologyRows: step === "methodology_matrix" ? unit.methodologyRows : content.methodologyRows,
    traceLinks: links.filter((item, index) => validIds.has(item.fromElementId) && validIds.has(item.toElementId)
      && links.findIndex((other) => other.fromElementId === item.fromElementId && other.toElementId === item.toElementId) === index),
  });
}

// Version counters/timestamps are bookkeeping, not academic edits.
export function unitFingerprint(unit: WorkflowUnit) {
  return JSON.stringify(unit, (key, value) => ["revision", "sourceRevision", "updatedBy"].includes(key) ? undefined : value);
}

export function academicFingerprint(unit: WorkflowUnit) {
  return JSON.stringify(unit, (key, value) => ["revision", "sourceRevision", "updatedBy", "status", "approvedContent"].includes(key) ? undefined : value);
}

export function markAffectedUnits(content: ResearchWorkflowContent, previous: ResearchWorkflowContent, step: AdvisorReviewStep) {
  const before = workflowUnit(previous, step);
  const after = workflowUnit(content, step);
  if (academicFingerprint(before) === academicFingerprint(after)) return content;
  const affected = new Set(UNIT_TYPES[step].flatMap((type) => collectDependentElementTypes(type)));
  for (const type of UNIT_TYPES[step]) affected.delete(type);
  // Chapter changes also affect the methods that refer to their topics.
  if (step === "literature_topics" || step === "development_topics") affected.add("methodology_mapping");
  return researchWorkflowContentSchema.parse({
    ...content,
    elements: content.elements.map((item) => affected.has(item.type)
      ? { ...item, status: "stale", revision: item.revision + 1, updatedBy: "system" }
      : item),
    methodologyClassification: affected.has("methodology_mapping") && content.methodologyClassification
      ? { ...content.methodologyClassification, status: "stale" } : content.methodologyClassification,
    methodologyRows: affected.has("methodology_mapping")
      ? content.methodologyRows.map((row) => ({ ...row, status: "stale" })) : content.methodologyRows,
  });
}

export function contextRevisionLabel(revision: number) {
  return `Contexto do projeto — revisão ${revision}`;
}
