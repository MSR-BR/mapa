import { isUserProfileRole, type UserProfileRole } from "./types";

export type ResolvedProfileRecord =
  | { status: "invalid" }
  | { status: "missing" }
  | {
    activeRole: UserProfileRole;
    hasLegalConsent: boolean;
    roleChangedAt: string;
    roleVersion: number;
    status: "ready";
  };

export function resolveProfileRecord(
  record: unknown,
  consents: unknown,
  termsVersion: string,
): ResolvedProfileRecord {
  if (record === null || typeof record === "undefined") return { status: "missing" };
  if (!record || typeof record !== "object") return { status: "invalid" };

  const value = record as Record<string, unknown>;
  if (
    !isUserProfileRole(value.active_role)
    || !Number.isSafeInteger(value.role_version)
    || Number(value.role_version) < 1
    || typeof value.role_changed_at !== "string"
  ) {
    return { status: "invalid" };
  }

  const activeRole = value.active_role;
  const hasLegalConsent = Array.isArray(consents)
    && consents.some((item) => {
      if (!item || typeof item !== "object") return false;
      const consent = item as Record<string, unknown>;
      return consent.profile_role === activeRole && consent.terms_version === termsVersion;
    });

  return {
    activeRole,
    hasLegalConsent,
    roleChangedAt: value.role_changed_at,
    roleVersion: Number(value.role_version),
    status: "ready",
  };
}

export type ActorRequirementDecision =
  | { allowed: true }
  | {
    allowed: false;
    code: "profile_consent_required" | "profile_mode_stale" | "profile_required";
  };

export function evaluateActorRequirements(input: {
  expectedRoleVersion?: number;
  hasLegalConsent?: boolean;
  profileStatus: "missing" | "ready";
  requireLegalConsent: boolean;
  roleVersion?: number;
  strictMode: boolean;
  verifyRoleVersion: boolean;
}): ActorRequirementDecision {
  if (input.profileStatus === "missing") {
    return { allowed: false, code: "profile_required" };
  }
  if (input.strictMode && input.verifyRoleVersion) {
    if (
      !Number.isSafeInteger(input.expectedRoleVersion)
      || (input.expectedRoleVersion ?? 0) < 1
      || input.expectedRoleVersion !== input.roleVersion
    ) {
      return { allowed: false, code: "profile_mode_stale" };
    }
  }
  if (input.strictMode && input.requireLegalConsent && !input.hasLegalConsent) {
    return { allowed: false, code: "profile_consent_required" };
  }
  return { allowed: true };
}
