import assert from "node:assert/strict";
import { test } from "node:test";
import { methodologyDraftInputSchema, methodologyIssues, mergeMethodologyCompletion } from "../modules/research-workflow/methodology-assistance";
import { saveThenCompleteStep } from "../modules/research-workflow/complete-step-client";
import { versionedWorkflowFixture } from "./fixtures/versioned-workflow";

function fixture() {
  const workflow = versionedWorkflowFixture();
  const plan = methodologyDraftInputSchema.parse({ title: "Título sintético", classification: workflow.content.methodologyClassification, rows: workflow.content.methodologyRows });
  const objectives = plan.rows.map((row, index) => ({ id: row.objectiveId, label: `OE${index + 1}` }));
  const topics = new Set(plan.rows.flatMap((row) => row.associatedTopicIds));
  return { workflow, plan, objectives, topics };
}

test("partial methodology drafts save but show exact actionable requirements for advancing", () => {
  const { plan, objectives, topics } = fixture();
  plan.title = "";
  plan.rows[1].analysisTreatment = "";
  plan.rows.pop();
  plan.classification.procedures = [];
  assert.equal(methodologyDraftInputSchema.safeParse(plan).success, true);
  const issues = methodologyIssues(plan, objectives, topics);
  assert.ok(issues.some((issue) => issue.fieldId === "methodology-title"));
  assert.ok(issues.some((issue) => issue.fieldId === `methodology-${plan.rows[1].id}-analysisTreatment` && issue.message.includes("OE2")));
  assert.ok(issues.some((issue) => issue.message.includes("OE3") && issue.message.includes("falta a linha")));
  assert.ok(issues.some((issue) => issue.fieldId === "methodology-procedures"));
});

test("AI completion fills gaps without replacing author text, notes, row IDs or ordering", () => {
  const { plan, objectives, topics } = fixture();
  const current = structuredClone(plan);
  current.title = "Meu título preservado";
  current.rows = current.rows.slice(0, 2).reverse();
  current.rows[0].dataCollection = "";
  current.rows[0].studentJustification = "Minha orientação preservada";
  current.classification.rationale = "";
  const completed = mergeMethodologyCompletion(current, plan, true);
  assert.equal(completed.title, current.title);
  assert.equal(completed.rows[0].id, current.rows[0].id);
  assert.equal(completed.rows[0].analysisTreatment, current.rows[0].analysisTreatment);
  assert.equal(completed.rows[0].studentJustification, current.rows[0].studentJustification);
  assert.equal(completed.rows[0].dataCollection, plan.rows[1].dataCollection);
  assert.equal(completed.rows.length, 3);
  assert.deepEqual(methodologyIssues(completed, objectives, topics), []);
});

test("concise filled cells and optional context do not prevent advancing", () => {
  const { plan, objectives, topics } = fixture();
  plan.rows.forEach((row) => { row.analysisTreatment = "Análise temática"; row.studentJustification = null; });
  assert.deepEqual(methodologyIssues(plan, objectives, topics), []);
});

test("client saves edits before completion and uses the new revision; provider failure retains the save", async () => {
  const { workflow } = fixture();
  let calls = 0, saved = false;
  await assert.rejects(saveThenCompleteStep({ path: "/test", headers: {}, body: { revision: workflow.revision }, onSaved: () => { saved = true; },
    request: async (_url, init) => {
      const body = JSON.parse(init.body as string);
      if (++calls === 1) { assert.equal(body.action, "save"); return Response.json({ workflow: { ...workflow, revision: workflow.revision + 1 } }); }
      assert.equal(saved, true); assert.equal(body.action, "initialize"); assert.equal(body.revision, workflow.revision + 1);
      return Response.json({ error: "Falha simulada; rascunho preservado" }, { status: 502 });
    },
  }), /rascunho preservado/);
  assert.equal(calls, 2);
});

test("client does not call AI after a draft save conflict", async () => {
  let calls = 0;
  await assert.rejects(saveThenCompleteStep({ path: "/test", headers: {}, body: {}, onSaved: () => assert.fail("must not apply failed save"),
    request: async () => { calls++; return Response.json({ error: "Revisão conflitante" }, { status: 409 }); },
  }), /conflitante/);
  assert.equal(calls, 1);
});
