import assert from "node:assert/strict";
import { test } from "node:test";
import { RESEARCH_INTAKE_FIELDS, researchIntakeSchema, researchIntakeInputSchema, parseResearchIntakeJson, currentResearchIntakeReview } from "../modules/projects/research-intake";
import { rewriteInitialBriefing } from "../modules/generation/rewrite-initial-briefing";
import type { generateStructured } from "../modules/ai/generate";
import { buildFinalReport } from "../modules/export/final-report";
import { buildFinalMap } from "../modules/research-workflow/final-map";
import { versionedWorkflowFixture } from "./fixtures/versioned-workflow";
const intake = (size = 400) => researchIntakeSchema.parse({ ...Object.fromEntries(RESEARCH_INTAKE_FIELDS.map(({ name }) => [name, "a".repeat(size)])), researchType: "dissertacao" });

test("new advanced intake accepts 400, rejects 401 on the server, and preserves legacy 2000 characters", () => {
  assert.ok(parseResearchIntakeJson(JSON.stringify(intake())));
  assert.equal(parseResearchIntakeJson(JSON.stringify(intake(401))), null);
  assert.equal(researchIntakeInputSchema.safeParse(intake(401)).success, false);
  const workflow = versionedWorkflowFixture(); workflow.content.initialBriefing = intake(2000);
  assert.equal(workflow.content.initialBriefing.problemContext.length, 2000);
  assert.equal(parseResearchIntakeJson(JSON.stringify({ ...intake(), problemContext: " short " })), null);
});

test("appendix rewrite preserves original spacing, isolates source text, validates every generated limit and caches exact source", async () => {
  const original = { ...intake(1800), problemContext: "  Grafia orijinal.\n\nComo investigar sem afirmar resultados?  " };
  const before = structuredClone(original);
  const generator: typeof generateStructured = async request => {
    assert.equal(request.operation, "rewrite_initial_briefing");
    assert.ok(request.prompt.includes(JSON.stringify(original)));
    assert.match(request.prompt, /sem acrescentar fatos/);
    const texts = Object.fromEntries(RESEARCH_INTAKE_FIELDS.map(({ name }) => [name, "Texto fiel sintético."]));
    for (const { name } of RESEARCH_INTAKE_FIELDS) assert.equal(request.schema.safeParse({ ...texts, [name]: "a".repeat(401) }).success, false);
    return { output: request.schema.parse(texts), provider: "gemini", model: "synthetic" };
  };
  const review = await rewriteInitialBriefing(original, generator);
  assert.deepEqual(original, before); assert.deepEqual(review.sourceBriefing, original);
  assert.deepEqual(currentResearchIntakeReview({ initialBriefing: original, initialBriefingReview: review }), review.texts);
  assert.equal(currentResearchIntakeReview({ initialBriefing: { ...original, observedSituation: "Texto mudou." }, initialBriefingReview: review }), null);
  await assert.rejects(() => rewriteInitialBriefing(original, async () => { throw Error("offline"); }));
  assert.deepEqual(original, before);
});

test("shared report includes complete chapters and five literal original/reformulated pairs only for advanced mode", () => {
  const workflow = versionedWorkflowFixture(); workflow.content.initialBriefing = intake();
  workflow.content.initialBriefingReview = { sourceBriefing: intake(), texts: Object.fromEntries(RESEARCH_INTAKE_FIELDS.map(({ name }) => [name, `Texto reformulado: ${name}`])) as NonNullable<typeof workflow.content.initialBriefingReview>["texts"] };
  const input = { draft: false, exportedAt: new Date(), revision: 10, finalMap: buildFinalMap(workflow), project: { title: "Teste", theme: "Teste", problem_statement: "Teste", keywords: [], knowledge_area: "Educação", academic_level: "masters" } };
  const blocks = buildFinalReport(input);
  assert.equal(blocks.filter(b => b.kind === "original").length, 5);
  assert.equal(blocks.filter(b => "text" in b && b.text === "Texto Mapa da Pesquisa:").length, 5);
  for (const b of blocks) if (b.kind === "original") assert.equal(b.text, "a".repeat(400));
  for (const heading of ["1 INTRODUÇÃO", "2 REVISÃO DA LITERATURA", "3 METODOLOGIA DA PESQUISA", "4 ESTUDO DE CASO / ANÁLISE E DISCUSSÃO DOS RESULTADOS", "5 CONCLUSÃO E RECOMENDAÇÕES PARA FUTURAS PESQUISAS", "REFERÊNCIAS"]) assert.ok(blocks.some(b => "text" in b && b.text === heading));
  assert.equal(blocks.filter(b => b.kind === "methodology").length, 3);
  input.finalMap.workflow.content.initialBriefing = null;
  assert.equal(buildFinalReport(input).filter(b => b.kind === "original").length, 0);
});
