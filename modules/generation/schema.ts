export const RESEARCH_STRUCTURE_SCHEMA_VERSION = "1.0.0";

export type ResearchSection = {
  content: string;
  id: string;
  optional: boolean;
  provenance: "briefing" | "suggestion" | "user";
  title: string;
};

export type ResearchChapter = {
  id: string;
  number: number;
  sections: ResearchSection[];
  title: string;
};

export type ResearchStructure = {
  chapters: ResearchChapter[];
  schemaVersion: typeof RESEARCH_STRUCTURE_SCHEMA_VERSION;
  title: string;
  warnings: string[];
};

export const REQUIRED_CHAPTERS = [
  "Introdução",
  "Revisão da Literatura",
  "Metodologia Científica",
  "Desenvolvimento da Pesquisa",
  "Conclusões",
] as const;

export function isResearchStructure(value: unknown): value is ResearchStructure {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ResearchStructure>;
  return candidate.schemaVersion === RESEARCH_STRUCTURE_SCHEMA_VERSION
    && typeof candidate.title === "string"
    && Array.isArray(candidate.warnings)
    && Array.isArray(candidate.chapters)
    && candidate.chapters.length === REQUIRED_CHAPTERS.length
    && candidate.chapters.every((chapter, index) =>
      chapter.number === index + 1
      && chapter.title === REQUIRED_CHAPTERS[index]
      && Array.isArray(chapter.sections),
    );
}
