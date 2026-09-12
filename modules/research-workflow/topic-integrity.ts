import {
  researchWorkflowContentSchema,
  type ResearchWorkflowContent,
} from "./schema";

function uniqueIds(ids: string[]) {
  return [...new Set(ids)];
}

/**
 * Keeps only chapter details and methodology links that point to an existing
 * topic in their matching chapter. Older workflow versions can retain IDs for
 * topics that were later replaced; those IDs must not inflate visible counts
 * or survive the next save.
 */
export function reconcileTopicLinks(content: ResearchWorkflowContent) {
  const literatureIds = new Set(content.elements.filter((item) => item.type === "literature_topic").map((item) => item.id));
  const developmentIds = new Set(content.elements.filter((item) => item.type === "development_topic").map((item) => item.id));
  const seenTopicIds = new Set<string>();
  const chapterTopicDetails = content.chapterTopicDetails
    .filter((detail) => {
      const validId = detail.chapter === "literature" ? literatureIds.has(detail.topicId) : developmentIds.has(detail.topicId);
      if (!validId || seenTopicIds.has(detail.topicId)) return false;
      seenTopicIds.add(detail.topicId);
      return true;
    })
    .map((detail, index, all) => ({
      ...detail,
      order: all.filter((item) => item.chapter === detail.chapter).findIndex((item) => item.topicId === detail.topicId) + 1,
    }));
  const validTopicIds = new Set(chapterTopicDetails.map((detail) => detail.topicId));
  const methodologyRows = content.methodologyRows.map((row) => ({
    ...row,
    associatedTopicIds: uniqueIds(row.associatedTopicIds.filter((topicId) => validTopicIds.has(topicId))),
  }));
  const changed = JSON.stringify(chapterTopicDetails) !== JSON.stringify(content.chapterTopicDetails)
    || JSON.stringify(methodologyRows) !== JSON.stringify(content.methodologyRows);
  if (!changed) return content;
  const knownTopicIds = new Set([...literatureIds, ...developmentIds]);
  return researchWorkflowContentSchema.parse({
    ...content,
    chapterTopicDetails,
    methodologyRows,
    traceLinks: content.traceLinks.filter((link) => !knownTopicIds.has(link.fromElementId) || validTopicIds.has(link.fromElementId)),
  });
}
