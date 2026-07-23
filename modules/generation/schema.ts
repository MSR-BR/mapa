import { z } from "zod";

export const RESEARCH_STRUCTURE_SCHEMA_VERSION = "1.0.0";

export type ResearchSection = {
  content: string;
  id: string;
  optional: boolean;
  provenance: "briefing" | "suggestion" | "user";
  referenceIds: string[];
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

const researchSectionSchema = z.object({
  content: z.string().trim().min(1).max(12_000),
  id: z.string().trim().regex(/^[a-z0-9-]{2,80}$/),
  optional: z.boolean(),
  provenance: z.enum(["briefing", "suggestion", "user"]),
  referenceIds: z.array(z.string().trim().min(1).max(120)).max(12),
  title: z.string().trim().min(1).max(160),
});

const researchChapterSchema = z.object({
  id: z.string().trim().regex(/^chapter-[1-5]$/),
  number: z.number().int().min(1).max(5),
  sections: z.array(researchSectionSchema).min(1).max(8),
  title: z.string().trim().min(1).max(160),
});

export const researchStructureSchema = z.object({
  chapters: z.array(researchChapterSchema).length(REQUIRED_CHAPTERS.length),
  schemaVersion: z.literal(RESEARCH_STRUCTURE_SCHEMA_VERSION),
  title: z.string().trim().min(1).max(160),
  warnings: z.array(z.string().trim().min(1).max(500)).max(12),
}).superRefine((structure, context) => {
  structure.chapters.forEach((chapter, index) => {
    if (chapter.number !== index + 1 || chapter.id !== `chapter-${index + 1}` || chapter.title !== REQUIRED_CHAPTERS[index]) {
      context.addIssue({
        code: "custom",
        message: `O capítulo ${index + 1} não corresponde ao schema canônico.`,
        path: ["chapters", index],
      });
    }
  });
});

export const editableResearchStructureSchema = researchStructureSchema.superRefine((structure, context) => {
  const sectionIds = new Set<string>();
  for (const [chapterIndex, chapter] of structure.chapters.entries()) {
    for (const [sectionIndex, section] of chapter.sections.entries()) {
      if (sectionIds.has(section.id)) {
        context.addIssue({ code: "custom", message: "Identificador de seção duplicado.", path: ["chapters", chapterIndex, "sections", sectionIndex, "id"] });
      }
      sectionIds.add(section.id);
    }
  }
});

export function isResearchStructure(value: unknown): value is ResearchStructure {
  return researchStructureSchema.safeParse(value).success;
}

export function validateReferenceIds(structure: ResearchStructure, allowedReferenceIds: Set<string>) {
  const invalid = new Set<string>();
  for (const chapter of structure.chapters) {
    for (const section of chapter.sections) {
      for (const referenceId of section.referenceIds) {
        if (!allowedReferenceIds.has(referenceId)) invalid.add(referenceId);
      }
    }
  }
  return [...invalid];
}
