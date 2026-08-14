import {
  researchWorkflowContentSchema,
  type ResearchWorkflowContent,
} from "./schema";

function remap(id: string, idMap: Map<string, string>) {
  return idMap.get(id) ?? id;
}

function remapNullable(id: string | null, idMap: Map<string, string>) {
  return id ? remap(id, idMap) : null;
}

export function cloneResearchWorkflowContent(content: ResearchWorkflowContent) {
  const idMap = new Map<string, string>();

  for (const candidate of content.discovery?.candidates ?? []) idMap.set(candidate.id, crypto.randomUUID());
  for (const element of content.elements) idMap.set(element.id, crypto.randomUUID());
  for (const row of content.methodologyRows) idMap.set(row.id, crypto.randomUUID());

  const cloned = researchWorkflowContentSchema.parse({
    ...content,
    advisorReviews: [],
    coherenceFindings: [],
    discovery: content.discovery ? {
      ...content.discovery,
      candidates: content.discovery.candidates.map((candidate) => ({ ...candidate, id: remap(candidate.id, idMap) })),
      selectedCandidateId: remapNullable(content.discovery.selectedCandidateId, idMap),
    } : null,
    elementVersions: [],
    elements: content.elements.map((element) => ({
      ...element,
      id: remap(element.id, idMap),
      referenceIds: [...element.referenceIds],
      updatedBy: "system",
    })),
    methodologyRows: content.methodologyRows.map((row) => ({
      ...row,
      associatedTopicIds: row.associatedTopicIds.map((id) => remap(id, idMap)),
      id: remap(row.id, idMap),
      objectiveId: remap(row.objectiveId, idMap),
      updatedBy: "system",
    })),
    chapterTopicDetails: content.chapterTopicDetails.map((detail) => ({
      ...detail,
      objectiveCoverage: detail.objectiveCoverage.map((coverage) => ({
        ...coverage,
        objectiveId: remap(coverage.objectiveId, idMap),
      })),
      topicId: remap(detail.topicId, idMap),
    })),
    traceLinks: content.traceLinks.flatMap((link) => {
      const fromElementId = idMap.get(link.fromElementId);
      const toElementId = idMap.get(link.toElementId);
      return fromElementId && toElementId ? [{ ...link, fromElementId, toElementId }] : [];
    }),
  });

  return cloned;
}
