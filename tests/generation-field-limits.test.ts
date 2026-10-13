import assert from "node:assert/strict";
import test from "node:test";
import { FIELD_LIMITS, CLASSIFICATION_LIST_COUNTS, classificationListMaxLength, classificationListText, parseClassificationList, problemDraftLimit } from "../modules/research-workflow/field-limits";
import { problemStatementInputSchema, generalObjectiveInputSchema } from "../modules/research-workflow/definition-validation";
import { chapterTopicInputSchema } from "../modules/research-workflow/chapter-validation";
import { methodologyClassificationInputSchema, methodologyRowInputSchema, methodologyPlanInputSchema } from "../modules/research-workflow/methodology-validation";
import { researchIntakeSchema, RESEARCH_INTAKE_FIELDS, parseResearchIntakeJson } from "../modules/projects/research-intake";
import { researchWorkflowSchema } from "../modules/research-workflow/schema";
import { versionedWorkflowFixture } from "./fixtures/versioned-workflow";
import { cardRowSchema, applyRegeneratedCard, regenerationCard } from "../modules/research-workflow/card-regeneration";
import { z } from "zod";

const repeat = (count: number) => "á".repeat(count);
test("C118: editable text boundaries accept the limit and reject limit+1", () => {
  const fields: Array<[z.ZodType, number]> = [
    [problemStatementInputSchema, FIELD_LIMITS.problem], [generalObjectiveInputSchema, FIELD_LIMITS.objective],
    [chapterTopicInputSchema.shape.title, FIELD_LIMITS.topic], [methodologyPlanInputSchema.shape.title, FIELD_LIMITS.title],
    [methodologyClassificationInputSchema.shape.rationale, FIELD_LIMITS.rationale],
    ...(["dataCollection", "analysisTreatment", "expectedResult"] as const).flatMap((key) => [
      [methodologyRowInputSchema.shape[key], FIELD_LIMITS[key]] as [z.ZodType, number], [cardRowSchema.shape[key], FIELD_LIMITS[key]] as [z.ZodType, number],
    ]),
  ];
  for (const [schema, limit] of fields) {
    assert.equal(schema.safeParse(repeat(limit)).success, true);
    assert.equal(schema.safeParse(repeat(limit + 1)).success, false);
    assert.equal(schema.safeParse("😀".repeat(limit)).success, false, "HTML and Zod both count UTF-16 units");
  }
});

test("C118: generated lists fit the rendered box and round-trip commas without dropping items", () => {
  const classification = versionedWorkflowFixture().content.methodologyClassification!;
  for (const field of Object.keys(CLASSIFICATION_LIST_COUNTS) as Array<keyof typeof CLASSIFICATION_LIST_COUNTS>) {
    const max = field === "ethicsWarnings" ? FIELD_LIMITS.ethicsWarning : FIELD_LIMITS.classificationItem;
    const items = Array.from({ length: CLASSIFICATION_LIST_COUNTS[field] }, (_, i) => `${i}, ${repeat(max - 3)}`);
    const text = classificationListText(items);
    assert.equal(text.length, classificationListMaxLength(field));
    assert.deepEqual(parseClassificationList(text), items);
    assert.equal(methodologyClassificationInputSchema.safeParse({ ...classification, [field]: items }).success, true);
    assert.equal(methodologyClassificationInputSchema.safeParse({ ...classification, [field]: [...items, "Não descartar este excesso silenciosamente"] }).success, false);
  }
});

test("C118: oversized card result cannot mutate the saved workflow; legacy draft can be recovered", () => {
  const { content } = versionedWorkflowFixture();
  const old = JSON.stringify(content);
  const card = regenerationCard(content, "problem_statement", "problem");
  assert.throws(() => applyRegeneratedCard(content, card, { kind: "element", text: repeat(501) }));
  assert.equal(JSON.stringify(content), old);
  assert.equal(problemDraftLimit(), 500);
  assert.equal(problemDraftLimit(repeat(601)), 601);
  assert.equal(problemStatementInputSchema.safeParse(repeat(601)).success, false);
});

test("C118: original advanced answers survive input parsing and workflow reload verbatim", () => {
  const intake = Object.fromEntries(RESEARCH_INTAKE_FIELDS.map(({ name }, i) => [name, `  Resposta ${i}, escrita pelo aluno.\n\nSegunda linha: não corrigir minha grafia.  `]));
  const original = { ...intake, researchType: "tcc" };
  const parsed = parseResearchIntakeJson(JSON.stringify(original));
  assert.deepEqual(parsed, original);
  const workflow = versionedWorkflowFixture();
  workflow.content.initialBriefing = parsed;
  assert.deepEqual(researchWorkflowSchema.parse(JSON.parse(JSON.stringify(workflow))).content.initialBriefing, original);
  assert.equal(researchIntakeSchema.safeParse({ ...original, problemContext: " \n " }).success, false);
  assert.equal(researchIntakeSchema.safeParse({ ...original, problemContext: repeat(2001) }).success, false);
});
