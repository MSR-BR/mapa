import {
  proposalDiscoverySchema,
  type DiscoveryReference,
  type ProposalDiscovery,
  type ResearchWorkflowContent,
  type ValidatedElement,
} from "./schema";

function uniqueReferences(references: DiscoveryReference[]) {
  return references.filter((reference, index, all) => (
    all.findIndex((item) => item.referenceId === reference.referenceId) === index
  ));
}

function elementLabel(element: ValidatedElement) {
  if (element.type === "problem_statement") return "Justificativa da problemática";
  if (element.type === "general_objective") return "Justificativa do objetivo geral";
  if (element.type === "specific_objective") return "Justificativa de objetivo específico";
  if (element.type === "literature_topic") return "Justificativa de tópico da literatura";
  if (element.type === "development_topic") return "Justificativa de tópico do capítulo 4";
  return "Justificativa do aluno";
}

export function workflowReferences(content: ResearchWorkflowContent) {
  return uniqueReferences([...(content.discovery?.references ?? []), ...content.referenceArchive]);
}

export function discoveryWithWorkflowReferences(
  discovery: ProposalDiscovery,
  content: ResearchWorkflowContent,
) {
  const manual = content.referenceArchive.filter((reference) => reference.source === "manual");
  const archived = content.referenceArchive.filter((reference) => reference.source !== "manual");
  const references = uniqueReferences([...manual, ...discovery.references, ...archived]).slice(0, 80);
  return proposalDiscoverySchema.parse({
    ...discovery,
    references,
  });
}

export function studentContextNotes(content: ResearchWorkflowContent) {
  const elementById = new Map(content.elements.map((element) => [element.id, element]));
  return [
    ...content.elements.flatMap((element) => {
      const note = element.studentJustification?.trim();
      return note ? [`${elementLabel(element)}: ${note}`] : [];
    }),
    ...content.chapterTopicDetails.flatMap((detail) => {
      const note = detail.studentJustification?.trim();
      if (!note) return [];
      const topic = elementById.get(detail.topicId);
      const chapter = detail.chapter === "literature" ? "Capítulo 2" : "Capítulo 4";
      return [`Justificativa do ${chapter} ${detail.order}${topic ? ` — ${topic.proposedContent}` : ""}: ${note}`];
    }),
    ...content.methodologyRows.flatMap((row) => {
      const note = row.studentJustification?.trim();
      return note ? [`Justificativa da linha metodológica: ${note}`] : [];
    }),
  ].slice(0, 30);
}
