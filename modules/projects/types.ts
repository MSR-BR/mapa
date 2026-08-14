import type { Tables } from "@/lib/supabase/database.types";

export type Project = Tables<"projects">;

export type ProjectField =
  | "title"
  | "theme"
  | "problemStatement"
  | "keywords"
  | "knowledgeArea"
  | "academicLevel"
  | "advisorEmail";

export type ProjectFormValues = Record<ProjectField, string>;

export type ProjectActionState = {
  fieldErrors?: Partial<Record<ProjectField, string>>;
  message?: string;
  status: "idle" | "error" | "success";
  values?: ProjectFormValues;
};

export const initialProjectActionState: ProjectActionState = { status: "idle" };
