import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { isUserProfileRole, type UserProfileRole } from "./types";

export type UserProfile = {
  activeRole: UserProfileRole;
  hasProfile: boolean;
};

export async function loadUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserProfile> {
  const { data } = await supabase
    .from("user_profiles")
    .select("active_role")
    .eq("user_id", userId)
    .maybeSingle();

  return isUserProfileRole(data?.active_role)
    ? { activeRole: data.active_role, hasProfile: true }
    : { activeRole: "student", hasProfile: false };
}

export async function claimPendingAdvisorProjects(supabase: SupabaseClient<Database>) {
  await supabase.rpc("claim_pending_advisor_projects");
}
