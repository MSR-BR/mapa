import {
  validateChapterTopics,
  validateCompleteObjectiveCoverage,
  type ChapterTopicInput,
} from "./chapter-validation";
import {
  validateGeneralObjective,
  validateProblemStatement,
  validateSpecificObjectives,
} from "./definition-validation";
import {
  methodologyPlanInputSchema,
  validateMethodologyPlan,
} from "./methodology-validation";
import {
  type CoherenceFinding,
  type DiscoveryReference,
  type ProblemCandidate,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type ValidatedElement,
} from "./schema";

export type FinalMapTopic = ChapterTopicInput & {
  chapter: "literature" | "development";
  label: string;
};

export type FinalMapNodeKind =
  | "prompt"
  | "proposal"
  | "problem"
  | "general"
  | "specific"
  | "literature"
  | "development"
  | "methodology"
  | "title"
  | "reference";

export type FinalMapNode = {
  content: string;
  correctionStep: "discovery" | "problem" | "general" | "specifics" | "literature" | "development" | "methodology" | null;
  id: string;
  kind: FinalMapNodeKind;
  label: string;
  title: string;
};

export type FinalMapEdge = {
  from: string;
  label: string;
  to: string;
};

export type FinalMap = {
  candidate: ProblemCandidate | null;
  developmentTopics: FinalMapTopic[];
  edges: FinalMapEdge[];
  findings: CoherenceFinding[];
  generalObjective: ValidatedElement | null;
  graphIssues: string[];
  literatureTopics: FinalMapTopic[];
  methodologyRows: ResearchWorkflowContent["methodologyRows"];
  nodes: FinalMapNode[];
  problemStatement: ValidatedElement | null;
  references: DiscoveryReference[];
  specificObjectives: ValidatedElement[];
  title: ValidatedElement | null;
  workflow: ResearchWorkflow;
};

function element(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.find((item) => item.type === type);
}

function elements(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.filter((item) => item.type === type);
}

function approved(elementValue: ValidatedElement | null | undefined) {
  return elementValue?.approvedContent?.trim() ?? "";
}

function uniqueReferences(references: DiscoveryReference[]) {
  return references.filter((reference, index, all) => (
    all.findIndex((item) => item.referenceId === reference.referenceId) === index
  ));
}

export function topicsFromContent(content: ResearchWorkflowContent, chapter: "literature" | "development"): FinalMapTopic[] {
  const type = chapter === "literature" ? "literature_topic" : "development_topic";
  const topicElements = new Map(elements(content, type).map((item) => [item.id, item]));
  return content.chapterTopicDetails
    .filter((detail) => detail.chapter === chapter)
    .toSorted((left, right) => left.order - right.order)
    .flatMap((detail): FinalMapTopic[] => {
      const topic = topicElements.get(detail.topicId);
      if (!topic) return [];
      return [{
        chapter,
        exceptionJustification: detail.exceptionJustification,
        generalObjectiveAligned: detail.generalObjectiveAligned,
        id: topic.id,
        label: chapter === "literature" ? `2.${detail.order}` : `4.${detail.order}`,
        objectiveCoverage: detail.objectiveCoverage,
        referenceIds: topic.referenceIds,
        title: topic.approvedContent ?? topic.proposedContent,
      }];
    });
}

function node(
  id: string,
  kind: FinalMapNodeKind,
  label: string,
  title: string,
  content: string,
  correctionStep: FinalMapNode["correctionStep"],
): FinalMapNode {
  return { content, correctionStep, id, kind, label, title };
}

function referenceLabel(reference: DiscoveryReference) {
  const author = reference.authors[0] ?? "Fonte";
  return reference.year ? `${author}, ${reference.year}` : author;
}

function selectedReferenceIds(content: ResearchWorkflowContent, candidate: ProblemCandidate | null) {
  return new Set([
    ...(candidate?.referenceIds ?? []),
    ...content.elements.flatMap((item) => item.referenceIds),
  ]);
}

function makeFinding(
  message: string,
  options: {
    elementIds: string[];
    resolution: string | null;
    rule: string;
    severity: CoherenceFinding["severity"];
  },
): CoherenceFinding {
  return {
    elementIds: options.elementIds.length > 0 ? options.elementIds.slice(0, 12) : [crypto.randomUUID()],
    id: crypto.randomUUID(),
    message,
    resolution: options.resolution,
    rule: options.rule,
    severity: options.severity,
  };
}

function normalized(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function mentionsAny(value: string, terms: string[]) {
  const text = normalized(value);
  return terms.some((term) => term.length > 5 && text.includes(normalized(term)));
}

function hasCycle(nodes: Set<string>, edges: FinalMapEdge[]) {
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) continue;
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const next of outgoing.get(id) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return [...nodes].some((id) => visit(id));
}

