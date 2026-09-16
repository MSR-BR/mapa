import "server-only";

import { cache } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import {
  loadUserProfile,
  UserProfileLoadError,
  type ReadyUserProfile,
} from "./storage";
import { evaluateActorRequirements } from "./actor-policy";
import { USER_PROFILE_ROLE_LABELS, type UserProfileRole } from "./types";

export type ActorAuthorizationErrorCode =
  | "authentication_required"
  | "profile_consent_required"
  | "profile_invalid"
  | "profile_mode_mismatch"
  | "profile_mode_stale"
  | "profile_required"
  | "profile_unavailable"
  | "project_not_found";

export type ActorAuthorizationStatus = 401 | 403 | 404 | 409 | 503;

export class ActorAuthorizationError extends Error {
  constructor(
    readonly code: ActorAuthorizationErrorCode,
    readonly status: ActorAuthorizationStatus,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ActorAuthorizationError";
  }
}

type ActorIdentity = {
  claims: Record<string, unknown>;
  supabase: SupabaseClient<Database>;
  userId: string;
};

export type ActorContext = ActorIdentity & ReadyUserProfile;

export type ActorContextState =
  | { identity: ActorIdentity; status: "profile_missing" }
  | { actor: ActorContext; status: "ready" };

export type ActorContextDto = {
  activeRole: UserProfileRole;
  label: string;
  roleVersion: number;
};

const ENABLED_VALUES = new Set(["1", "enabled", "on", "true"]);

export function isAccountModeSwitchEnabled() {
  return ENABLED_VALUES.has(
    (process.env.ACCOUNT_MODE_SWITCH_ENABLED ?? "false").trim().toLocaleLowerCase("pt-BR"),
  );
}

export const loadActorContext = cache(async function loadActorContext(): Promise<ActorContextState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") {
    throw new ActorAuthorizationError(
      "authentication_required",
      401,
      "Autenticação necessária.",
      { cause: error },
    );
  }

  const identity: ActorIdentity = {
    claims: data!.claims as Record<string, unknown>,
    supabase,
    userId,
  };

  try {
    const profile = await loadUserProfile(supabase, userId);
    if (!profile.hasProfile) return { identity, status: "profile_missing" };
    return { actor: { ...identity, ...profile }, status: "ready" };
  } catch (profileError) {
    if (profileError instanceof UserProfileLoadError) {
      throw new ActorAuthorizationError(
        profileError.code,
        profileError.code === "profile_invalid" ? 403 : 503,
        profileError.message,
        { cause: profileError },
      );
    }
    throw profileError;
  }
});

export async function requireActorContext(options: {
  expectedRoleVersion?: number;
  requireLegalConsent?: boolean;
} = {}) {
  const state = await loadActorContext();
  const requirements = evaluateActorRequirements({
    expectedRoleVersion: options.expectedRoleVersion,
    hasLegalConsent: state.status === "ready" ? state.actor.hasLegalConsent : false,
    profileStatus: state.status === "ready" ? "ready" : "missing",
    requireLegalConsent: options.requireLegalConsent ?? false,
    roleVersion: state.status === "ready" ? state.actor.roleVersion : undefined,
    strictMode: isAccountModeSwitchEnabled(),
    verifyRoleVersion: Object.prototype.hasOwnProperty.call(options, "expectedRoleVersion"),
  });
  if (!requirements.allowed) {
    if (requirements.code === "profile_required") {
      throw new ActorAuthorizationError(
        "profile_required",
        403,
        "Escolha um perfil para continuar.",
      );
    }
    if (requirements.code === "profile_mode_stale") {
      throw new ActorAuthorizationError(
        "profile_mode_stale",
        409,
        "O perfil ativo mudou em outra aba. Atualize a página para continuar.",
      );
    }
    throw new ActorAuthorizationError(
      "profile_consent_required",
      403,
      "Aceite os termos do perfil ativo para continuar.",
    );
  }
  if (state.status !== "ready") {
    throw new ActorAuthorizationError("profile_required", 403, "Escolha um perfil para continuar.");
  }
  return state.actor;
}

export function actorContextDto(actor: ActorContext): ActorContextDto {
  return {
    activeRole: actor.activeRole,
    label: USER_PROFILE_ROLE_LABELS[actor.activeRole],
    roleVersion: actor.roleVersion,
  };
}

export function actorEmail(actor: Pick<ActorContext, "claims">) {
  const value = actor.claims.email;
  return typeof value === "string" ? value.trim().toLocaleLowerCase("pt-BR") : null;
}
