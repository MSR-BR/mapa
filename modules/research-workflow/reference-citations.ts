export type ReferenceCitation = {
  referenceId: string;
};

export type ReferenceCodeMap = Map<string, string>;

export function buildReferenceCodeMap(references: ReferenceCitation[]) {
  return new Map(references.map((reference, index) => [
    reference.referenceId,
    `R${String(index + 1).padStart(2, "0")}`,
  ]));
}

export function citationMarkers(referenceIds: string[], referenceCodes: ReferenceCodeMap) {
  return [...new Set(referenceIds)]
    .flatMap((referenceId) => {
      const code = referenceCodes.get(referenceId);
      return code ? [`[${code}]`] : [];
    })
    .join(" ");
}

export function withCitationMarkers(text: string, referenceIds: string[], referenceCodes: ReferenceCodeMap) {
  const content = text.trim();
  const markers = citationMarkers(referenceIds, referenceCodes);
  if (!markers) return content;
  if (!content) return markers;
  return markers.split(" ").every((marker) => content.includes(marker))
    ? content
    : `${content} ${markers}`;
}

export function literatureExpansionText(topicTitle: string, referenceIds: string[], referenceCodes: ReferenceCodeMap) {
  const title = topicTitle.trim().replace(/\.$/, "");
  const markers = citationMarkers(referenceIds, referenceCodes);
  const evidence = markers ? ` com apoio das fontes ${markers}` : "";
  return `Texto-base para expansão: este tópico deve discutir ${title}, articulando conceitos centrais, convergências, lacunas e implicações para o problema da pesquisa${evidence}.`;
}
