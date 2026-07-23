import type { Json } from "@/lib/supabase/database.types";
import type { ResearchStructure } from "./schema";

export type GenerationJob = {
  id: string;
  status: "queued" | "researching" | "generating" | "completed" | "failed";
  errorCode: string | null;
  updatedAt: string;
};

export type StoredReference = {
  authors: string[];
  doi: string | null;
  referenceId: string;
  title: string | null;
  url: string | null;
  year: number | null;
};

export type GenerationSnapshot = {
  job: GenerationJob | null;
  structure: ResearchStructure | null;
  references: StoredReference[];
  revision: number | null;
};

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
