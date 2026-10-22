import PDFDocument from "pdfkit";
import path from "node:path";

import { buildFinalReport, finalMapText } from "./final-report";
import type { ExportDocumentInput, FinalMapExportInput } from "./types";
import {
  citationMarkers,
  buildReferenceCodeMap,
  withCitationMarkers,
} from "@/modules/research-workflow/reference-citations";
import { getResearchProductGuidance } from "@/modules/research-workflow/research-level-guidance";

const COLORS = { gold: "#9A7418", muted: "#626B72", navy: "#203748", text: "#1C2428" };
const RESEARCH_STARTER_URL = "https://researchstarter.vercel.app";
const APP_URL = "https://mapadapesquisa.com.br";
const BRAND_WORDMARK_PATH = path.join(process.cwd(), "public/brand/mapa-da-pesquisa-wordmark.png");
const CBL_BARCODE_PATH = path.join(process.cwd(), "public/brand/cbl-isbn-barcode.jpeg");
const CBL_ISBN = "978-65-01-44943-2";

const FONT_DIRECTORY = path.join(process.cwd(), "assets/fonts/dejavu");
function registerExportFonts(doc: PDFKit.PDFDocument) {
  doc.registerFont("MapaSans", path.join(FONT_DIRECTORY, "DejaVuSans.ttf"));
  doc.registerFont("MapaSans-Bold", path.join(FONT_DIRECTORY, "DejaVuSans-Bold.ttf"));
  doc.registerFont("MapaSans-Oblique", path.join(FONT_DIRECTORY, "DejaVuSans-Oblique.ttf"));
}

function addAppAttribution(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.fillColor("#176B4D").font("MapaSans").fontSize(7.5).text("Mapa da Pesquisa · mapadapesquisa.com.br", x, y, { link: APP_URL, underline: true });
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > doc.page.height - 84) doc.addPage();
}

export async function createPdfExport(input: ExportDocumentInput) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(input.exportedAt);
  const chunks: Buffer[] = [];
  const referenceCodes = buildReferenceCodeMap(input.references);
  const doc = new PDFDocument({ bufferPages: true, info: { Author: "Mapa da Pesquisa", Subject: "Estrutura acadêmica para revisão", Title: input.project.title }, margins: { bottom: 72, left: 72, right: 72, top: 72 }, size: "LETTER" });
  registerExportFonts(doc);
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.moveDown(5);
  doc.fillColor(COLORS.gold).font("MapaSans-Bold").fontSize(10).text("MAPA DA PESQUISA", { align: "center", characterSpacing: 1.5 });
  doc.moveDown(1.5);
  doc.fillColor(COLORS.navy).font("MapaSans-Bold").fontSize(26).text(input.project.title, { align: "center", lineGap: 6 });
  doc.moveDown(1);
  doc.fillColor(COLORS.muted).font("MapaSans-Oblique").fontSize(12).text("Estrutura acadêmica para revisão", { align: "center" });
  doc.moveDown(6);
  doc.font("MapaSans").fontSize(10).text(`Versão ${input.revision} · Exportado em ${dateLabel}`, { align: "center" });
  addAppAttribution(doc, 72, doc.y + 14);

  doc.addPage();
  doc.fillColor(COLORS.navy).font("MapaSans-Bold").fontSize(18).text("Informações do projeto");
  doc.moveDown(0.7);
  const metadata = [
    ["Tema", input.project.theme],
    ["Situação-problema", input.project.problem_statement],
    ["Área do conhecimento", input.project.knowledge_area],
    ["Nível acadêmico", input.project.academic_level],
    ["Palavras-chave", input.project.keywords.join(", ")],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  for (const [label, value] of metadata) {
    doc.fillColor(COLORS.text).font("MapaSans-Bold").fontSize(10.5).text(`${label}:`, { continued: true });
    doc.font("MapaSans").text(` ${value}`, { lineGap: 3 });
    doc.moveDown(0.35);
  }
  doc.moveDown(1);
  doc.fillColor(COLORS.navy).font("MapaSans-Bold").fontSize(18).text("Sumário");
  doc.moveDown(0.6);
  for (const chapter of input.structure.chapters) {
    doc.fillColor(COLORS.text).font("MapaSans").fontSize(11).text(`${chapter.number}. ${chapter.title}`, { indent: 14, lineGap: 4 });
  }

  for (const chapter of input.structure.chapters) {
    doc.addPage();
    doc.fillColor(COLORS.navy).font("MapaSans-Bold").fontSize(20).text(`${chapter.number}. ${chapter.title}`);
    doc.moveDown(0.8);
    for (const section of chapter.sections) {
      ensureSpace(doc, 110);
      doc.fillColor("#2B5163").font("MapaSans-Bold").fontSize(13).text(section.title, { lineGap: 3 });
      doc.moveDown(0.4);
      doc.fillColor(COLORS.text).font("MapaSans").fontSize(10.5).text(withCitationMarkers(section.content, section.referenceIds, referenceCodes), { align: "justify", lineGap: 4 });
      if (section.referenceIds.length > 0) {
        doc.moveDown(0.35);
        doc.fillColor(COLORS.muted).font("MapaSans-Oblique").fontSize(8.5).text(`Evidências: ${citationMarkers(section.referenceIds, referenceCodes)}`);
      }
      doc.moveDown(1);
    }
  }

  if (input.structure.warnings.length > 0) {
    doc.addPage();
    doc.fillColor(COLORS.navy).font("MapaSans-Bold").fontSize(18).text("Avisos para revisão");
    doc.moveDown(0.7);
    for (const warning of input.structure.warnings) {
      ensureSpace(doc, 48);
      doc.fillColor(COLORS.text).font("MapaSans").fontSize(10.5).text(`•  ${warning}`, { indent: 14, lineGap: 4 });
      doc.moveDown(0.4);
    }
  }

  doc.addPage();
  doc.fillColor(COLORS.navy).font("MapaSans-Bold").fontSize(18).text("Referências verificadas");
  doc.moveDown(0.5);
  doc.fillColor(COLORS.muted).font("MapaSans").fontSize(9).text(
    "Referências otimizadas com Research Starter.",
    { link: RESEARCH_STARTER_URL, underline: true },
  );
  doc.moveDown(0.8);
  for (const reference of input.references) {
    ensureSpace(doc, 75);
    const authors = reference.authors.length > 0 ? reference.authors.join(", ") : "Autoria não informada";
    const code = referenceCodes.get(reference.referenceId) ?? reference.referenceId;
    doc.fillColor(COLORS.text).font("MapaSans-Bold").fontSize(9.5).text(`${code}. ${reference.title ?? "Título não informado"}`, { lineGap: 2 });
    doc.fillColor(COLORS.muted).font("MapaSans").fontSize(8.5).text([authors, reference.year, reference.doi ? `DOI: ${reference.doi}` : null].filter(Boolean).join(". "), { lineGap: 2 });
    if (reference.url) doc.fillColor("#176B4D").text(reference.url, { link: reference.url, underline: true });
    doc.moveDown(0.65);
  }

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.page.margins.bottom = 0;
    addAppAttribution(doc, 72, doc.page.height - 48);
    doc.fillColor(COLORS.muted).font("MapaSans").fontSize(7.5).text(
      `Versão ${input.revision} · Revisar antes do uso · ${dateLabel} · Página ${index + 1} de ${range.count}`,
      72,
      doc.page.height - 36,
      { align: "right", lineBreak: false, width: doc.page.width - 144 },
    );
  }

  doc.end();
  return completed;
}