function graphIssues(nodes: FinalMapNode[], edges: FinalMapEdge[]) {
  const nodeIds = new Set(nodes.map((item) => item.id));
  const issues: string[] = [];
  const orphanEdges = edges.filter((edge) => !nodeIds.has(edge.from) || !nodeIds.has(edge.to));
  if (orphanEdges.length > 0) issues.push("Existem relações de rastreabilidade com origem ou destino inexistente.");
  if (hasCycle(nodeIds, edges)) issues.push("O grafo de rastreabilidade contém ciclo indevido.");
  return issues;
}

function traceEdges(content: ResearchWorkflowContent): FinalMapEdge[] {
  return content.traceLinks.map((link) => ({
    from: link.fromElementId,
    label: link.rule,
    to: link.toElementId,
  }));
}

function referenceEdges(references: DiscoveryReference[], content: ResearchWorkflowContent, candidate: ProblemCandidate | null): FinalMapEdge[] {
  const referenceIds = new Set(references.map((reference) => reference.referenceId));
  const edges: FinalMapEdge[] = [];
  if (candidate) {
    for (const referenceId of candidate.referenceIds) {
      if (referenceIds.has(referenceId)) edges.push({ from: `reference:${referenceId}`, label: "sustenta proposta", to: candidate.id });
    }
  }
  for (const item of content.elements) {
    for (const referenceId of item.referenceIds) {
      if (referenceIds.has(referenceId)) edges.push({ from: `reference:${referenceId}`, label: "evidência verificável", to: item.id });
    }
  }
  return edges;
}

