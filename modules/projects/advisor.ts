import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export function normalizeAdvisorEmail(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("pt-BR") || null;
}

export function claimEmail(claims: Record<string, unknown>) {
  return typeof claims.email === "string" ? normalizeAdvisorEmail(claims.email) : null;
}

export async function loadProjectAdvisorEmail(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  projectId: string,
) {
  const { data } = await supabase
    .from("projects")
    .select("advisor_email")
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .maybeSingle();
  return normalizeAdvisorEmail(data?.advisor_email);
}