function addFinalMapHeading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 54);
  doc.moveDown(0.8);
  doc.fillColor(COLORS.navy).font("MapaSans-Bold").fontSize(17).text(title, { lineGap: 4 });
  doc.moveDown(0.45);
}

function addFinalMapSubheading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 42);
  doc.moveDown(0.35);
  doc.fillColor("#2B5163").font("MapaSans-Bold").fontSize(12.5).text(title, { lineGap: 3 });
  doc.moveDown(0.3);
}

function addBrandWordmark(doc: PDFKit.PDFDocument) {
  try {
    const width = 172;
    doc.image(BRAND_WORDMARK_PATH, (doc.page.width - width) / 2, 42, { fit: [width, 48], align: "center", valign: "center" });
  } catch {
    // The document remains usable if a deployment omits the optional brand asset.
  }
}

function addCblRegistrationPage(doc: PDFKit.PDFDocument) {
  doc.addPage();
  addFinalMapHeading(doc, "Registro e produção");
  addWrappedParagraph(doc, "Este mapa foi produzido pelo aplicativo Mapa da Pesquisa para apoiar a organização, a revisão e a discussão de uma proposta de pesquisa. Acesse o aplicativo em mapadapesquisa.com.br.");
  doc.fillColor("#176B4D").font("MapaSans-Bold").fontSize(10).text("Abrir o Mapa da Pesquisa", { link: APP_URL, underline: true, align: "center" });
  doc.moveDown(1.1);
  doc.fillColor(COLORS.text).font("MapaSans").fontSize(10).text(`Este mapa está registrado na Câmara Brasileira do Livro (CBL), sob o ISBN ${CBL_ISBN}.`, { align: "center" });
  doc.moveDown(0.6);
  try {
    const width = Math.min(430, doc.page.width - doc.page.margins.left - doc.page.margins.right);
    const imageY = doc.y;
    doc.image(CBL_BARCODE_PATH, (doc.page.width - width) / 2, imageY, { fit: [width, 210], align: "center", valign: "center" });
    doc.y = imageY + 224;
  } catch {
    doc.fillColor(COLORS.muted).font("MapaSans-Oblique").fontSize(9).text("Código de barras CBL não disponível nesta implantação.", { align: "center" });
  }
  doc.moveDown(0.4);
  doc.fillColor(COLORS.muted).font("MapaSans").fontSize(8.5).text("O número e a imagem de registro foram informados pelo responsável pelo aplicativo.", { align: "center" });
}

