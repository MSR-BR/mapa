import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  Footer,
  HeadingLevel,
  LevelFormat,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ImageRun,
  TextRun,
} from "docx";

import { readFileSync } from "node:fs";
import path from "node:path";
import { buildFinalReport, finalMapText } from "./final-report";
import { getResearchProductGuidance } from "@/modules/research-workflow/research-level-guidance";

import type { ExportDocumentInput, FinalMapExportInput } from "./types";

const NAVY = "203748";
const MUTED = "626B72";
const GOLD = "9A7418";
const RESEARCH_STARTER_URL = "https://researchstarter.vercel.app";

function metadataParagraph(label: string, value: string | null | undefined) {
  if (!value) return null;
  return new Paragraph({
    children: [
      new TextRun({ bold: true, text: `${label}: ` }),
      new TextRun(value),
    ],
    spacing: { after: 80, line: 300 },
  });
}

function textRun(text: string, options: { bold?: boolean; color?: string; italics?: boolean; size?: number } = {}) {
  return new TextRun({ ...options, text: text || "—" });
}

function simpleParagraph(text: string, options: { bold?: boolean; color?: string; italics?: boolean } = {}) {
  return new Paragraph({
    children: [textRun(text, options)],
    spacing: { after: 120, line: 300 },
  });
}

export async function createDocxExport(input: ExportDocumentInput) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(input.exportedAt);
  const metadata = [
    metadataParagraph("Tema", input.project.theme),
    metadataParagraph("Situação-problema", input.project.problem_statement),
    metadataParagraph("Área do conhecimento", input.project.knowledge_area),
    metadataParagraph("Nível acadêmico", input.project.academic_level),
    metadataParagraph("Palavras-chave", input.project.keywords.join(", ")),
  ].filter((paragraph): paragraph is Paragraph => paragraph !== null);

  const referenceById = new Map(input.references.map((reference) => [reference.referenceId, reference]));
  const body: Paragraph[] = [
    new Paragraph({ spacing: { before: 1800 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ bold: true, color: GOLD, size: 20, text: "MAPA DA PESQUISA" })],
      spacing: { after: 360 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ bold: true, color: NAVY, size: 52, text: input.project.title })],
      spacing: { after: 160, line: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ color: MUTED, italics: true, size: 22, text: "Estrutura acadêmica para revisão" })],
      spacing: { after: 1000 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ color: MUTED, size: 20, text: `Versão ${input.revision} · Exportado em ${dateLabel}` })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Informações do projeto" }),
    ...metadata,
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Sumário" }),
    ...input.structure.chapters.map((chapter) => new Paragraph({
      numbering: { level: 0, reference: "chapter-list" },
      spacing: { after: 100 },
      text: chapter.title,
    })),
  ];

  for (const chapter of input.structure.chapters) {
    body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: `${chapter.number}. ${chapter.title}` }));
    for (const section of chapter.sections) {
      body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: section.title }));
      body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 300 }, text: section.content }));
      if (section.referenceIds.length > 0) {
        body.push(new Paragraph({
          children: [new TextRun({ color: MUTED, italics: true, size: 18, text: `Evidências: ${section.referenceIds.join(", ")}` })],
          spacing: { after: 140 },
        }));
      }
    }
  }

  if (input.structure.warnings.length > 0) {
    body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Avisos para revisão" }));
    for (const warning of input.structure.warnings) {
      body.push(new Paragraph({ numbering: { level: 0, reference: "warning-list" }, text: warning }));
    }
  }

  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Referências verificadas" }));
  body.push(new Paragraph({
    children: [
      new TextRun({ color: MUTED, text: "Referências otimizadas com " }),
      new ExternalHyperlink({
        children: [new TextRun({ color: "176B4D", style: "Hyperlink", text: "Research Starter" })],
        link: RESEARCH_STARTER_URL,
      }),
      new TextRun({ color: MUTED, text: "." }),
    ],
    spacing: { after: 240 },
  }));
  for (const reference of input.references) {
    const authors = reference.authors.length > 0 ? reference.authors.join(", ") : "Autoria não informada";
    const details = [authors, reference.year?.toString(), reference.doi ? `DOI: ${reference.doi}` : null].filter(Boolean).join(". ");
    const children = [new TextRun({ bold: true, text: `${reference.referenceId}. ${reference.title ?? "Título não informado"}` })];
    if (reference.url) {
      children.push(new TextRun({ text: " — " }));
      body.push(new Paragraph({
        children: [...children, new ExternalHyperlink({ children: [new TextRun({ color: "176B4D", style: "Hyperlink", text: "Acessar fonte" })], link: reference.url })],
        spacing: { after: 40 },
      }));
    } else {
      body.push(new Paragraph({ children, spacing: { after: 40 } }));
    }
    body.push(new Paragraph({ children: [new TextRun({ color: MUTED, size: 19, text: details })], spacing: { after: 140 } }));
  }

  const usedReferenceIds = new Set(input.structure.chapters.flatMap((chapter) => chapter.sections.flatMap((section) => section.referenceIds)));
  for (const referenceId of usedReferenceIds) {
    if (!referenceById.has(referenceId)) throw new Error(`Referência ${referenceId} não encontrada para exportação.`);
  }

  const doc = new Document({
    numbering: {
      config: [
        { levels: [{ alignment: AlignmentType.LEFT, format: LevelFormat.DECIMAL, level: 0, style: { paragraph: { indent: { hanging: 360, left: 720 } } }, text: "%1." }], reference: "chapter-list" },
        { levels: [{ alignment: AlignmentType.LEFT, format: LevelFormat.BULLET, level: 0, style: { paragraph: { indent: { hanging: 260, left: 540 }, spacing: { after: 80, line: 290 } } }, text: "•" }], reference: "warning-list" },
      ],
    },
    sections: [{
      children: body,
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ color: MUTED, size: 17, text: `Versão ${input.revision} · Revisar antes do uso · ${dateLabel} · Página ` }), new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 17 })],
        })] }),
      },
      properties: {
        page: {
          margin: { bottom: 1440, footer: 708, left: 1440, right: 1440, top: 1440 },
          size: { height: 15840, width: 12240 },
        },
      },
    }],
    styles: {
      default: { document: { run: { font: "Arial", size: 22 }, paragraph: { spacing: { after: 160, line: 300 } } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: NAVY, font: "Arial", size: 32 }, paragraph: { keepNext: true, outlineLevel: 0, spacing: { after: 160, before: 320 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: "2B5163", font: "Arial", size: 26 }, paragraph: { keepNext: true, outlineLevel: 1, spacing: { after: 120, before: 240 } } },
      ],
    },
  });

  return Packer.toBuffer(doc);
}

