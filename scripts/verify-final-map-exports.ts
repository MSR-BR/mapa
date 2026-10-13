import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createFinalMapPdfExport } from "../modules/export/pdf";
import type { FinalMapExportInput } from "../modules/export/types";
import { buildFinalMap } from "../modules/research-workflow/final-map";
import { RESEARCH_INTAKE_FIELDS, researchIntakeSchema } from "../modules/projects/research-intake";
import { versionedWorkflowFixture } from "../tests/fixtures/versioned-workflow";

const directory = resolve("tmp/exports");
await mkdir(directory, { recursive: true });
const workflow = versionedWorkflowFixture();
const answers = Object.fromEntries(RESEARCH_INTAKE_FIELDS.map(({ name }, i) => [name,
  `  INÍCIO DA RESPOSTA ${i + 1}\nGrafia original: pesquiza, ação e educação.\n\n${"Texto sintético longo escrito pelo aluno, sem correção ou síntese. ".repeat(27)}\nFIM DA RESPOSTA ${i + 1}  `]));
workflow.content.initialBriefing = researchIntakeSchema.parse({ ...answers, researchType: "dissertacao" });
const original = JSON.stringify(workflow);
const input: FinalMapExportInput = {
  exportedAt: new Date("2026-10-13T12:00:00Z"), revision: workflow.revision, draft: false, finalMap: buildFinalMap(workflow),
  project: { title: "Projeto sintético C118", theme: "Aprendizagem sintética", problem_statement: "Como investigar o cenário sintético?", keywords: ["aprendizagem"], knowledge_area: "Educação", academic_level: "masters" },
};
for (const variant of ["advanced", "advanced-draft", "quick"] as const) {
  const document = structuredClone(input);
  if (variant === "quick") document.finalMap.workflow.content.initialBriefing = null;
  document.draft = variant === "advanced-draft";
  const pdf = await createFinalMapPdfExport(document);
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 1000);
  await writeFile(resolve(directory, `mapa-c118-${variant}.pdf`), pdf);
  console.log(JSON.stringify({ variant, bytes: pdf.length }));
}
assert.equal(JSON.stringify(workflow), original, "Export must not modify the original workflow");
await writeFile(resolve(directory, "mapa-c118-original-answers.json"), JSON.stringify(answers, null, 2));
