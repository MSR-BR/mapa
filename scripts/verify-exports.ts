import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createDocxExport } from "../modules/export/docx";
import { createPdfExport } from "../modules/export/pdf";
import type { ExportDocumentInput } from "../modules/export/types";

const chapterTitles = ["Introdução", "Revisão da Literatura", "Metodologia Científica", "Desenvolvimento da Pesquisa", "Conclusões"] as const;
const references = [
  { authors: ["Ana Pesquisadora", "Bruno Cientista"], doi: "10.1234/exemplo.2026.1", referenceId: "R001", title: "Inteligência artificial e práticas pedagógicas", url: "https://doi.org/10.1234/exemplo.2026.1", year: 2026 },
  { authors: ["Carla Docente"], doi: null, referenceId: "R002", title: "Integridade acadêmica no ensino superior", url: "https://example.org/referencia-2", year: 2025 },
];

const input: ExportDocumentInput = {
  exportedAt: new Date("2026-07-23T12:00:00-03:00"),
  project: {
    academic_level: "Mestrado",
    keywords: ["inteligência artificial", "ensino superior", "integridade acadêmica"],
    knowledge_area: "Educação",
    problem_statement: "Como a IA generativa influencia práticas pedagógicas e a integridade acadêmica?",
    theme: "IA generativa no ensino superior brasileiro",
    title: "Impactos da inteligência artificial generativa no ensino superior brasileiro",
  },
  references,
  revision: 2,
  structure: {
    chapters: chapterTitles.map((title, index) => ({
      id: `chapter-${index + 1}`,
      number: index + 1,
      sections: [{
        content: `Este texto de validação apresenta o planejamento do capítulo ${index + 1}, preservando a última versão salva e sua relação com evidências verificadas. O conteúdo permanece editável no DOCX e legível no PDF, sem afirmar resultados ainda não obtidos.`,
        id: `chapter-${index + 1}-section-1`,
        optional: false,
        provenance: "user" as const,
        referenceIds: index < 2 ? [references[index].referenceId] : [],
        title: `Seção de planejamento do capítulo ${index + 1}`,
      }],
      title,
    })),
    schemaVersion: "1.0.0",
    title: "Estrutura acadêmica validada",
    warnings: ["Este documento é uma estrutura de planejamento e deve ser revisado antes do uso acadêmico."],
  },
};

const outputDirectory = resolve("tmp/exports");
await mkdir(outputDirectory, { recursive: true });
const [docx, pdf] = await Promise.all([createDocxExport(input), createPdfExport(input)]);
await Promise.all([
  writeFile(resolve(outputDirectory, "mapa-export-validation.docx"), docx),
  writeFile(resolve(outputDirectory, "mapa-export-validation.pdf"), pdf),
]);

if (docx.subarray(0, 2).toString() !== "PK") throw new Error("DOCX inválido.");
if (pdf.subarray(0, 4).toString() !== "%PDF") throw new Error("PDF inválido.");
console.log(JSON.stringify({ docxBytes: docx.byteLength, outputDirectory, pdfBytes: pdf.byteLength }));
