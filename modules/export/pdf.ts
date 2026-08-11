import PDFDocument from "pdfkit";

import type { ExportDocumentInput, FinalMapExportInput } from "./types";
import {
  buildReferenceCodeMap,
  citationMarkers,
  literatureExpansionText,
  withCitationMarkers,
} from "@/modules/research-workflow/reference-citations";

const COLORS = { gold: "#9A7418", muted: "#626B72", navy: "#203748", text: "#1C2428" };
const RESEARCH_STARTER_URL = "https://research-starter-six.vercel.app";

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > doc.page.height - 84) doc.addPage();
}

export async function createPdfExport(input: ExportDocumentInput) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(input.exportedAt);
  const chunks: Buffer[] = [];
  const referenceCodes = buildReferenceCodeMap(input.references);
  const doc = new PDFDocument({ bufferPages: true, info: { Author: "Mapa da Pesquisa", Subject: "Estrutura acadêmica para revisão", Title: input.project.title }, margins: { bottom: 72, left: 72, right: 72, top: 72 }, size: "LETTER" });
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.moveDown(5);
  doc.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(10).text("MAPA DA PESQUISA", { align: "center", characterSpacing: 1.5 });
  doc.moveDown(1.5);
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(26).text(input.project.title, { align: "center", lineGap: 6 });
  doc.moveDown(1);
  doc.fillColor(COLORS.muted).font("Helvetica-Oblique").fontSize(12).text("Estrutura acadêmica para revisão", { align: "center" });
  doc.moveDown(6);
  doc.font("Helvetica").fontSize(10).text(`Versão ${input.revision} · Exportado em ${dateLabel}`, { align: "center" });

  doc.addPage();
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(18).text("Informações do projeto");
  doc.moveDown(0.7);
  const metadata = [
    ["Tema", input.project.theme],
    ["Situação-problema", input.project.problem_statement],
    ["Área do conhecimento", input.project.knowledge_area],
    ["Nível acadêmico", input.project.academic_level],
    ["Palavras-chave", input.project.keywords.join(", ")],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  for (const [label, value] of metadata) {
    doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(10.5).text(`${label}:`, { continued: true });
    doc.font("Helvetica").text(` ${value}`, { lineGap: 3 });
    doc.moveDown(0.35);
  }
  doc.moveDown(1);
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(18).text("Sumário");
  doc.moveDown(0.6);
  for (const chapter of input.structure.chapters) {
    doc.fillColor(COLORS.text).font("Helvetica").fontSize(11).text(`${chapter.number}. ${chapter.title}`, { indent: 14, lineGap: 4 });
  }

  for (const chapter of input.structure.chapters) {
    doc.addPage();
    doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(20).text(`${chapter.number}. ${chapter.title}`);
    doc.moveDown(0.8);
    for (const section of chapter.sections) {
      ensureSpace(doc, 110);
      doc.fillColor("#2B5163").font("Helvetica-Bold").fontSize(13).text(section.title, { lineGap: 3 });
      doc.moveDown(0.4);
      doc.fillColor(COLORS.text).font("Helvetica").fontSize(10.5).text(withCitationMarkers(section.content, section.referenceIds, referenceCodes), { align: "justify", lineGap: 4 });
      if (section.referenceIds.length > 0) {
        doc.moveDown(0.35);
        doc.fillColor(COLORS.muted).font("Helvetica-Oblique").fontSize(8.5).text(`Evidências: ${citationMarkers(section.referenceIds, referenceCodes)}`);
      }
      doc.moveDown(1);
    }
  }

  if (input.structure.warnings.length > 0) {
    doc.addPage();
    doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(18).text("Avisos para revisão");
    doc.moveDown(0.7);
    for (const warning of input.structure.warnings) {
      ensureSpace(doc, 48);
      doc.fillColor(COLORS.text).font("Helvetica").fontSize(10.5).text(`•  ${warning}`, { indent: 14, lineGap: 4 });
      doc.moveDown(0.4);
    }
  }

  doc.addPage();
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(18).text("Referências verificadas");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text(
    "Referências otimizadas com Research Starter.",
    { link: RESEARCH_STARTER_URL, underline: true },
  );
  doc.moveDown(0.8);
  for (const reference of input.references) {
    ensureSpace(doc, 75);
    const authors = reference.authors.length > 0 ? reference.authors.join(", ") : "Autoria não informada";
    const code = referenceCodes.get(reference.referenceId) ?? reference.referenceId;
    doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(9.5).text(`${code}. ${reference.title ?? "Título não informado"}`, { lineGap: 2 });
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8.5).text([authors, reference.year, reference.doi ? `DOI: ${reference.doi}` : null].filter(Boolean).join(". "), { lineGap: 2 });
    if (reference.url) doc.fillColor("#176B4D").text(reference.url, { link: reference.url, underline: true });
    doc.moveDown(0.65);
  }

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.page.margins.bottom = 0;
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(7.5).text(
      `Versão ${input.revision} · Revisar antes do uso · ${dateLabel} · Página ${index + 1} de ${range.count}`,
      72,
      doc.page.height - 48,
      { align: "right", lineBreak: false, width: doc.page.width - 144 },
    );
  }

  doc.end();
  return completed;
}

