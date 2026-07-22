import type { Tables } from "@/lib/supabase/database.types";

export type Project = Tables<"projects">;

export type ProjectActionState = {
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialProjectActionState: ProjectActionState = { status: "idle" };
