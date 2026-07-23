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
  TextRun,
} from "docx";

import type { ExportDocumentInput } from "./types";

const NAVY = "203748";
const MUTED = "626B72";
const GOLD = "9A7418";
const RESEARCH_STARTER_URL = "https://research-starter-six.vercel.app";

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
