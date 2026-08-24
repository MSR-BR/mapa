import PDFDocument from "pdfkit";
import path from "node:path";

import type { ExportDocumentInput, FinalMapExportInput } from "./types";
import {
  buildReferenceCodeMap,
  citationMarkers,
  literatureExpansionText,
  withCitationMarkers,
} from "@/modules/research-workflow/reference-citations";
import { getResearchProductGuidance } from "@/modules/research-workflow/research-level-guidance";

const COLORS = { gold: "#9A7418", muted: "#626B72", navy: "#203748", text: "#1C2428" };
const RESEARCH_STARTER_URL = "https://research-starter-six.vercel.app";
const APP_URL = "https://mapadapesquisa.com.br";
const BRAND_WORDMARK_PATH = path.join(process.cwd(), "public/brand/mapa-da-pesquisa-wordmark.png");
const CBL_BARCODE_PATH = path.join(process.cwd(), "public/brand/cbl-isbn-barcode.jpeg");
const CBL_ISBN = "978-65-01-44943-2";

function addAppAttribution(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.fillColor("#176B4D").font("Helvetica").fontSize(7.5).text("Mapa da Pesquisa · mapadapesquisa.com.br", x, y, { link: APP_URL, underline: true });
}

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
  addAppAttribution(doc, 72, doc.y + 14);

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
    addAppAttribution(doc, 72, doc.page.height - 48);
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(7.5).text(
      `Versão ${input.revision} · Revisar antes do uso · ${dateLabel} · Página ${index + 1} de ${range.count}`,
      72,
      doc.page.height - 36,
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

function addFinalMapSubheading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 42);
  doc.moveDown(0.35);
  doc.fillColor("#2B5163").font("Helvetica-Bold").fontSize(12.5).text(title, { lineGap: 3 });
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
  doc.fillColor("#176B4D").font("Helvetica-Bold").fontSize(10).text("Abrir o Mapa da Pesquisa", { link: APP_URL, underline: true, align: "center" });
  doc.moveDown(1.1);
  doc.fillColor(COLORS.text).font("Helvetica").fontSize(10).text(`Este mapa está registrado na Câmara Brasileira do Livro (CBL), sob o ISBN ${CBL_ISBN}.`, { align: "center" });
  doc.moveDown(0.6);
  try {
    const width = Math.min(430, doc.page.width - doc.page.margins.left - doc.page.margins.right);
    const imageY = doc.y;
    doc.image(CBL_BARCODE_PATH, (doc.page.width - width) / 2, imageY, { fit: [width, 210], align: "center", valign: "center" });
    doc.y = imageY + 224;
  } catch {
    doc.fillColor(COLORS.muted).font("Helvetica-Oblique").fontSize(9).text("Código de barras CBL não disponível nesta implantação.", { align: "center" });
  }
  doc.moveDown(0.4);
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8.5).text("O número e a imagem de registro foram informados pelo responsável pelo aplicativo.", { align: "center" });
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
  const productGuidance = getResearchProductGuidance(finalMap.workflow.content.discovery?.interpreted.researchType);
  const methodologyClassification = finalMap.workflow.content.methodologyClassification;
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

  addBrandWordmark(doc);
  doc.y = 112;
  doc.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(10).text("MAPA DA PROPOSTA DE PESQUISA", { align: "center", characterSpacing: 1.5 });
  doc.moveDown(1.5);
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(24).text(finalMapText(finalMap.title), { align: "center", lineGap: 6 });
  doc.moveDown(1);
  doc.fillColor(COLORS.muted).font("Helvetica-Oblique").fontSize(11).text(productGuidance?.label ?? input.project.academic_level ?? "Pesquisa acadêmica", { align: "center" });
  doc.moveDown(0.6);
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9.5).text(input.draft ? "Rascunho explicitamente identificado" : "Versão concluída", { align: "center" });
  doc.moveDown(4);
  doc.font("Helvetica").fontSize(9.5).text(`Revisão ${input.revision} - Exportado em ${dateLabel}`, { align: "center" });
  addAppAttribution(doc, 64, doc.y + 14);

  doc.addPage();
  addFinalMapHeading(doc, "1 INTRODUÇÃO");
  addFinalMapSubheading(doc, "1.1 Contextualização da pesquisa");
  const context = finalMap.candidate?.context?.trim() || `Tema: ${input.project.theme}. Área do conhecimento: ${input.project.knowledge_area || "não informada"}.`;
  addWrappedParagraph(doc, withCitationMarkers(context, finalMap.candidate?.referenceIds ?? [], referenceCodes));
  addFinalMapSubheading(doc, "1.2 Formulação da situação-problema");
  addWrappedParagraph(doc, withCitationMarkers(finalMapText(finalMap.problemStatement), finalMap.problemStatement?.referenceIds ?? [], referenceCodes));
  addFinalMapSubheading(doc, "1.3 Objetivos da pesquisa");
  addFinalMapSubheading(doc, "1.3.1 Objetivo geral");
  addWrappedParagraph(doc, withCitationMarkers(finalMapText(finalMap.generalObjective), finalMap.generalObjective?.referenceIds ?? [], referenceCodes), { indent: 12 });
  addFinalMapSubheading(doc, "1.3.2 Objetivos específicos");
  finalMap.specificObjectives.forEach((objective, index) => addWrappedParagraph(doc, `${index + 1}. ${withCitationMarkers(finalMapText(objective), objective.referenceIds, referenceCodes)}`, { indent: 24 }));
  if (productGuidance) {
    addFinalMapSubheading(doc, "1.4 Escopo do produto acadêmico");
    addWrappedParagraph(doc, productGuidance.shortDescription);
    const productDimensions = [
      ["Finalidade", productGuidance.dimensions.finalidade],
      ["Problema e lacuna", `${productGuidance.dimensions.problema} ${productGuidance.dimensions.lacuna}`],
      ["Literatura", productGuidance.dimensions.literatura],
      ["Metodologia", productGuidance.dimensions.metodologia],
      ["Contribuição", productGuidance.dimensions.contribuicao],
    ] as const;
    productDimensions.forEach(([label, value]) => addWrappedParagraph(doc, `${label}: ${value}`, { indent: 12 }));
  }

  doc.addPage();
  addFinalMapHeading(doc, "2 REVISÃO DA LITERATURA");
  if (finalMap.literatureTopics.length === 0) {
    addWrappedParagraph(doc, "Nenhum tópico de revisão foi consolidado.");
  }
  finalMap.literatureTopics.forEach((topic) => {
    addFinalMapSubheading(doc, `${topic.label} ${topic.title}`);
    addWrappedParagraph(doc, withCitationMarkers(literatureExpansionText(topic.title, topic.referenceIds, referenceCodes), topic.referenceIds, referenceCodes), { indent: 12 });
  });

  doc.addPage();
  addFinalMapHeading(doc, "3 METODOLOGIA DA PESQUISA");
  if (methodologyClassification) {
    addFinalMapSubheading(doc, "3.1 Classificação metodológica");
    const classificationLines = [
      ["Natureza", methodologyClassification.nature],
      ["Abordagem", methodologyClassification.approach],
      ["Objetivos metodológicos", methodologyClassification.objectives.join(", ")],
      ["Procedimentos", methodologyClassification.procedures.join(", ")],
      ["Instrumentos", methodologyClassification.instruments],
      ["Técnicas de análise", methodologyClassification.analysisTechniques],
      ["Justificativa", methodologyClassification.rationale],
      ["Avisos éticos ou de acesso", methodologyClassification.ethicsWarnings],
    ];
    for (const [label, value] of classificationLines) {
      if (!value) continue;
      addWrappedParagraph(doc, `${label}: ${Array.isArray(value) ? value.join(", ") : value}`, { indent: 12 });
    }
  }
  addFinalMapSubheading(doc, "3.2 Levantamento, análise e resultados esperados por objetivo");
  for (const [index, row] of finalMap.methodologyRows.entries()) {
    ensureSpace(doc, 155);
    const objective = finalMap.specificObjectives.find((item) => item.id === row.objectiveId);
    const specificIndex = finalMap.specificObjectives.findIndex((item) => item.id === row.objectiveId);
    const objectiveLabel = row.objectiveId === finalMap.generalObjective?.id ? "OEG" : `OE${specificIndex >= 0 ? specificIndex + 1 : index + 1}`;
    doc.roundedRect(doc.x, doc.y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 1, 1).fill("#DDE9E3");
    doc.moveDown(0.55);
    doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(11).text(`${objectiveLabel}: ${finalMapText(objective ?? finalMap.generalObjective)}`, { lineGap: 3 });
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
  addFinalMapHeading(doc, "4 ESTUDO DE CASO / ANÁLISE E DISCUSSÃO DOS RESULTADOS");
  if (finalMap.developmentTopics.length === 0) {
    addWrappedParagraph(doc, "Nenhum tópico de desenvolvimento foi consolidado.");
  }
  finalMap.developmentTopics.forEach((topic, index) => {
    const heading = index === 0 ? `${topic.label} Apresentação do estudo de caso` : `${topic.label} ${topic.title}`;
    addFinalMapSubheading(doc, heading);
    addWrappedParagraph(doc, withCitationMarkers(topic.title, topic.referenceIds, referenceCodes), { indent: 12 });
  });

  doc.addPage();
  addFinalMapHeading(doc, "5 CONCLUSÃO E RECOMENDAÇÕES PARA FUTURAS PESQUISAS");
  addWrappedParagraph(doc, "Esta seção registra a síntese esperada da proposta. Ela não representa resultados empíricos já obtidos: a conclusão definitiva dependerá da execução do método, da análise dos dados e da discussão com a literatura.");
  const expectedResults = finalMap.methodologyRows.map((row) => row.expectedResult.trim()).filter(Boolean);
  if (expectedResults.length > 0) {
    addFinalMapSubheading(doc, "5.1 Síntese dos resultados esperados");
    expectedResults.forEach((result, index) => addWrappedParagraph(doc, `${index + 1}. ${result}`, { indent: 14 }));
  }
  addFinalMapSubheading(doc, "5.2 Recomendações para futuras pesquisas");
  [
    "Confrontar os resultados obtidos com as referências verificáveis e explicitar convergências, divergências e limites.",
    "Aprofundar a revisão da literatura quando novas evidências, recortes ou debates relevantes forem identificados.",
    "Registrar limitações, decisões metodológicas e possibilidades de replicação ou extensão do estudo.",
  ].forEach((recommendation) => addWrappedParagraph(doc, `- ${withCitationMarkers(recommendation, finalMap.references.map((reference) => reference.referenceId), referenceCodes)}`, { indent: 12 }));

  addFinalMapSubheading(doc, "5.3 Impactos potenciais");
  addWrappedParagraph(doc, withCitationMarkers(
    `Os impactos abaixo são possibilidades a serem verificadas durante a pesquisa e devem ser relacionados ao tema "${input.project.theme}", à problemática formulada e ao objetivo geral validado.`,
    [...(finalMap.candidate?.referenceIds ?? []), ...(finalMap.generalObjective?.referenceIds ?? [])],
    referenceCodes,
  ));
  [
    ["Científico", "avanço conceitual, empírico ou metodológico para a área."],
    ["Tecnológico", "desenvolvimento, aperfeiçoamento ou aplicação de métodos, materiais, sistemas ou ferramentas, quando aplicável."],
    ["Educacional", "contribuições para ensino, aprendizagem, formação ou práticas pedagógicas, quando aplicável."],
    ["Social", "efeitos para grupos, comunidades, saúde, inclusão, sustentabilidade ou bem-estar, quando aplicável."],
    ["Institucional", "subsídios para políticas, gestão, organizações ou tomada de decisão, quando aplicável."],
    ["Econômico", "possíveis efeitos sobre eficiência, custos, inovação, produtividade ou desenvolvimento, quando aplicável."],
  ].forEach(([label, description]) => addWrappedParagraph(doc, `- ${label}: ${description}`, { indent: 12 }));

  addFinalMapSubheading(doc, "5.4 Oportunidades derivadas da literatura");
  const literatureTitles = finalMap.literatureTopics.map((topic) => topic.title.trim()).filter(Boolean);
  const literatureReferenceIds = finalMap.literatureTopics.flatMap((topic) => topic.referenceIds);
  addWrappedParagraph(doc, withCitationMarkers(
    literatureTitles.length > 0
      ? `A revisão consolidada indica oportunidades de aprofundamento nos seguintes recortes: ${literatureTitles.join("; ")}. Essas oportunidades devem ser confrontadas com as lacunas, limites e divergências identificados nas fontes antes de orientar novas pesquisas.`
      : "A revisão ainda não contém tópicos suficientes para indicar oportunidades específicas; amplie a busca bibliográfica antes de formular uma agenda futura.",
    literatureReferenceIds,
    referenceCodes,
  ));

  addFinalMapSubheading(doc, "Revisão antes do uso");
  const warnings = finalMap.findings.filter((finding) => input.draft || finding.severity !== "blocking");
  if (warnings.length === 0) {
    addWrappedParagraph(doc, "Nenhuma pendência registrada.");
  } else {
    for (const finding of warnings) {
      addWrappedParagraph(doc, `- ${finding.severity}: ${finding.message}${finding.resolution ? ` Correção sugerida: ${finding.resolution}` : ""}`);
    }
  }

  doc.addPage();
  addFinalMapHeading(doc, "REFERÊNCIAS");
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

  addCblRegistrationPage(doc);

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.page.margins.bottom = 0;
    addAppAttribution(doc, 64, doc.page.height - 44);
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(7.5).text(
      `${input.draft ? "Rascunho" : "Versão concluída"} - ${dateLabel} - Página ${index + 1} de ${range.count}`,
      64,
      doc.page.height - 32,
      { align: "right", lineBreak: false, width: doc.page.width - 128 },
    );
  }

  doc.end();
  return completed;
}
