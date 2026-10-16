import type { FinalMapExportInput } from "./types";
import type { FinalMap } from "@/modules/research-workflow/final-map";
import { RESEARCH_INTAKE_FIELDS, currentResearchIntakeReview } from "@/modules/projects/research-intake";
import { buildReferenceCodeMap, literatureExpansionText, withCitationMarkers } from "@/modules/research-workflow/reference-citations";
import { getResearchProductGuidance } from "@/modules/research-workflow/research-level-guidance";
import { objectiveCoverageLabel } from "@/modules/research-workflow/chapter-validation";

export type ReportBlock =
  | { kind: "page" }
  | { kind: "heading" | "subheading" | "original"; text: string }
  | { kind: "paragraph"; text: string; indent?: number }
  | { kind: "link"; text: string; url: string }
  | { kind: "reference"; title: string; details: string; url: string | null }
  | { kind: "methodology"; title: string; collection: string; analysis: string; result: string };

export function finalMapText(element: { approvedContent: string | null; proposedContent: string } | null | undefined) {
  return element?.approvedContent?.trim() || element?.proposedContent.trim() || "Não informado.";
}

function finalMapTopicReferenceIds(input: FinalMapExportInput, topicIds: string[]) {
  const topics = [...input.finalMap.literatureTopics, ...input.finalMap.developmentTopics];
  return topics.filter((topic) => topicIds.includes(topic.id)).flatMap((topic) => topic.referenceIds);
}

function finalMapTopicCoverage(input: FinalMapExportInput, topic: FinalMap["literatureTopics"][number]) {
  return topic.objectiveCoverage.map((coverage) => {
    const specificIndex = input.finalMap.specificObjectives.findIndex((objective) => objective.id === coverage.objectiveId);
    const label = coverage.objectiveId === input.finalMap.generalObjective?.id ? "OEG" : specificIndex >= 0 ? `OE${specificIndex + 1}` : "objetivo";
    return `${label} — ${objectiveCoverageLabel(coverage.degree)}`;
  }).join("; ");
}