function imageParagraph(file: string, type: "png" | "jpg", width: number, height: number) {
  try {
    return new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type, data: readFileSync(path.join(process.cwd(), file)), transformation: { width: width * 4 / 3, height: height * 4 / 3 } })], spacing: { after: 240 } });
  } catch { return new Paragraph(""); }
}

/** Explicit line breaks preserve the author's paragraphs in Word as well as PDF. */
function literalRuns(text: string): TextRun[] {
  return text.split("\n").map((line, index) => new TextRun({ text: line, ...(index ? { break: 1 } : {}) }));
}

export async function createFinalMapDocxExport(input: FinalMapExportInput) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(input.exportedAt);
  const finalMap = input.finalMap;
  const product = getResearchProductGuidance(finalMap.workflow.content.discovery?.interpreted.researchType);
  const link = (text: string, url: string) => new ExternalHyperlink({ link: url, children: [new TextRun({ text, color: "176B4D", style: "Hyperlink" })] });
  const body: Paragraph[] = [
    imageParagraph("public/brand/mapa-da-pesquisa-wordmark.png", "png", 172, 47.34),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ bold: true, color: GOLD, size: 20, text: "MAPA DA PROPOSTA DE PESQUISA" })], spacing: { before: 300, after: 300 } }),
    new Paragraph({ style: "Title", alignment: AlignmentType.CENTER, children: [new TextRun({ bold: true, color: NAVY, size: 48, text: finalMapText(finalMap.title) })], spacing: { after: 240, line: 360 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ color: MUTED, italics: true, size: 22, text: product?.label ?? input.project.academic_level ?? "Pesquisa acadêmica" })], spacing: { after: 180 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, text: input.draft ? "Rascunho explicitamente identificado" : "Versão concluída", spacing: { after: 800 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, text: `Revisão ${input.revision} - Exportado em ${dateLabel}` }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [link("Mapa da Pesquisa · mapadapesquisa.com.br", "https://mapadapesquisa.com.br")] }),
  ];
  for (const block of buildFinalReport(input)) {
    switch (block.kind) {
      case "page": body.push(new Paragraph({ children: [new PageBreak()], spacing: { after: 0 } })); break;
      case "heading": body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: block.text })); break;
      case "subheading": body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: block.text })); break;
      case "paragraph": body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: literalRuns(block.text), indent: { firstLine: (block.indent ?? 0) * 20 }, spacing: { after: 140, line: 300 } })); break;
      case "original": body.push(new Paragraph({ children: literalRuns(block.text), spacing: { after: 220, line: 300 } })); break;
      case "link": body.push(new Paragraph({ children: [link(block.text, block.url)], spacing: { after: 180 } })); break;
      case "reference":
        body.push(new Paragraph({ children: [new TextRun({ bold: true, text: block.title, size: 19 })], keepNext: true, spacing: { after: 60 } }));
        body.push(new Paragraph({ children: [new TextRun({ text: block.details, color: MUTED, size: 17 })], keepNext: Boolean(block.url), spacing: { after: block.url ? 60 : 180 } }));
        if (block.url) body.push(new Paragraph({ children: [link(block.url, block.url)], spacing: { after: 180 } }));
        break;
      case "methodology":
        body.push(new Paragraph({ children: [new TextRun({ bold: true, text: block.title, color: NAVY, size: 22 })], keepNext: true, spacing: { before: 180, after: 100 } }));
        for (const [label, text] of [["Levantamento", block.collection], ["Análise/tratamento", block.analysis], ["Resultado esperado", block.result]]) {
          body.push(new Paragraph({ children: [new TextRun({ bold: true, text: `${label}: ` }), ...literalRuns(text)], spacing: { after: 100, line: 280 } }));
        }
        break;
    }
  }
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Registro e produção" }));
  body.push(simpleParagraph("Este mapa foi produzido pelo aplicativo Mapa da Pesquisa para apoiar a organização, a revisão e a discussão de uma proposta de pesquisa. Acesse o aplicativo em mapadapesquisa.com.br."));
  body.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [link("Abrir o Mapa da Pesquisa", "https://mapadapesquisa.com.br")], spacing: { after: 240 } }));
  body.push(new Paragraph({ alignment: AlignmentType.CENTER, text: "Este mapa está registrado na Câmara Brasileira do Livro (CBL), sob o ISBN 978-65-01-44943-2.", spacing: { after: 240 } }));
  body.push(imageParagraph("public/brand/cbl-isbn-barcode.jpeg", "jpg", 278.26, 210));
  body.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ color: MUTED, size: 17, text: "O número e a imagem de registro foram informados pelo responsável pelo aplicativo." })] }));
  return Packer.toBuffer(new Document({
    creator: "Mapa da Pesquisa", title: finalMapText(finalMap.title),
    sections: [{ children: body, properties: { page: { margin: { bottom: 1440, footer: 520, left: 1280, right: 1280, top: 1280 }, size: { height: 15840, width: 12240 } } }, footers: { default: new Footer({ children: [
      new Paragraph({ children: [link("Mapa da Pesquisa · mapadapesquisa.com.br", "https://mapadapesquisa.com.br")], spacing: { after: 60 } }),
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ color: MUTED, size: 15, text: `${input.draft ? "Rascunho" : "Versão concluída"} - ${dateLabel} - Página ` }), new TextRun({ children: [PageNumber.CURRENT], size: 15 }), new TextRun({ text: " de ", size: 15 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15 })] }),
    ] }) } }],
    styles: {
      default: { document: { run: { font: "Arial", size: 21, color: "1C2428" }, paragraph: { spacing: { after: 140, line: 300 } } } },
      paragraphStyles: [
        { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: NAVY, size: 48 } },
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: NAVY, size: 34 }, paragraph: { keepNext: true, outlineLevel: 0, spacing: { after: 180, before: 200 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: "2B5163", size: 25 }, paragraph: { keepNext: true, outlineLevel: 1, spacing: { after: 100, before: 180 } } },
      ],
    },
  }));
}
