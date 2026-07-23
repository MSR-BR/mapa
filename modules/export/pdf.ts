import PDFDocument from "pdfkit";

import type { ExportDocumentInput } from "./types";

const COLORS = { gold: "#9A7418", muted: "#626B72", navy: "#203748", text: "#1C2428" };

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > doc.page.height - 84) doc.addPage();
}

export async function createPdfExport(input: ExportDocumentInput) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(input.exportedAt);
  const chunks: Buffer[] = [];
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
      doc.fillColor(COLORS.text).font("Helvetica").fontSize(10.5).text(section.content, { align: "justify", lineGap: 4 });
      if (section.referenceIds.length > 0) {
        doc.moveDown(0.35);
        doc.fillColor(COLORS.muted).font("Helvetica-Oblique").fontSize(8.5).text(`Evidências: ${section.referenceIds.join(", ")}`);
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
  doc.moveDown(0.8);
  for (const reference of input.references) {
    ensureSpace(doc, 75);
    const authors = reference.authors.length > 0 ? reference.authors.join(", ") : "Autoria não informada";
    doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(9.5).text(`${reference.referenceId}. ${reference.title ?? "Título não informado"}`, { lineGap: 2 });
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
