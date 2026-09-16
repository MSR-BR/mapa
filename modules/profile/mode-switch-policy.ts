import { isUserProfileRole, type UserProfileRole } from "./types";

export const ACCOUNT_MODE_CHANNEL = "mapa-account-mode-v1";
export const ACCOUNT_MODE_STORAGE_KEY = "mapa.account-mode.refresh.v1";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProfileModeSwitchInput = {
  expectedRoleVersion: number;
  nextRole: UserProfileRole;
  requestId: string;
};

export type ProfileModeSwitchActionState = {
  activeRole?: UserProfileRole;
  code?: "authentication_required" | "conflict" | "failed" | "invalid_request" | "unavailable";
  message?: string;
  requestId?: string;
  requiresConsent?: boolean;
  roleVersion?: number;
  status: "conflict" | "error" | "idle" | "success";
};

export const INITIAL_PROFILE_MODE_SWITCH_STATE: ProfileModeSwitchActionState = { status: "idle" };

export function parseProfileModeSwitchInput(input: {
  expectedRoleVersion: unknown;
  nextRole: unknown;
  requestId: unknown;
}): { ok: true; value: ProfileModeSwitchInput } | { ok: false } {
  const expectedRoleVersion = typeof input.expectedRoleVersion === "string"
    ? Number(input.expectedRoleVersion)
    : Number.NaN;
  if (
    !isUserProfileRole(input.nextRole)
    || !Number.isSafeInteger(expectedRoleVersion)
    || expectedRoleVersion < 1
    || typeof input.requestId !== "string"
    || !UUID_PATTERN.test(input.requestId)
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    value: {
      expectedRoleVersion,
      nextRole: input.nextRole,
      requestId: input.requestId,
    },
  };
}

export function isProfileModeSwitchNoop(
  activeRole: UserProfileRole,
  roleVersion: number,
  input: ProfileModeSwitchInput,
) {
  return activeRole === input.nextRole && roleVersion === input.expectedRoleVersion;
}

export function resolveProfileModeSwitchResult(
  data: unknown,
  expectedRole: UserProfileRole,
): { activeRole: UserProfileRole; roleChangedAt: string; roleVersion: number } | null {
  if (!Array.isArray(data) || data.length !== 1) return null;
  const value = data[0];
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    row.active_role !== expectedRole
    || !Number.isSafeInteger(row.role_version)
    || Number(row.role_version) < 1
    || typeof row.role_changed_at !== "string"
  ) {
    return null;
  }
  return {
    activeRole: expectedRole,
    roleChangedAt: row.role_changed_at,
    roleVersion: Number(row.role_version),
  };
}

export function classifyProfileModeSwitchError(error: unknown) {
  const source = error && typeof error === "object"
    ? Object.values(error as Record<string, unknown>).filter((value) => typeof value === "string").join(" ")
    : String(error ?? "");
  const message = source.toLocaleLowerCase("pt-BR");
  if (message.includes("role_version_conflict") || message.includes("idempotency_key_conflict")) {
    return "conflict" as const;
  }
  if (
    message.includes("invalid_active_role")
    || message.includes("invalid_expected_role_version")
    || message.includes("idempotency_key_required")
  ) {
    return "invalid_request" as const;
  }
  if (message.includes("authentication_required") || message.includes("user_profile_not_found")) {
    return "authentication_required" as const;
  }
  if (
    message.includes("permission denied")
    || message.includes("could not find the function")
    || message.includes("schema cache")
  ) {
    return "unavailable" as const;
  }
  return "failed" as const;
}