function finalMapText(element: { approvedContent: string | null; proposedContent: string } | null | undefined) {
  return element?.approvedContent?.trim() || element?.proposedContent.trim() || "Não informado.";
}

function addFinalMapHeading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 54);
  doc.moveDown(0.8);
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(17).text(title, { lineGap: 4 });
  doc.moveDown(0.45);
}

function addWrappedParagraph(doc: PDFKit.PDFDocument, text: string, options: { indent?: number } = {}) {
  ensureSpace(doc, 72);
  doc.fillColor(COLORS.text).font("Helvetica").fontSize(10.2).text(text || "Não informado.", {
    align: "justify",
    indent: options.indent ?? 0,
    lineGap: 4,
  });
  doc.moveDown(0.6);
}

function finalMapTopicReferenceIds(input: FinalMapExportInput, topicIds: string[]) {
  const topics = [...input.finalMap.literatureTopics, ...input.finalMap.developmentTopics];
  return topics.filter((topic) => topicIds.includes(topic.id)).flatMap((topic) => topic.referenceIds);
}

export async function createFinalMapPdfExport(input: FinalMapExportInput) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(input.exportedAt);
  const chunks: Buffer[] = [];
  const finalMap = input.finalMap;
  const referenceCodes = buildReferenceCodeMap(finalMap.references);
  const doc = new PDFDocument({
    bufferPages: true,
    info: {
      Author: "Mapa da Pesquisa",
      Subject: input.draft ? "Rascunho do mapa da proposta de pesquisa" : "Mapa final da proposta de pesquisa",
      Title: finalMapText(finalMap.title),
    },
    margins: { bottom: 72, left: 64, right: 64, top: 64 },
    size: "LETTER",
  });
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.moveDown(4);
  doc.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(10).text("MAPA DA PROPOSTA DE PESQUISA", { align: "center", characterSpacing: 1.5 });
  doc.moveDown(1.5);
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(24).text(finalMapText(finalMap.title), { align: "center", lineGap: 6 });
  doc.moveDown(1);
  doc.fillColor(COLORS.muted).font("Helvetica-Oblique").fontSize(11).text(input.draft ? "Rascunho explicitamente identificado" : "Versão concluída", { align: "center" });
  doc.moveDown(4);
  doc.font("Helvetica").fontSize(9.5).text(`Workflow v2 - Revisão ${input.revision} - Exportado em ${dateLabel}`, { align: "center" });

  doc.addPage();
  addFinalMapHeading(doc, "Etapa 1. Problemática da pesquisa");
  addWrappedParagraph(doc, withCitationMarkers(finalMapText(finalMap.problemStatement), finalMap.problemStatement?.referenceIds ?? [], referenceCodes));
  addFinalMapHeading(doc, "Etapa 2. Objetivo geral");
  addWrappedParagraph(doc, withCitationMarkers(finalMapText(finalMap.generalObjective), finalMap.generalObjective?.referenceIds ?? [], referenceCodes));
  addFinalMapHeading(doc, "Etapa 3. Objetivos específicos");
  finalMap.specificObjectives.forEach((objective, index) => addWrappedParagraph(doc, `${index + 1}. ${withCitationMarkers(finalMapText(objective), objective.referenceIds, referenceCodes)}`, { indent: 14 }));

  doc.addPage();
  addFinalMapHeading(doc, "Capítulo 3. Metodologia e resultados esperados");
  for (const [index, row] of finalMap.methodologyRows.entries()) {
    ensureSpace(doc, 155);
    const objective = finalMap.specificObjectives.find((item) => item.id === row.objectiveId);
    doc.roundedRect(doc.x, doc.y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 1, 1).fill("#DDE9E3");
    doc.moveDown(0.55);
    doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(11).text(`OE${index + 1}: ${finalMapText(objective)}`, { lineGap: 3 });
    doc.moveDown(0.25);
    doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(9.4).text("Levantamento:", { continued: true });
    doc.font("Helvetica").text(` ${row.dataCollection}`, { lineGap: 3 });
    doc.fillColor(COLORS.text).font("Helvetica-Bold").text("Análise/tratamento:", { continued: true });
    doc.font("Helvetica").text(` ${row.analysisTreatment}`, { lineGap: 3 });
    doc.fillColor(COLORS.text).font("Helvetica-Bold").text("Resultado esperado:", { continued: true });
    doc.font("Helvetica").text(` ${withCitationMarkers(row.expectedResult, finalMapTopicReferenceIds(input, row.associatedTopicIds), referenceCodes)}`, { lineGap: 3 });
    doc.moveDown(0.85);
  }

  doc.addPage();
  addFinalMapHeading(doc, "Etapa 4. Capítulo 2 - Revisão da Literatura");
  finalMap.literatureTopics.forEach((topic) => {
    addWrappedParagraph(doc, `${topic.label} ${withCitationMarkers(topic.title, topic.referenceIds, referenceCodes)}`, { indent: 12 });
    addWrappedParagraph(doc, literatureExpansionText(topic.title, topic.referenceIds, referenceCodes), { indent: 18 });
  });
  addFinalMapHeading(doc, "Etapa 5. Capítulo 4 - Desenvolvimento / Estudo de Caso / Análise e Discussão");
  finalMap.developmentTopics.forEach((topic) => addWrappedParagraph(doc, `${topic.label} ${withCitationMarkers(topic.title, topic.referenceIds, referenceCodes)}`, { indent: 12 }));

  doc.addPage();
  addFinalMapHeading(doc, "Avisos e pendências de coerência");
  const warnings = finalMap.findings.filter((finding) => input.draft || finding.severity !== "blocking");
  if (warnings.length === 0) {
    addWrappedParagraph(doc, "Nenhuma pendência registrada.");
  } else {
    for (const finding of warnings) {
      addWrappedParagraph(doc, `- ${finding.severity}: ${finding.message}${finding.resolution ? ` Correção sugerida: ${finding.resolution}` : ""}`);
    }
  }

  addFinalMapHeading(doc, "Referências verificáveis");
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text("Referências otimizadas com Research Starter.", { link: RESEARCH_STARTER_URL, underline: true });
  doc.moveDown(0.7);
  for (const reference of finalMap.references) {
    ensureSpace(doc, 70);
    const authors = reference.authors.length > 0 ? reference.authors.join(", ") : "Autoria não informada";
    const code = referenceCodes.get(reference.referenceId) ?? reference.referenceId;
    doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(9.4).text(`${code}. ${reference.title ?? "Título não informado"}`, { lineGap: 2 });
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8.5).text([authors, reference.year, reference.doi ? `DOI: ${reference.doi}` : null].filter(Boolean).join(". "), { lineGap: 2 });
    if (reference.url) doc.fillColor("#176B4D").text(reference.url, { link: reference.url, underline: true });
    doc.moveDown(0.65);
  }

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.page.margins.bottom = 0;
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(7.5).text(
      `${input.draft ? "Rascunho" : "Versão concluída"} - Revisar antes do uso - ${dateLabel} - Página ${index + 1} de ${range.count}`,
      64,
      doc.page.height - 44,
      { align: "right", lineBreak: false, width: doc.page.width - 128 },
    );
  }

  doc.end();
  return completed;
}
