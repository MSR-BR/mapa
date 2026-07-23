import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { isResearchStructure } from "./schema";
import type { GenerationSnapshot, StoredReference } from "./types";

export async function loadGenerationSnapshot(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  projectId: string,
): Promise<GenerationSnapshot> {
  const [{ data: stored }, { data: job }] = await Promise.all([
    supabase
      .from("research_structures")
      .select("content, references_data, revision")
      .eq("project_id", projectId)
      .eq("owner_id", ownerId)
      .maybeSingle(),
    supabase
      .from("generation_jobs")
      .select("id, status, error_code, updated_at")
      .eq("project_id", projectId)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const structure = stored && isResearchStructure(stored.content) ? stored.content : null;
  const references = stored && Array.isArray(stored.references_data)
    ? stored.references_data as StoredReference[]
    : [];

  return {
    job: job ? {
      errorCode: job.error_code,
      id: job.id,
      status: job.status as GenerationSnapshot["job"] extends infer T ? T extends { status: infer S } ? S : never : never,
      updatedAt: job.updated_at,
    } : null,
    references,
    revision: stored?.revision ?? null,
    structure,
  };
}
