import assert from "node:assert/strict";
import { test } from "node:test";
import type { generateStructured } from "../modules/ai/generate";
import { generateCardRevision } from "../modules/generation/regenerate-card";
import { regenerationCard } from "../modules/research-workflow/card-regeneration";
import { versionedWorkflowFixture, fixtureId } from "./fixtures/versioned-workflow";

test("card prompt combines the current draft, explicit instruction and confirmed project context", async () => {
  const { content } = versionedWorkflowFixture();
  const selected = content.elements.find(item => item.id === fixtureId(13))!;
  selected.proposedContent = "Texto sintético editado antes da chamada.";
  selected.studentJustification = "Nota específica do quadro em revisão.";
  selected.status = "edited";
  let calls = 0;
  const generate: typeof generateStructured = async (request) => {
    calls++;
    assert.equal(request.operation, "generate_specific_objectives");
    assert.ok(request.prompt.includes(selected.proposedContent));
    assert.ok(request.prompt.includes(selected.studentJustification!));
    assert.ok(request.prompt.includes("Comparar métodos sintéticos"));
    assert.ok(request.prompt.includes(content.elements.find(item => item.type === "problem_statement")!.approvedContent!));
    assert.ok(request.prompt.includes(content.discovery!.references[0].title!));
    assert.equal(request.schema.safeParse({ text: "a" }).success, false);
    assert.equal(request.schema.safeParse({ text: "a".repeat(701) }).success, false);
    return { output: request.schema.parse({ text: "Comparar os métodos sintéticos da pesquisa." }), provider: "gemini", model: "synthetic-test" };
  };
  const result = await generateCardRevision(regenerationCard(content, "specific_objectives", selected.id), content, "Comparar métodos sintéticos", generate);
  assert.equal(calls, 1);
  assert.deepEqual(result, { kind: "element", text: "Comparar os métodos sintéticos da pesquisa." });
});