/** One source of academic content for both formats; rendering never calls AI. */
export function buildFinalReport(input: FinalMapExportInput): ReportBlock[] {
  const finalMap = input.finalMap;
  const referenceCodes = buildReferenceCodeMap(finalMap.references);
  const productGuidance = getResearchProductGuidance(finalMap.workflow.content.discovery?.interpreted.researchType);
  const methodologyClassification = finalMap.workflow.content.methodologyClassification;
  const blocks: ReportBlock[] = [];
  const page = () => blocks.push({ kind: "page" });
  const heading = (text: string) => blocks.push({ kind: "heading", text });
  const subheading = (text: string) => blocks.push({ kind: "subheading", text });
  const paragraph = (text: string, options: { indent?: number } = {}) => blocks.push({ kind: "paragraph", text, ...options });
  page();
  heading( "1 INTRODUÇÃO");
  subheading( "1.1 Contextualização da pesquisa");
  const context = finalMap.candidate?.context?.trim() || `Tema: ${input.project.theme}. Área do conhecimento: ${input.project.knowledge_area || "não informada"}.`;
  paragraph( withCitationMarkers(context, finalMap.candidate?.referenceIds ?? [], referenceCodes));
  subheading( "1.2 Formulação da situação-problema");
  paragraph( withCitationMarkers(finalMapText(finalMap.problemStatement), finalMap.problemStatement?.referenceIds ?? [], referenceCodes));
  subheading( "1.3 Objetivos da pesquisa");
  subheading( "1.3.1 Objetivo geral");
  paragraph( withCitationMarkers(finalMapText(finalMap.generalObjective), finalMap.generalObjective?.referenceIds ?? [], referenceCodes), { indent: 12 });
  subheading( "1.3.2 Objetivos específicos");
  finalMap.specificObjectives.forEach((objective, index) => paragraph( `${index + 1}. ${withCitationMarkers(finalMapText(objective), objective.referenceIds, referenceCodes)}`, { indent: 24 }));
  if (productGuidance) {
    subheading( "1.4 Escopo do produto acadêmico");
    paragraph( productGuidance.shortDescription);
    const productDimensions = [
      ["Finalidade", productGuidance.dimensions.finalidade],
      ["Problema e lacuna", `${productGuidance.dimensions.problema} ${productGuidance.dimensions.lacuna}`],
      ["Literatura", productGuidance.dimensions.literatura],
      ["Metodologia", productGuidance.dimensions.metodologia],
      ["Contribuição", productGuidance.dimensions.contribuicao],
    ] as const;
    productDimensions.forEach(([label, value]) => paragraph( `${label}: ${value}`, { indent: 12 }));
  }

  page();
  heading( "2 REVISÃO DA LITERATURA");
  if (finalMap.literatureTopics.length === 0) {
    paragraph( "Nenhum tópico de revisão foi consolidado.");
  }
  finalMap.literatureTopics.forEach((topic) => {
    subheading( `${topic.label} ${topic.title}`);
    if (topic.objectiveCoverage.length > 0) paragraph( `Cobertura dos objetivos: ${finalMapTopicCoverage(input, topic)}.`, { indent: 12 });
    paragraph( withCitationMarkers(literatureExpansionText(topic.title, topic.referenceIds, referenceCodes), topic.referenceIds, referenceCodes), { indent: 12 });
  });

  page();
  heading( "3 METODOLOGIA DA PESQUISA");
  if (methodologyClassification) {
    subheading( "3.1 Classificação metodológica");
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
      paragraph( `${label}: ${Array.isArray(value) ? value.join(", ") : value}`, { indent: 12 });
    }
  }
  subheading( "3.2 Levantamento, análise e resultados esperados por objetivo");
  for (const [index, row] of finalMap.methodologyRows.entries()) {
    const objective = finalMap.specificObjectives.find((item) => item.id === row.objectiveId);
    const specificIndex = finalMap.specificObjectives.findIndex((item) => item.id === row.objectiveId);
    const objectiveLabel = row.objectiveId === finalMap.generalObjective?.id ? "OEG" : `OE${specificIndex >= 0 ? specificIndex + 1 : index + 1}`;
    blocks.push({ kind: "methodology", title: `${objectiveLabel}: ${finalMapText(objective ?? finalMap.generalObjective)}`, collection: row.dataCollection, analysis: row.analysisTreatment, result: withCitationMarkers(row.expectedResult, finalMapTopicReferenceIds(input, row.associatedTopicIds), referenceCodes) });
  }

  page();
  heading( "4 ESTUDO DE CASO / ANÁLISE E DISCUSSÃO DOS RESULTADOS");
  if (finalMap.developmentTopics.length === 0) {
    paragraph( "Nenhum tópico de desenvolvimento foi consolidado.");
  }
  finalMap.developmentTopics.forEach((topic, index) => {
    const heading = index === 0 ? `${topic.label} Apresentação do estudo de caso` : `${topic.label} ${topic.title}`;
    subheading( heading);
    if (topic.objectiveCoverage.length > 0) paragraph( `Cobertura dos objetivos: ${finalMapTopicCoverage(input, topic)}.`, { indent: 12 });
    paragraph( withCitationMarkers(topic.title, topic.referenceIds, referenceCodes), { indent: 12 });
  });

  page();
  heading( "5 CONCLUSÃO E RECOMENDAÇÕES PARA FUTURAS PESQUISAS");
  paragraph( "Esta seção registra a síntese esperada da proposta. Ela não representa resultados empíricos já obtidos: a conclusão definitiva dependerá da execução do método, da análise dos dados e da discussão com a literatura.");
  const expectedResults = finalMap.methodologyRows.map((row) => row.expectedResult.trim()).filter(Boolean);
  if (expectedResults.length > 0) {
    subheading( "5.1 Síntese dos resultados esperados");
    expectedResults.forEach((result, index) => paragraph( `${index + 1}. ${result}`, { indent: 14 }));
  }
  subheading( "5.2 Recomendações para futuras pesquisas");
  [
    "Confrontar os resultados obtidos com as referências verificáveis e explicitar convergências, divergências e limites.",
    "Aprofundar a revisão da literatura quando novas evidências, recortes ou debates relevantes forem identificados.",
    "Registrar limitações, decisões metodológicas e possibilidades de replicação ou extensão do estudo.",
  ].forEach((recommendation) => paragraph( `- ${withCitationMarkers(recommendation, finalMap.references.map((reference) => reference.referenceId), referenceCodes)}`, { indent: 12 }));

  subheading( "5.3 Impactos potenciais");
  paragraph( withCitationMarkers(
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
  ].forEach(([label, description]) => paragraph( `- ${label}: ${description}`, { indent: 12 }));

  subheading( "5.4 Oportunidades derivadas da literatura");
  const literatureTitles = finalMap.literatureTopics.map((topic) => topic.title.trim()).filter(Boolean);
  const literatureReferenceIds = finalMap.literatureTopics.flatMap((topic) => topic.referenceIds);
  paragraph( withCitationMarkers(
    literatureTitles.length > 0
      ? `A revisão consolidada indica oportunidades de aprofundamento nos seguintes recortes: ${literatureTitles.join("; ")}. Essas oportunidades devem ser confrontadas com as lacunas, limites e divergências identificados nas fontes antes de orientar novas pesquisas.`
      : "A revisão ainda não contém tópicos suficientes para indicar oportunidades específicas; amplie a busca bibliográfica antes de formular uma agenda futura.",
    literatureReferenceIds,
    referenceCodes,
  ));

  subheading( "Revisão antes do uso");
  const warnings = finalMap.findings.filter((finding) => input.draft || finding.severity !== "blocking");
  if (warnings.length === 0) {
    paragraph( "Nenhuma pendência registrada.");
  } else {
    for (const finding of warnings) {
      paragraph( `- ${finding.severity}: ${finding.message}${finding.resolution ? ` Correção sugerida: ${finding.resolution}` : ""}`);
    }
  }

  page();
  heading( "REFERÊNCIAS");
  blocks.push({ kind: "link", text: "Referências otimizadas com Research Starter.", url: "https://researchstarter.vercel.app" });
  for (const reference of finalMap.references) {
    const authors = reference.authors.length > 0 ? reference.authors.join(", ") : "Autoria não informada";
    const code = referenceCodes.get(reference.referenceId) ?? reference.referenceId;
    blocks.push({ kind: "reference", title: `${code}. ${reference.title ?? "Título não informado"}`, details: [authors, reference.year, reference.doi ? `DOI: ${reference.doi}` : null].filter(Boolean).join(". "), url: reference.url });
  }

  const briefing = finalMap.workflow.content.initialBriefing;
  if (briefing) {
    page();
    heading( "APÊNDICE — RESPOSTAS INICIAIS DO MAPA AVANÇADO");
    paragraph( "Cada quadro conserva o texto original do autor e apresenta uma reformulação do Mapa da Pesquisa para revisão. A reformulação organiza a redação; não substitui o original nem constitui validação do orientador.");
    const initialProduct = getResearchProductGuidance(briefing.researchType);
    if (initialProduct) paragraph( `Produto acadêmico escolhido: ${initialProduct.label}.`);
    const review = currentResearchIntakeReview(finalMap.workflow.content);
    for (const [index, field] of RESEARCH_INTAKE_FIELDS.entries()) {

      subheading( `${index + 1}. ${field.label}`);
      subheading("Texto original:");
      blocks.push({ kind: "original", text: briefing[field.name] });
      subheading("Texto Mapa da Pesquisa:");
      paragraph(review?.[field.name] ?? "Reformulação ainda não preparada. O texto original permanece preservado.");
    }
  }

  return blocks;
}
