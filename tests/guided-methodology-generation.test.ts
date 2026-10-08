import assert from "node:assert/strict";
import { test } from "node:test";
import type { generateStructured } from "../modules/ai/generate";
import { generateMethodologyPlan } from "../modules/generation/gemini";
import { methodologyIssues } from "../modules/research-workflow/methodology-assistance";
import { versionedWorkflowFixture } from "./fixtures/versioned-workflow";

test("methodology generation supplies a complete editable proposal, real links and stable existing row IDs", async () => {
  const { content } = versionedWorkflowFixture();
  const general = content.elements.find((item) => item.type === "general_objective")!;
  const specifics = content.elements.filter((item) => item.type === "specific_objective").map((item) => ({ id: item.id, content: item.proposedContent }));
  const topics = content.chapterTopicDetails.map((topic) => ({ ...topic, id: topic.topicId, title: content.elements.find((item) => item.id === topic.topicId)!.proposedContent, referenceIds: ["fixture-reference"] }));
  const generate: typeof generateStructured = async (request) => {
    assert.equal(request.operation, "generate_methodology_plan");
    assert.match(request.prompt, /Preencha todos os campos obrigatórios/);
    assert.match(request.prompt, /não as invente/);
    assert.ok(request.prompt.includes(content.methodologyRows[0].dataCollection));
    const output = request.schema.parse({
      title: "Estratégias sintéticas de aprendizagem e suas contribuições",
      classification: content.methodologyClassification,
      rows: [...specifics, { id: general.id, content: general.proposedContent }].map((objective) => ({
        objectiveId: objective.id, associatedTopicIds: [topics[0].id],
        dataCollection: `Propõe-se examinar documentos relacionados a: ${objective.content}`,
        analysisTreatment: "Propõe-se codificar categorias temáticas e comparar convergências e diferenças entre os registros.",
        expectedResult: "Espera-se produzir uma síntese dos temas e das lacunas relativos ao objetivo.", studentJustification: null,
      })),
    });
    return { output, provider: "gemini", model: "synthetic-test" };
  };
  const result = await generateMethodologyPlan("Como estudar a aprendizagem?", general.proposedContent, general.id, specifics,
    topics.filter((topic) => topic.chapter === "literature"), topics.filter((topic) => topic.chapter === "development"), content.discovery!, content.methodologyRows, [], [], generate);
  assert.equal(result.rows.length, specifics.length + 1);
  assert.equal(result.rows[0].id, content.methodologyRows[0].id);
  assert.deepEqual(methodologyIssues(result, [...specifics.map((item, index) => ({ id: item.id, label: `OE${index + 1}` })), { id: general.id, label: "OEG" }], new Set(topics.map((topic) => topic.id))), []);
});