function addWrappedParagraph(doc: PDFKit.PDFDocument, text: string, options: { indent?: number } = {}) {
  ensureSpace(doc, 72);
  doc.fillColor(COLORS.text).font("MapaSans").fontSize(10.2).text(text || "Não informado.", {
    align: "justify",
    indent: options.indent ?? 0,
    lineGap: 4,
  });
  doc.moveDown(0.6);
}

export async function createFinalMapPdfExport(input: FinalMapExportInput) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(input.exportedAt);
  const chunks: Buffer[] = [];
  const finalMap = input.finalMap;
  const productGuidance = getResearchProductGuidance(finalMap.workflow.content.discovery?.interpreted.researchType);
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
  registerExportFonts(doc);
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", reject);
  });

  addBrandWordmark(doc);
  doc.y = 112;
  doc.fillColor(COLORS.gold).font("MapaSans-Bold").fontSize(10).text("MAPA DA PROPOSTA DE PESQUISA", { align: "center", characterSpacing: 1.5 });
  doc.moveDown(1.5);
  doc.fillColor(COLORS.navy).font("MapaSans-Bold").fontSize(24).text(finalMapText(finalMap.title), { align: "center", lineGap: 6 });
  doc.moveDown(1);
  doc.fillColor(COLORS.muted).font("MapaSans-Oblique").fontSize(11).text(productGuidance?.label ?? input.project.academic_level ?? "Pesquisa acadêmica", { align: "center" });
  doc.moveDown(0.6);
  doc.fillColor(COLORS.muted).font("MapaSans").fontSize(9.5).text(input.draft ? "Rascunho explicitamente identificado" : "Versão concluída", { align: "center" });
  doc.moveDown(4);
  doc.font("MapaSans").fontSize(9.5).text(`Revisão ${input.revision} - Exportado em ${dateLabel}`, { align: "center" });
  addAppAttribution(doc, 64, doc.y + 14);

  let inAppendix = false;
  for (const block of buildFinalReport(input)) {
    switch (block.kind) {
      case "page": doc.addPage(); break;
      case "heading": inAppendix = block.text.startsWith("APÊNDICE"); addFinalMapHeading(doc, block.text); break;
      case "subheading":
        if (inAppendix) ensureSpace(doc, /^\d+\./.test(block.text) ? 160 : 120);
        addFinalMapSubheading(doc, block.text); break;
      case "paragraph": addWrappedParagraph(doc, block.text, { indent: block.indent }); break;
      case "original":
        ensureSpace(doc, 72);
        doc.fillColor(COLORS.text).font("MapaSans").fontSize(10.2).text(block.text, { align: "left", lineGap: 4 });
        doc.moveDown(1); break;
      case "link":
        doc.fillColor(COLORS.muted).font("MapaSans").fontSize(9).text(block.text, { link: block.url, underline: true });
        doc.moveDown(0.7); break;
      case "reference":
        ensureSpace(doc, 70);
        doc.fillColor(COLORS.text).font("MapaSans-Bold").fontSize(9.4).text(block.title, { lineGap: 2 });
        doc.fillColor(COLORS.muted).font("MapaSans").fontSize(8.5).text(block.details, { lineGap: 2 });
        if (block.url) doc.fillColor("#176B4D").text(block.url, { link: block.url, underline: true });
        doc.moveDown(0.65); break;
      case "methodology":
        ensureSpace(doc, 155);
        doc.roundedRect(doc.x, doc.y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 1, 1).fill("#DDE9E3");
        doc.moveDown(0.55);
        doc.fillColor(COLORS.navy).font("MapaSans-Bold").fontSize(11).text(block.title, { lineGap: 3 });
        doc.moveDown(0.25);
        doc.fillColor(COLORS.text).font("MapaSans-Bold").fontSize(9.4).text("Levantamento:", { continued: true });
        doc.font("MapaSans").text(` ${block.collection}`, { lineGap: 3 });
        doc.fillColor(COLORS.text).font("MapaSans-Bold").text("Análise/tratamento:", { continued: true });
        doc.font("MapaSans").text(` ${block.analysis}`, { lineGap: 3 });
        doc.fillColor(COLORS.text).font("MapaSans-Bold").text("Resultado esperado:", { continued: true });
        doc.font("MapaSans").text(` ${block.result}`, { lineGap: 3 });
        doc.moveDown(0.85); break;
    }
  }

  addCblRegistrationPage(doc);

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.page.margins.bottom = 0;
    addAppAttribution(doc, 64, doc.page.height - 44);
    doc.fillColor(COLORS.muted).font("MapaSans").fontSize(7.5).text(
      `${input.draft ? "Rascunho" : "Versão concluída"} - ${dateLabel} - Página ${index + 1} de ${range.count}`,
      64,
      doc.page.height - 32,
      { align: "right", lineBreak: false, width: doc.page.width - 128 },
    );
  }

  doc.end();
  return completed;
}
