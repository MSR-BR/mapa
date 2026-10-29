import type { Tables } from "@/lib/supabase/database.types";

// Some read paths intentionally select only the fields needed for generation.
export type Project = Omit<Tables<"projects">, "student_display_name"> & { student_display_name?: string | null };

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

export type AdvisorLinkActionState = {
  linked?: boolean;
  message?: string;
  status: "idle" | "error" | "success";
  value?: string;
};

export const initialAdvisorLinkActionState: AdvisorLinkActionState = { status: "idle" };
