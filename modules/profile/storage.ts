import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { isUserProfileRole, type UserProfileRole } from "./types";

export type UserProfile = {
  activeRole: UserProfileRole;
  hasProfile: boolean;
  hasLegalConsent: boolean;
};

export async function loadUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserProfile> {
  const [{ data }, { data: consent }] = await Promise.all([
    supabase
    .from("user_profiles")
    .select("active_role")
    .eq("user_id", userId)
    .maybeSingle(),
    supabase.from("legal_consents").select("terms_version").eq("user_id", userId).maybeSingle(),
  ]);

  return isUserProfileRole(data?.active_role)
    ? { activeRole: data.active_role, hasLegalConsent: Boolean(consent?.terms_version), hasProfile: true }
    : { activeRole: "student", hasLegalConsent: Boolean(consent?.terms_version), hasProfile: false };
}

export async function claimPendingAdvisorProjects(supabase: SupabaseClient<Database>) {
  await supabase.rpc("claim_pending_advisor_projects");
}
