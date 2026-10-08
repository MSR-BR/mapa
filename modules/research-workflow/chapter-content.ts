import { researchWorkflowContentSchema, type ResearchWorkflowContent, type ValidatedElement, type ChapterTopicDetail } from "./schema";
import type { ChapterTopicInput } from "./chapter-validation";

export function topicsFromContent(content: ResearchWorkflowContent, chapter: "literature" | "development") {
  const elementType = chapter === "literature" ? "literature_topic" : "development_topic";
  const elements = new Map(content.elements.filter((item) => item.type === elementType).map((item) => [item.id, item]));
  return content.chapterTopicDetails
    .filter((detail) => detail.chapter === chapter)
    .toSorted((left, right) => left.order - right.order)
    .flatMap((detail): ChapterTopicInput[] => {
      const topic = elements.get(detail.topicId);
      return topic ? [{
        exceptionJustification: detail.exceptionJustification,
        generalObjectiveAligned: detail.generalObjectiveAligned,
        id: topic.id,
        objectiveCoverage: detail.objectiveCoverage,
        referenceIds: topic.referenceIds,
        studentJustification: detail.studentJustification,
        title: topic.proposedContent,
      }] : [];
    });
}

function archive(elements: ValidatedElement[], history: ResearchWorkflowContent["elementVersions"]) {
  const now = new Date().toISOString();
  return elements.reduce((versions, item) => [...versions, { ...item, archivedAt: now, elementId: item.id }], history);
}

export function replaceTopics(
  content: ResearchWorkflowContent,
  chapter: "literature" | "development",
  topics: ChapterTopicInput[],
  sourceRevision: number,
  actor: "ai" | "user",
) {
  const type = chapter === "literature" ? "literature_topic" : "development_topic";
  const oldElements = content.elements.filter((item) => item.type === type);
  const oldById = new Map(oldElements.map((item) => [item.id, item]));
  const nextElements = topics.map((topic): ValidatedElement => {
    const previous = oldById.get(topic.id);
    return {
      approvedContent: previous?.approvedContent === topic.title ? topic.title : null,
      id: topic.id,
      proposedContent: topic.title,
      referenceIds: [...new Set(topic.referenceIds)],
      revision: previous ? previous.revision + 1 : 1,
      sourceRevision,
      status: previous?.approvedContent === topic.title ? "validated" : actor === "ai" ? "suggested" : "edited",
      studentJustification: topic.studentJustification ?? null,
      type,
      updatedBy: actor,
    };
  });
  const details: ChapterTopicDetail[] = topics.map((topic, index) => ({
    chapter,
    exceptionJustification: topic.exceptionJustification,
    generalObjectiveAligned: topic.generalObjectiveAligned,
    objectiveCoverage: topic.objectiveCoverage,
    order: index + 1,
    studentJustification: topic.studentJustification,
    topicId: topic.id,
  }));
  return researchWorkflowContentSchema.parse({
    ...content,
    chapterTopicDetails: [
      ...content.chapterTopicDetails.filter((detail) => detail.chapter !== chapter),
      ...details,
    ],
    elementVersions: archive(oldElements, content.elementVersions),
    elements: [...content.elements.filter((item) => item.type !== type), ...nextElements],
    traceLinks: content.traceLinks.filter((link) => !oldElements.some((item) => !topics.some((topic) => topic.id === item.id) && (item.id === link.fromElementId || item.id === link.toElementId))),
  });
}

