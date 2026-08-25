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
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

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

function cell(text: string, width: number, bold = false) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ bold, size: 18, text: text || "—" })], spacing: { after: 0, line: 260 } })],
    margins: { bottom: 120, left: 120, right: 120, top: 120 },
    width: { size: width, type: WidthType.PERCENTAGE },
  });
}

function finalMapText(element: { approvedContent: string | null; proposedContent: string } | null | undefined) {
  return element?.approvedContent?.trim() || element?.proposedContent.trim() || "Não informado.";
}

function referenceLabel(reference: FinalMapExportInput["finalMap"]["references"][number]) {
  const authors = reference.authors.length > 0 ? reference.authors.join(", ") : "Autoria não informada";
  return [authors, reference.year?.toString(), reference.doi ? `DOI: ${reference.doi}` : null].filter(Boolean).join(". ");
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

export async function createFinalMapDocxExport(input: FinalMapExportInput) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(input.exportedAt);
  const finalMap = input.finalMap;
  const warnings = finalMap.findings.filter((finding) => input.draft || finding.severity !== "blocking");
  const body: Array<Paragraph | Table> = [
    new Paragraph({ spacing: { before: 1200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ bold: true, color: GOLD, size: 20, text: "MAPA DA PROPOSTA DE PESQUISA" })],
      spacing: { after: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ bold: true, color: NAVY, size: 46, text: finalMapText(finalMap.title) })],
      spacing: { after: 160, line: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ color: MUTED, italics: true, size: 20, text: input.draft ? "Rascunho explicitamente identificado" : "Versão concluída" })],
      spacing: { after: 680 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ color: MUTED, size: 18, text: `Workflow v2 - Revisão ${input.revision} - Exportado em ${dateLabel}` })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Etapa 1. Problemática da pesquisa" }),
    simpleParagraph(finalMapText(finalMap.problemStatement)),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Etapa 2. Objetivo geral" }),
    simpleParagraph(finalMapText(finalMap.generalObjective)),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Etapa 3. Objetivos específicos" }),
    ...finalMap.specificObjectives.map((objective, index) => new Paragraph({
      children: [new TextRun({ bold: true, text: `${index + 1}. ` }), new TextRun(finalMapText(objective))],
      spacing: { after: 100, line: 300 },
    })),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Capítulo 3. Metodologia e resultados esperados" }),
    new Table({
      rows: [
        new TableRow({ children: [cell("Objetivo", 16, true), cell("Levantamento", 24, true), cell("Análise/tratamento", 26, true), cell("Resultado esperado", 34, true)] }),
        ...finalMap.methodologyRows.map((row, index) => {
          const objective = finalMap.specificObjectives.find((item) => item.id === row.objectiveId);
          return new TableRow({
            children: [
              cell(`OE${index + 1}. ${finalMapText(objective)}`, 16),
              cell(row.dataCollection, 24),
              cell(row.analysisTreatment, 26),
              cell(row.expectedResult, 34),
            ],
          });
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Etapa 4. Capítulo 2 - Revisão da Literatura" }),
    ...finalMap.literatureTopics.map((topic) => simpleParagraph(`${topic.label} ${topic.title}`)),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Etapa 5. Capítulo 4 - Desenvolvimento / Estudo de Caso / Análise e Discussão" }),
    ...finalMap.developmentTopics.map((topic) => simpleParagraph(`${topic.label} ${topic.title}`)),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Avisos e pendências de coerência" }),
    ...(warnings.length > 0 ? warnings.map((finding) => new Paragraph({
      children: [
        new TextRun({ bold: true, color: finding.severity === "blocking" ? "9B2F2A" : GOLD, text: `${finding.severity}: ` }),
        new TextRun(finding.message),
        ...(finding.resolution ? [new TextRun({ italics: true, text: ` Correção sugerida: ${finding.resolution}` })] : []),
      ],
      spacing: { after: 120, line: 300 },
    })) : [simpleParagraph("Nenhuma pendência registrada.")]),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Referências verificáveis" }),
    new Paragraph({
      children: [
        new TextRun({ color: MUTED, text: "Referências otimizadas com " }),
        new ExternalHyperlink({
          children: [new TextRun({ color: "176B4D", style: "Hyperlink", text: "Research Starter" })],
          link: RESEARCH_STARTER_URL,
        }),
        new TextRun({ color: MUTED, text: "." }),
      ],
      spacing: { after: 240 },
    }),
  ];

  for (const reference of finalMap.references) {
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
    body.push(new Paragraph({ children: [new TextRun({ color: MUTED, size: 18, text: referenceLabel(reference) })], spacing: { after: 140 } }));
  }

  const doc = new Document({
    sections: [{
      children: body,
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ color: MUTED, size: 17, text: `${input.draft ? "Rascunho" : "Versão concluída"} - Revisar antes do uso - ${dateLabel} - Página ` }), new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 17 })],
        })] }),
      },
      properties: {
        page: {
          margin: { bottom: 1440, footer: 708, left: 1080, right: 1080, top: 1080 },
          size: { height: 15840, width: 12240 },
        },
      },
    }],
    styles: {
      default: { document: { run: { font: "Arial", size: 21 }, paragraph: { spacing: { after: 160, line: 300 } } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: NAVY, font: "Arial", size: 30 }, paragraph: { keepNext: true, outlineLevel: 0, spacing: { after: 160, before: 300 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: "2B5163", font: "Arial", size: 24 }, paragraph: { keepNext: true, outlineLevel: 1, spacing: { after: 120, before: 220 } } },
      ],
    },
  });

  return Packer.toBuffer(doc);
}