function deterministicFindings(
  workflow: ResearchWorkflow,
  context: {
    candidate: ProblemCandidate | null;
    developmentTopics: FinalMapTopic[];
    literatureTopics: FinalMapTopic[];
    references: DiscoveryReference[];
    title: ValidatedElement | null;
  },
) {
  const findings: CoherenceFinding[] = [];
  const content = workflow.content;
  const problem = element(content, "problem_statement");
  const general = element(content, "general_objective");
  const specifics = elements(content, "specific_objective").filter((item) => item.status === "validated");
  const allowedObjectiveIds = new Set(specifics.map((item) => item.id));
  const allowedReferenceIds = new Set(context.references.map((reference) => reference.referenceId));
  const topicIds = new Set([...context.literatureTopics, ...context.developmentTopics].map((topic) => topic.id));
  const problemText = approved(problem);
  const generalText = approved(general);

  if (!context.candidate) {
    findings.push(makeFinding("A proposta escolhida não foi encontrada.", {
      elementIds: [workflow.projectId],
      resolution: "Volte à descoberta e escolha uma proposta.",
      rule: "Change 014: proposta escolhida",
      severity: "blocking",
    }));
  }
  if (!problemText || !problem || problem.status !== "validated") {
    findings.push(makeFinding("A problemática da pesquisa ainda não está validada.", {
      elementIds: [problem?.id ?? workflow.projectId],
      resolution: "Volte à Etapa 1 e valide a problemática.",
      rule: "Change 014: problemática validada",
      severity: "blocking",
    }));
  } else {
    findings.push(...validateProblemStatement(problemText).map((message) => makeFinding(message, {
      elementIds: [problem.id],
      resolution: "Corrija a formulação da problemática na Etapa 1.",
      rule: "Change 014: problemática",
      severity: "blocking",
    })));
  }

  if (!generalText || !general || general.status !== "validated") {
    findings.push(makeFinding("O objetivo geral ainda não está validado.", {
      elementIds: [general?.id ?? workflow.projectId],
      resolution: "Volte à Etapa 2 e valide o objetivo geral.",
      rule: "Change 014: objetivo geral validado",
      severity: "blocking",
    }));
  } else if (problemText) {
    findings.push(...validateGeneralObjective(generalText, problemText).map((message) => makeFinding(message, {
      elementIds: [general.id],
      resolution: "Corrija o objetivo geral na Etapa 2.",
      rule: "Change 014: objetivo geral",
      severity: "blocking",
    })));
  }

  findings.push(...validateSpecificObjectives(
    specifics.map((objective) => ({ content: approved(objective), id: objective.id })),
    generalText,
  ).map((message) => makeFinding(message, {
    elementIds: specifics.map((item) => item.id),
    resolution: "Volte à Etapa 3 e ajuste os objetivos específicos.",
    rule: "Change 014: objetivos específicos",
    severity: "blocking",
  })));

  const chapterOptions = { allowedObjectiveIds, allowedReferenceIds };
  findings.push(...validateChapterTopics(context.literatureTopics, { ...chapterOptions, chapter: "literature" }).map((message) => makeFinding(message, {
    elementIds: context.literatureTopics.map((topic) => topic.id),
    resolution: "Volte ao Capítulo 2 e ajuste a cobertura ou as referências.",
    rule: "Change 014: capítulo 2",
    severity: "blocking",
  })));
  findings.push(...validateChapterTopics(context.developmentTopics, { ...chapterOptions, chapter: "development" }).map((message) => makeFinding(message, {
    elementIds: context.developmentTopics.map((topic) => topic.id),
    resolution: "Volte ao Capítulo 4 e ajuste a cobertura ou o alinhamento.",
    rule: "Change 014: capítulo 4",
    severity: "blocking",
  })));
  findings.push(...validateCompleteObjectiveCoverage(context.literatureTopics, context.developmentTopics, [...allowedObjectiveIds]).map((message) => makeFinding(message, {
    elementIds: specifics.map((item) => item.id),
    resolution: "Relacione o objetivo a ao menos um tópico dos Capítulos 2 ou 4.",
    rule: "Change 014: cobertura de objetivos",
    severity: "blocking",
  })));

  if (!content.methodologyClassification || content.methodologyRows.length === 0 || !context.title) {
    findings.push(makeFinding("A matriz metodológica ou o título final não foram consolidados.", {
      elementIds: [context.title?.id ?? workflow.projectId],
      resolution: "Volte à Etapa 6 e valide a metodologia.",
      rule: "Change 014: metodologia consolidada",
      severity: "blocking",
    }));
  } else {
    const plan = methodologyPlanInputSchema.safeParse({
      classification: {
        analysisTechniques: content.methodologyClassification.analysisTechniques,
        approach: content.methodologyClassification.approach,
        ethicsWarnings: content.methodologyClassification.ethicsWarnings,
        instruments: content.methodologyClassification.instruments,
        nature: content.methodologyClassification.nature,
        objectives: content.methodologyClassification.objectives,
        procedures: content.methodologyClassification.procedures,
        rationale: content.methodologyClassification.rationale,
      },
      rows: content.methodologyRows.map((row) => ({
        analysisTreatment: row.analysisTreatment,
        associatedTopicIds: row.associatedTopicIds,
        dataCollection: row.dataCollection,
        expectedResult: row.expectedResult,
        id: row.id,
        objectiveId: row.objectiveId,
        warnings: row.warnings,
      })),
      title: approved(context.title),
    });
    if (!plan.success) {
      findings.push(makeFinding("A matriz metodológica está incompleta.", {
        elementIds: content.methodologyRows.map((row) => row.id),
        resolution: "Volte à Etapa 6 e complete as células pendentes.",
        rule: "Change 014: matriz metodológica",
        severity: "blocking",
      }));
    } else {
      const methodology = validateMethodologyPlan(plan.data, {
        allowedObjectiveIds,
        allowedTopicIds: topicIds,
        generalObjective: generalText,
      });
      findings.push(...methodology.errors.map((message) => makeFinding(message, {
        elementIds: content.methodologyRows.map((row) => row.id),
        resolution: "Volte à Etapa 6 e ajuste a matriz metodológica.",
        rule: "Change 014: matriz metodológica",
        severity: "blocking",
      })));
      findings.push(...methodology.warnings.map((message) => makeFinding(message, {
        elementIds: content.methodologyRows.map((row) => row.id),
        resolution: "Confirme a combinação metodológica ou ajuste a célula correspondente.",
        rule: "Change 014: compatibilidade metodológica",
        severity: "warning",
      })));
    }
  }

  if (context.title && generalText && !mentionsAny(approved(context.title), generalText.split(/\s+/).filter((word) => word.length > 5).slice(0, 7))) {
    findings.push(makeFinding("O título final parece pouco conectado ao objetivo geral validado.", {
      elementIds: [context.title.id],
      resolution: "Volte à Etapa 6 e ajuste o título final.",
      rule: "Change 014: título final",
      severity: "warning",
    }));
  }

  const unknownReferences = content.elements.flatMap((item) => item.referenceIds.map((referenceId) => ({ elementId: item.id, referenceId })))
    .filter((item) => !allowedReferenceIds.has(item.referenceId));
  if (unknownReferences.length > 0) {
    findings.push(makeFinding("Há referências associadas que não vieram do Research Starter.", {
      elementIds: unknownReferences.map((item) => item.elementId),
      resolution: "Remova a referência desconhecida ou otimize novamente a literatura.",
      rule: "Change 014: referências verificáveis",
      severity: "blocking",
    }));
  }

  return findings;
}

