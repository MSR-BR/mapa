import assert from "node:assert/strict";
import test from "node:test";

import { studentContinuationMeta } from "../modules/research-workflow/dashboard";
import { EMPTY_WORKFLOW_CONTENT, RESEARCH_WORKFLOW_SCHEMA_VERSION, type ResearchWorkflow } from "../modules/research-workflow/schema";

const ownerId = "16ba4d4e-bf5b-49d6-8f65-8a678103194b";
const projectId = "f5ce3156-7832-4717-8268-12dcf81fe1c0";
const project = { authoring_role: "student", owner_id: ownerId, status: "draft", workflow_version: 2, advisor_email: "advisor@example.com" };
const actor = { activeRole: "student", userId: ownerId };
const workflow: ResearchWorkflow = {
  content: { ...EMPTY_WORKFLOW_CONTENT, activeStep: "general_objective" },
  ownerId, projectId, revision: 1, schemaVersion: RESEARCH_WORKFLOW_SCHEMA_VERSION,
  sourceRevision: 1, stableState: "validating_general_objective", state: "validating_general_objective",
  updatedAt: "2026-10-27T12:00:00.000Z",
};

test("student continuation names the persisted available step and progress", () => {
  assert.deepEqual(studentContinuationMeta(project, workflow, actor), { stageLabel: "Objetivo geral", progress: 0 });
  assert.deepEqual(studentContinuationMeta(project, { ...workflow, content: { ...workflow.content, activeStep: null }, state: "draft_prompt" }, actor), {
    stageLabel: "Descoberta de propostas", progress: 0,
  });
});

test("student continuation excludes review, correction, failure, completion and an active generation", () => {
  for (const state of ["failed", "completed", "discovering"] as const) {
    assert.equal(studentContinuationMeta(project, { ...workflow, state }, actor), null, state);
  }
  for (const status of ["pending", "changes_requested"] as const) {
    const review = {
      advisorComments: null, advisorEmail: null, advisorId: null, id: projectId,
      requestedAt: "2026-10-27T12:00:00.000Z", reviewedAt: null, sourceRevision: 1,
      status, step: "general_objective" as const, studentEmail: null,
      targetActiveStep: "general_objective" as const,
      targetStableState: "validating_general_objective" as const,
      targetState: "validating_general_objective" as const,
    };
    assert.equal(studentContinuationMeta(project, { ...workflow, content: { ...workflow.content, advisorReviews: [review] } }, actor), null, status);
  }
});

test("student continuation requires ownership, student role, advisor and an available v2 workflow", () => {
  assert.equal(studentContinuationMeta(project, workflow, { ...actor, activeRole: "advisor" }), null);
  assert.equal(studentContinuationMeta({ ...project, owner_id: projectId }, workflow, actor), null);
  assert.equal(studentContinuationMeta({ ...project, authoring_role: "advisor" }, workflow, actor), null);
  assert.equal(studentContinuationMeta({ ...project, advisor_email: null }, workflow, actor), null);
  assert.equal(studentContinuationMeta({ ...project, workflow_version: 1 }, workflow, actor), null);
  assert.equal(studentContinuationMeta({ ...project, status: "completed" }, workflow, actor), null);
  assert.equal(studentContinuationMeta(project, undefined, actor), null);
});
