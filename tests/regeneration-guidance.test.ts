import assert from "node:assert/strict";
import { test } from "node:test";

import { currentGuidanceNotesSchema, regenerationGuidanceSchema, scopedCurrentGuidanceNotes, scopedRegenerationGuidance } from "../modules/research-workflow/regeneration-guidance";

const id = "89973437-69c4-4ecb-a5c7-b1c431787d09";

test("one-time instructions are scoped to the active stage and not mixed into saved notes", () => {
  const request = regenerationGuidanceSchema.parse([{ id, instruction: "  Reformule o segundo objetivo.  " }]);
  const notes = currentGuidanceNotesSchema.parse([{ id, note: "  Recorte acadêmico permanente.  " }]);
  assert.deepEqual(scopedRegenerationGuidance(request, new Map([[id, "o objetivo específico 2"]])), ["Pedido pontual do autor para o objetivo específico 2, apenas nesta regeneração: Reformule o segundo objetivo."]);
  assert.deepEqual(scopedCurrentGuidanceNotes(notes, new Set([id])), [{ id, note: "Recorte acadêmico permanente." }]);
});

test("stale, repeated or oversized guidance is rejected before AI generation", () => {
  const request = regenerationGuidanceSchema.parse([{ id, instruction: "Revise o objetivo." }]);
  assert.throws(() => scopedRegenerationGuidance(request, new Map()), /fora da etapa/);
  assert.throws(() => scopedRegenerationGuidance([request![0], request![0]], new Map([[id, "OE2"]])), /fora da etapa/);
  assert.equal(regenerationGuidanceSchema.safeParse([{ id, instruction: "x".repeat(1001) }]).success, false);
  assert.throws(() => scopedCurrentGuidanceNotes([{ id, note: "texto" }], new Set()), /fora da etapa/);
});
