import assert from "node:assert/strict";
import { test } from "node:test";
import { versionedWorkflowFixture } from "./fixtures/versioned-workflow";
import { WORKFLOW_NAVIGATION_TARGETS, canNavigateToWorkflowTarget, workflowForView } from "../modules/research-workflow/workflow-navigation";
import { applyWorkflowUnit, workflowUnit } from "../modules/research-workflow/versioned-context";
import { prepareWorkflowEdit, type WorkflowEdit } from "../modules/research-workflow/workflow-edit";
import { researchWorkflowSchema, type ResearchWorkflowContent } from "../modules/research-workflow/schema";
import { studentContextNotes } from "../modules/research-workflow/workflow-references";
import { cloneResearchWorkflowContent } from "../modules/research-workflow/clone";

function edit(action: string, overrides: Partial<WorkflowEdit> = {}): WorkflowEdit {
  const base = versionedWorkflowFixture();
  const content = structuredClone(base.content);
  content.elements[1].proposedContent = "Analisar a nova população em outro recorte de pesquisa.";
  content.elements[1].studentJustification = "Nova nota ainda não confirmada.";
  content.elements[1].status = "edited";
  return { action, base, content, step: "general_objective", sourceRevision: base.sourceRevision + 1, state: "validating_specific_objectives", stableState: "validating_specific_objectives", ...overrides };
}

test("C111: all 49 navigation pairs preserve the canonical state, history, IDs and approvals", () => {
  const base = versionedWorkflowFixture(); const before = JSON.stringify(base);
  for (const from of WORKFLOW_NAVIGATION_TARGETS) for (const to of WORKFLOW_NAVIGATION_TARGETS) {
    const view = workflowForView(base, from);
    assert.ok(canNavigateToWorkflowTarget(view, to));
    const next = workflowForView(view, to);
    assert.equal(next.revision, base.revision);
    assert.deepEqual(next.content.elements, base.content.elements);
    assert.deepEqual(next.content.traceLinks, base.content.traceLinks);
  }
  assert.equal(JSON.stringify(base), before);
});

test("C111: a saved draft survives parsing while the canonical context and later work stay intact", () => {
  const input = edit("save"); const next = prepareWorkflowEdit(input);
  assert.deepEqual(next.content.elements, input.base.content.elements);
  assert.deepEqual(next.content.methodologyRows, input.base.content.methodologyRows);
  assert.equal(next.sourceRevision, input.base.sourceRevision);
  const reloaded = researchWorkflowSchema.parse({ ...input.base, ...next });
  assert.equal(workflowForView(reloaded, "general_objective").content.elements.find((item) => item.type === "general_objective")?.proposedContent, input.content.elements[1].proposedContent);
  assert.ok(!studentContextNotes(next.content).join(" ").includes("Nova nota"));
});

test("C111: unchanged saves do not create academic revisions", () => {
  const input = edit("save"); input.content = structuredClone(input.base.content);
  input.content.elements[1].revision += 1; input.content.elements[1].updatedBy = "user";
  assert.equal(prepareWorkflowEdit(input).unchanged, true);
});

test("C111: confirming an earlier edit preserves downstream text and historical approvals, flagging review", () => {
  const input = edit("validate"); input.content.elements[1].approvedContent = input.content.elements[1].proposedContent; input.content.elements[1].status = "validated";
  const next = prepareWorkflowEdit(input);
  assert.equal(next.state, "reviewing_map");
  for (const element of next.content.elements.filter((item) => item.type === "specific_objective")) {
    assert.equal(element.status, "stale");
    assert.equal(element.approvedContent, input.base.content.elements.find((old) => old.id === element.id)?.approvedContent);
  }
  assert.deepEqual(next.content.methodologyRows.map((row) => row.dataCollection), input.base.content.methodologyRows.map((row) => row.dataCollection));
  assert.ok(!studentContextNotes(next.content).some((note) => note.includes("Nota metodológica")));
});

test("C111: regenerated content is an independent proposal and cannot replace a saved draft", () => {
  const input = edit("regenerate"); const existingDraft = workflowUnit(input.base.content, "general_objective");
  input.base.content.stepDrafts.general_objective = { baseRevision: 5, savedAt: input.base.updatedAt, unit: existingDraft };
  const next = prepareWorkflowEdit(input);
  assert.deepEqual(next.content.elements, input.base.content.elements);
  assert.deepEqual(next.content.stepDrafts, input.base.content.stepDrafts);
  assert.equal(next.content.stepProposals.general_objective?.unit.elements[0].proposedContent, input.content.elements[1].proposedContent);
});

test("C111: unit restoration includes methodological data, notes, links and references", () => {
  const base = versionedWorkflowFixture(); const unit = workflowUnit(base.content, "methodology_matrix");
  const emptied: ResearchWorkflowContent = { ...base.content, methodologyRows: [], methodologyClassification: null, elements: base.content.elements.filter((item) => !["methodology_mapping", "research_title"].includes(item.type)) };
  const restored = applyWorkflowUnit(emptied, "methodology_matrix", unit);
  assert.deepEqual(workflowUnit(restored, "methodology_matrix"), unit);
  const next = prepareWorkflowEdit({ ...edit("restore"), base, content: restored, step: "methodology_matrix" });
  assert.deepEqual(next.content.elements, base.content.elements);
});

test("C111: legacy arrays beyond 300 versions parse without truncation", () => {
  const base = versionedWorkflowFixture();
  base.content.elementVersions = Array.from({ length: 1000 }, () => ({ ...base.content.elements[0], archivedAt: base.updatedAt, elementId: base.content.elements[0].id }));
  assert.equal(researchWorkflowSchema.parse(base).content.elementVersions.length, 1000);
});

test("C111: pending advisor submission rejects a new confirmation", () => {
  const input = edit("validate"); input.base.content.advisorReviews = [{ id: crypto.randomUUID(), step: "general_objective", status: "pending", requestedAt: input.base.updatedAt, reviewedAt: null, advisorId: null, advisorEmail: "advisor@example.invalid", advisorComments: null, studentEmail: "student@example.invalid", sourceRevision: 5, targetActiveStep: "specific_objectives", targetState: "validating_specific_objectives", targetStableState: "validating_specific_objectives" }];
  assert.throws(() => prepareWorkflowEdit(input), /aguardando o orientador/);
});

test("C111: duplication creates independent IDs and no inherited approval or history", () => {
  const base = versionedWorkflowFixture();
  base.content.stepDrafts.methodology_matrix = { baseRevision: 1, savedAt: base.updatedAt, unit: workflowUnit(base.content, "methodology_matrix") };
  const cloned = cloneResearchWorkflowContent(base.content);
  assert.equal(cloned.stepDrafts.methodology_matrix?.unit.methodologyRows[0].objectiveId, cloned.elements.find((item) => item.type === "specific_objective")?.id);
  assert.equal(cloned.advisorReviews.length, 0); assert.equal(cloned.elementVersions.length, 0);
  assert.ok(!cloned.elements.some((item) => base.content.elements.some((old) => old.id === item.id)));
});


test("C111: accepting an identical proposal clears the proposal and creates a recoverable draft", () => {
  const base = versionedWorkflowFixture();
  base.content.stepProposals.general_objective = { baseRevision: base.sourceRevision, savedAt: base.updatedAt, unit: workflowUnit(base.content, "general_objective") };
  const next = prepareWorkflowEdit({ ...edit("accept_proposal"), base, content: base.content });
  assert.equal(next.unchanged, false);
  assert.ok(next.content.stepDrafts.general_objective);
  assert.equal(next.content.stepProposals.general_objective, undefined);
});