export function buildFinalMap(workflow: ResearchWorkflow): FinalMap {
  const content = workflow.content;
  const discovery = content.discovery;
  const candidate = discovery?.candidates.find((item) => item.id === discovery.selectedCandidateId) ?? null;
  const problemStatement = element(content, "problem_statement") ?? null;
  const generalObjective = element(content, "general_objective") ?? null;
  const specificObjectives = elements(content, "specific_objective").filter((item) => item.status === "validated");
  const title = element(content, "research_title") ?? null;
  const literatureTopics = topicsFromContent(content, "literature");
  const developmentTopics = topicsFromContent(content, "development");
  const allReferences = uniqueReferences([...(discovery?.references ?? []), ...content.referenceArchive]);
  const usedReferenceIds = selectedReferenceIds(content, candidate);
  const references = allReferences.filter((reference) => usedReferenceIds.has(reference.referenceId));
  const promptId = `prompt:${workflow.projectId}`;
  const nodes: FinalMapNode[] = [
    node(promptId, "prompt", "Prompt", "Pedido original", discovery?.originalPrompt ?? "", "discovery"),
    ...(candidate ? [node(candidate.id, "proposal", "Proposta", candidate.title, candidate.problemQuestion, "discovery")] : []),
    ...(problemStatement ? [node(problemStatement.id, "problem", "Etapa 1", "Problemática", approved(problemStatement), "problem")] : []),
    ...(generalObjective ? [node(generalObjective.id, "general", "Etapa 2", "Objetivo geral", approved(generalObjective), "general")] : []),
    ...specificObjectives.map((objective, index) => node(objective.id, "specific", `OE${index + 1}`, `Objetivo específico ${index + 1}`, approved(objective), "specifics")),
    ...literatureTopics.map((topic) => node(topic.id, "literature", topic.label, "Revisão da Literatura", topic.title, "literature")),
    ...developmentTopics.map((topic) => node(topic.id, "development", topic.label, "Desenvolvimento", topic.title, "development")),
    ...content.methodologyRows.map((row, index) => node(row.id, "methodology", `M${index + 1}`, "Matriz metodológica", row.expectedResult, "methodology")),
    ...(title ? [node(title.id, "title", "Título", "Título final", approved(title), "methodology")] : []),
    ...references.map((reference) => node(`reference:${reference.referenceId}`, "reference", "Referência", referenceLabel(reference), reference.title ?? reference.referenceId, null)),
  ];
  const edges: FinalMapEdge[] = [
    ...(candidate ? [{ from: promptId, label: "originou proposta escolhida", to: candidate.id }] : []),
    ...(candidate && problemStatement ? [{ from: candidate.id, label: "foi validada como problemática", to: problemStatement.id }] : []),
    ...traceEdges(content),
    ...referenceEdges(references, content, candidate),
  ];
  const graphProblems = graphIssues(nodes, edges);
  const storedFindings = content.coherenceFindings.filter((finding) => !finding.rule.startsWith("Change 014"));
  const findings = [
    ...storedFindings,
    ...deterministicFindings(workflow, { candidate, developmentTopics, literatureTopics, references: allReferences, title }),
    ...graphProblems.map((message) => makeFinding(message, {
      elementIds: [workflow.projectId],
      resolution: "Recalcule a rastreabilidade ou volte à etapa que criou a relação órfã.",
      rule: "Change 014: grafo de rastreabilidade",
      severity: "blocking",
    })),
  ];

  return {
    candidate,
    developmentTopics,
    edges,
    findings,
    generalObjective,
    graphIssues: graphProblems,
    literatureTopics,
    methodologyRows: content.methodologyRows,
    nodes,
    problemStatement,
    references,
    specificObjectives,
    title,
    workflow,
  };
}

export function canCompleteFinalMap(finalMap: FinalMap) {
  return finalMap.findings.every((finding) => finding.severity !== "blocking");
}

export function finalMapSummary(finalMap: FinalMap) {
  const findings = finalMap.findings.filter((finding) => finding.severity !== "blocking");
  const references = finalMap.references.map((reference) => {
    const authors = reference.authors.join(", ") || "Fonte";
    return `${authors}${reference.year ? ` (${reference.year})` : ""}. ${reference.title ?? reference.referenceId}${reference.url ? `. ${reference.url}` : ""}`;
  });
  return [
    `Título: ${approved(finalMap.title)}`,
    `Problemática: ${approved(finalMap.problemStatement)}`,
    `Objetivo geral: ${approved(finalMap.generalObjective)}`,
    `Objetivos específicos: ${finalMap.specificObjectives.map((item) => approved(item)).join(" | ")}`,
    `Capítulo 2: ${finalMap.literatureTopics.map((topic) => topic.title).join(" | ")}`,
    `Capítulo 4: ${finalMap.developmentTopics.map((topic) => topic.title).join(" | ")}`,
    `Resultados esperados: ${finalMap.methodologyRows.map((row) => row.expectedResult).join(" | ")}`,
    `Referências verificáveis: ${references.length > 0 ? references.join(" | ") : "Nenhuma referência associada."}`,
    `Avisos e sugestões: ${findings.length > 0 ? findings.map((finding) => `${finding.severity}: ${finding.message}`).join(" | ") : "Nenhum aviso registrado."}`,
  ].join("\n").slice(0, 12_000);
}
