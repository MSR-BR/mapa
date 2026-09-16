"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ActorAuthorizationError,
  requireActorContext,
} from "@/modules/profile/authorization";
import { expectedRoleVersionFromFormData } from "@/modules/projects/auth";

import { LEGAL_TERMS_VERSION } from "./legal-content";

export async function acceptLegalTerms(_previousState: { error?: string } | null, formData: FormData) {
  let actor;
  try {
    actor = await requireActorContext({
      expectedRoleVersion: expectedRoleVersionFromFormData(formData),
    });
  } catch (error) {
    if (error instanceof ActorAuthorizationError) return { error: error.message };
    throw error;
  }

  const now = new Date(Date.now() + 5_000).toISOString();
  const { error } = await actor.supabase.from("legal_consents").upsert({
    accepted_at: now,
    created_at: now,
    terms_version: LEGAL_TERMS_VERSION,
    updated_at: now,
    profile_role: actor.activeRole,
    user_id: actor.userId,
  }, { onConflict: "user_id,profile_role" });
  if (error) return { error: "Não foi possível registrar o aceite. Atualize a página e tente novamente." };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
