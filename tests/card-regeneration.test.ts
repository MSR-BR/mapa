import assert from "node:assert/strict";
import { test } from "node:test";
import { versionedWorkflowFixture, fixtureId } from "./fixtures/versioned-workflow";
import { regenerationCard, applyRegeneratedCard } from "../modules/research-workflow/card-regeneration";
import { prepareWorkflowEdit } from "../modules/research-workflow/workflow-edit";
import { saveThenRegenerateCard } from "../modules/research-workflow/regenerate-card-client";
import { chapterTopicsInputSchema, chapterTopicsDraftSchema, chapterInputErrors } from "../modules/research-workflow/chapter-validation";
import { mergeReferenceArchive } from "../modules/research-workflow/workflow-references";
import { safeAnalyticsPageLocation } from "../modules/analytics/analytics";

test("card regeneration changes exactly one selected objective, retaining notes, references and confirmed context", () => {
  const base = versionedWorkflowFixture();
  const before = structuredClone(base.content);
  const card = regenerationCard(base.content, "specific_objectives", fixtureId(13));
  const changed = applyRegeneratedCard(base.content, card, { kind: "element", text: "Analisar somente o segundo objetivo com o novo recorte sintético." });
  assert.deepEqual(base.content, before);
  assert.deepEqual(changed.elements.filter(e => e.id !== fixtureId(13)), before.elements.filter(e => e.id !== fixtureId(13)));
  assert.deepEqual(changed.elements.find(e => e.id === fixtureId(13))!.referenceIds, before.elements.find(e => e.id === fixtureId(13))!.referenceIds);
  const result = prepareWorkflowEdit({ base, content: changed, action: "regenerate_card", step: "specific_objectives", sourceRevision: base.sourceRevision, state: base.state, stableState: base.stableState });
  assert.deepEqual(result.content.elements, before.elements);
  assert.equal(result.sourceRevision, base.sourceRevision);
  assert.equal(result.content.stepDrafts.specific_objectives!.unit.elements.find(e => e.id === fixtureId(13))!.proposedContent, changed.elements.find(e => e.id === fixtureId(13))!.proposedContent);
});

test("card scope rejects IDs outside the selected step and unrelated body shapes", () => {
  const { content } = versionedWorkflowFixture();
  assert.throws(() => regenerationCard(content, "problem_statement", fixtureId(13)));
  assert.throws(() => regenerationCard(content, "literature_topics", "classification"));
  assert.throws(() => applyRegeneratedCard(content, regenerationCard(content, "problem_statement", "problem"), { kind: "row", value: { dataCollection: "x", analysisTreatment: "x", expectedResult: "x" } }));
});

test("regenerating a topic preserves every reference and objective association", () => {
  const { content } = versionedWorkflowFixture();
  const next = applyRegeneratedCard(content, regenerationCard(content, "literature_topics", fixtureId(15)), { kind: "element", text: "Tópico sintético revisado" });
  assert.deepEqual(next.chapterTopicDetails, content.chapterTopicDetails);
  assert.deepEqual(next.referenceArchive, content.referenceArchive);
  assert.deepEqual(next.discovery, content.discovery);
  assert.deepEqual(next.traceLinks, content.traceLinks);
});

test("methodology row regeneration preserves classification, other rows and all links", () => {
  const { content } = versionedWorkflowFixture();
  const next = applyRegeneratedCard(content, regenerationCard(content, "methodology_matrix", fixtureId(22)), { kind: "row", value: { dataCollection: "Novo levantamento sintético preservando o objetivo.", analysisTreatment: "Nova análise sintética coerente com o objetivo.", expectedResult: "Resultado sintético esperado desta etapa." } });
  assert.deepEqual(next.methodologyClassification, content.methodologyClassification);
  assert.deepEqual(next.methodologyRows.slice(1), content.methodologyRows.slice(1));
  assert.deepEqual(next.methodologyRows[0].associatedTopicIds, content.methodologyRows[0].associatedTopicIds);
  assert.deepEqual(next.traceLinks, content.traceLinks);
});

test("client persists unsaved page before AI and passes the returned revision", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const base = versionedWorkflowFixture();
  let savedObserved = false;
  const result = await saveThenRegenerateCard({ projectId: base.projectId, step: "specific_objectives", targetId: fixtureId(13), instruction: "Novo recorte", savePath: "/definition", saveBody: { revision: 10, objectives: [{ content: "Edição nova" }] }, headers: {}, onSaved: () => { savedObserved = true; },
    request: async (url, init) => { const body = JSON.parse(String(init.body)); calls.push({ url, body }); if (calls.length === 1) return Response.json({ workflow: { ...base, revision: 11 } }); assert.equal(savedObserved, true); return Response.json({ workflow: { ...base, revision: 12 }, message: "salvo" }); } });
  assert.equal(calls[0].body.action, "save"); assert.equal(calls[1].body.revision, 11); assert.equal(calls[1].body.targetId, fixtureId(13)); assert.equal(result.workflow.revision, 12);
});

test("client never calls AI after save rejection and retains the saved page on AI failure", async () => {
  const base = versionedWorkflowFixture(); let calls = 0; let saved = false;
  const options = { projectId: base.projectId, step: "problem_statement", targetId: "problem", instruction: "", savePath: "/definition", saveBody: {}, headers: {}, onSaved: () => { saved = true; } };
  await assert.rejects(saveThenRegenerateCard({ ...options, request: async () => { calls++; return Response.json({ errors: ["Título obrigatório"] }, { status: 422 }); } }), /Título obrigatório/);
  assert.equal(calls, 1); assert.equal(saved, false);
  calls = 0;
  await assert.rejects(saveThenRegenerateCard({ ...options, request: async () => ++calls === 1 ? Response.json({ workflow: base }) : Response.json({ error: "IA indisponível" }, { status: 503 }) }), /IA indisponível/);
  assert.equal(saved, true);
});

test("chapter drafts accept fewer than three topics, while advance explains the exact requirement", () => {
  assert.equal(chapterTopicsDraftSchema.safeParse([]).success, true);
  const result = chapterTopicsInputSchema.safeParse([]); assert.equal(result.success, false);
  if (!result.success) assert.match(chapterInputErrors(result.error)[0], /3 a 6 tópicos/);
});

test("additional references are deduplicated without replacing manual metadata", () => {
  const reference = versionedWorkflowFixture().content.discovery!.references[0];
  const result = mergeReferenceArchive([reference], [{ ...reference, source: "research_starter", title: "Metadado diferente" }, { ...reference, source: "research_starter", referenceId: "new-reference" }]);
  assert.equal(result.length, 2); assert.deepEqual(result[0], reference);
});

test("public Mapa entry keeps only safe campaign attribution, never prompt or arbitrary query", () => {
  assert.equal(safeAnalyticsPageLocation("https://mapadapesquisa.com.br/mapa?utm_source=google&utm_medium=cpc&prompt=privado&modo=rapido"), "https://mapadapesquisa.com.br/mapa?utm_source=google&utm_medium=cpc");
});
