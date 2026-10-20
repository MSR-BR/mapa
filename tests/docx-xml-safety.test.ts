import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";

import { createFinalMapDocxExport } from "../modules/export/docx";
import { stripXmlInvalidControls } from "../modules/export/xml-safe";
import type { FinalMapExportInput } from "../modules/export/types";
import { buildFinalMap } from "../modules/research-workflow/final-map";
import { versionedWorkflowFixture } from "./fixtures/versioned-workflow";

const INVALID_IN_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

test("stripXmlInvalidControls removes only characters XML 1.0 forbids", () => {
  const value = { a: "um\u000Bdois\u0007\ttrês\nquatro\r\ncinco", b: ["x\u000C", 3, null], when: new Date(0) };
  const clean = stripXmlInvalidControls(value);
  assert.equal(clean.a, "umdois\ttrês\nquatro\r\ncinco");
  assert.deepEqual(clean.b, ["x", 3, null]);
  assert.equal(clean.when, value.when);
  assert.equal(value.a.includes("\u000B"), true, "input must not be mutated");
});

test("Word report stays well-formed when pasted text carries control characters", async () => {
  const workflow = versionedWorkflowFixture();
  const input: FinalMapExportInput = {
    exportedAt: new Date("2026-10-20T12:00:00Z"), revision: workflow.revision, draft: false, finalMap: buildFinalMap(workflow),
    project: { title: "Projeto\u000B sintético", theme: "Tema\u000C sintético", problem_statement: "Como investigar?", keywords: ["a"], knowledge_area: "Educação", academic_level: "masters" },
  };
  input.finalMap.title = { ...(input.finalMap.title ?? { proposedContent: "" }), approvedContent: "Título\u0007 com controle" } as typeof input.finalMap.title;
  const zip = await JSZip.loadAsync(await createFinalMapDocxExport(input));
  const xml = await zip.file("word/document.xml")!.async("string");
  assert.equal(INVALID_IN_XML.test(xml), false);
  assert.match(xml, /Título com controle/);
});
