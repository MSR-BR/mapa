import type { Project } from "@/modules/projects/types";
import type { ResearchStructure } from "@/modules/generation/schema";
import type { StoredReference } from "@/modules/generation/types";
import type { FinalMap } from "@/modules/research-workflow/final-map";

export type ExportDocumentInput = {
  exportedAt: Date;
  project: Pick<Project, "academic_level" | "keywords" | "knowledge_area" | "problem_statement" | "theme" | "title">;
  references: StoredReference[];
  revision: number;
  structure: ResearchStructure;
};

export type FinalMapExportInput = {
  draft: boolean;
  exportedAt: Date;
  finalMap: FinalMap;
  project: Pick<Project, "academic_level" | "keywords" | "knowledge_area" | "problem_statement" | "theme" | "title">;
  revision: number;
};
