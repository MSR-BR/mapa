import type { Project } from "@/modules/projects/types";
import type { ResearchStructure } from "@/modules/generation/schema";
import type { StoredReference } from "@/modules/generation/types";

export type ExportDocumentInput = {
  exportedAt: Date;
  project: Pick<Project, "academic_level" | "keywords" | "knowledge_area" | "problem_statement" | "theme" | "title">;
  references: StoredReference[];
  revision: number;
  structure: ResearchStructure;
};
