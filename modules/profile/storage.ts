import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { LEGAL_TERMS_VERSION } from "@/modules/legal/legal-content";
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
    supabase.from("legal_consents").select("profile_role,terms_version").eq("user_id", userId),
  ]);

  const activeRole = isUserProfileRole(data?.active_role) ? data.active_role : "student";
  const hasLegalConsent = Array.isArray(consent) && consent.some((item) => item.profile_role === activeRole && item.terms_version === LEGAL_TERMS_VERSION);
  // Keep the first-access shape explicit: hasProfile: false when no role row exists.
  return { activeRole, hasLegalConsent, hasProfile: isUserProfileRole(data?.active_role) };
}

export async function claimPendingAdvisorProjects(supabase: SupabaseClient<Database>) {
  await supabase.rpc("claim_pending_advisor_projects");
}
