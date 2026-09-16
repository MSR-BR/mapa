"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { LEGAL_TERMS_VERSION } from "@/modules/legal/legal-content";
import { requireAuthenticatedUser } from "@/modules/projects/auth";

import {
  ActorAuthorizationError,
  isAccountModeSwitchEnabled,
  requireActorContext,
} from "./authorization";
import {
  classifyProfileModeSwitchError,
  isProfileModeSwitchNoop,
  parseProfileModeSwitchInput,
  resolveProfileModeSwitchResult,
  type ProfileModeSwitchActionState,
} from "./mode-switch-policy";
import { isUserProfileRole } from "./types";

export async function setInitialProfileRole(formData: FormData) {
  const role = formData.get("role");
  if (!isUserProfileRole(role)) redirect("/dashboard?profile=invalid");

  const { supabase, userId } = await requireAuthenticatedUser();
  const now = new Date().toISOString();

  const { data: existingProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("active_role")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) redirect("/dashboard?profile=error");

  // The role is intentionally chosen only once. Existing profiles always win,
  // including when an old tab submits a stale first-access form.
  if (existingProfile) {
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from("user_profiles")
    .insert({ active_role: role, created_at: now, updated_at: now, user_id: userId })
    .select("active_role")
    .maybeSingle();

  if (insertError || !createdProfile) redirect("/dashboard?profile=error");

  if (createdProfile.active_role === "advisor") {
    await supabase.rpc("claim_pending_advisor_projects");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

function switchErrorState(
  code: NonNullable<ProfileModeSwitchActionState["code"]>,
  requestId: string | undefined,
): ProfileModeSwitchActionState {
  if (code === "conflict") {
    return {
      code,
      message: "O perfil ativo mudou em outra aba. Recarregamos os dados para você confirmar novamente.",
      requestId,
      status: "conflict",
    };
  }
  const messages = {
    authentication_required: "Sua sessão não pôde ser confirmada. Entre novamente para continuar.",
    failed: "Não foi possível trocar o perfil agora. Tente novamente em alguns instantes.",
    invalid_request: "A solicitação de troca é inválida. Atualize a página e tente novamente.",
    unavailable: "A troca de perfil ainda não está disponível.",
  } as const;
  return { code, message: messages[code], requestId, status: "error" };
}

export async function switchActiveProfileMode(
  _previousState: ProfileModeSwitchActionState,
  formData: FormData,
): Promise<ProfileModeSwitchActionState> {
  const requestId = formData.get("requestId");
  const safeRequestId = typeof requestId === "string" ? requestId : undefined;
  if (!isAccountModeSwitchEnabled()) return switchErrorState("unavailable", safeRequestId);

  const parsed = parseProfileModeSwitchInput({
    expectedRoleVersion: formData.get("expectedRoleVersion"),
    nextRole: formData.get("nextRole"),
    requestId,
  });
  if (!parsed.ok) return switchErrorState("invalid_request", safeRequestId);

  let actor;
  try {
    actor = await requireActorContext();
  } catch (error) {
    if (error instanceof ActorAuthorizationError) {
      const code = error.code === "authentication_required" ? "authentication_required" : "failed";
      return switchErrorState(code, parsed.value.requestId);
    }
    throw error;
  }

  if (isProfileModeSwitchNoop(actor.activeRole, actor.roleVersion, parsed.value)) {
    return {
      activeRole: actor.activeRole,
      requestId: parsed.value.requestId,
      requiresConsent: !actor.hasLegalConsent,
      roleVersion: actor.roleVersion,
      status: "success",
    };
  }

  const { data, error } = await actor.supabase.rpc("switch_active_role", {
    expected_role_version: parsed.value.expectedRoleVersion,
    next_role: parsed.value.nextRole,
    request_id: parsed.value.requestId,
  });
  if (error) {
    return switchErrorState(classifyProfileModeSwitchError(error), parsed.value.requestId);
  }

  const switched = resolveProfileModeSwitchResult(data, parsed.value.nextRole);
  if (!switched) return switchErrorState("failed", parsed.value.requestId);

  const { data: consent, error: consentError } = await actor.supabase
    .from("legal_consents")
    .select("terms_version")
    .eq("user_id", actor.userId)
    .eq("profile_role", switched.activeRole)
    .maybeSingle();
  const requiresConsent = consentError || consent?.terms_version !== LEGAL_TERMS_VERSION;

  revalidatePath("/dashboard", "layout");
  return {
    activeRole: switched.activeRole,
    requestId: parsed.value.requestId,
    requiresConsent: Boolean(requiresConsent),
    roleVersion: switched.roleVersion,
    status: "success",
  };
}
