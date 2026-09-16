import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { LEGAL_TERMS_VERSION } from "@/modules/legal/legal-content";
import { resolveProfileRecord } from "./actor-policy";
import type { UserProfileRole } from "./types";

export type ReadyUserProfile = {
  activeRole: UserProfileRole;
  hasProfile: true;
  hasLegalConsent: boolean;
  roleChangedAt: string;
  roleVersion: number;
};

export type UserProfile =
  | ReadyUserProfile
  | {
    hasLegalConsent: false;
    hasProfile: false;
    status: "missing";
  };

export class UserProfileLoadError extends Error {
  constructor(
    readonly code: "profile_invalid" | "profile_unavailable",
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "UserProfileLoadError";
  }
}

export async function loadUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserProfile> {
  const [{ data, error: profileError }, { data: consent, error: consentError }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("active_role,role_changed_at,role_version")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("legal_consents").select("profile_role,terms_version").eq("user_id", userId),
  ]);

  if (profileError || consentError) {
    throw new UserProfileLoadError(
      "profile_unavailable",
      "Não foi possível consultar o perfil da conta.",
      { cause: profileError ?? consentError },
    );
  }
  const resolved = resolveProfileRecord(data, consent, LEGAL_TERMS_VERSION);
  if (resolved.status === "missing") {
    return { hasLegalConsent: false, hasProfile: false, status: "missing" };
  }
  if (resolved.status === "invalid") {
    throw new UserProfileLoadError("profile_invalid", "O perfil da conta possui dados inválidos.");
  }
  return {
    activeRole: resolved.activeRole,
    hasLegalConsent: resolved.hasLegalConsent,
    hasProfile: true,
    roleChangedAt: resolved.roleChangedAt,
    roleVersion: resolved.roleVersion,
  };
}

export async function claimPendingAdvisorProjects(supabase: SupabaseClient<Database>) {
  await supabase.rpc("claim_pending_advisor_projects");
}
