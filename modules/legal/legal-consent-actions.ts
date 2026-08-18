"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { LEGAL_TERMS_VERSION } from "./legal-content";

export async function acceptLegalTerms(_previousState: { error?: string } | null, formData: FormData) {
  const { supabase, userId } = await requireAuthenticatedUser();
  const { data: profile } = await supabase.from("user_profiles").select("active_role").eq("user_id", userId).maybeSingle();
  const requestedRole = formData.get("profileRole");
  const profileRole = requestedRole === "advisor" || profile?.active_role === "advisor" ? "advisor" : "student";
  const now = new Date(Date.now() + 5_000).toISOString();
  const { error } = await supabase.from("legal_consents").upsert({
    accepted_at: now,
    created_at: now,
    terms_version: LEGAL_TERMS_VERSION,
    updated_at: now,
    profile_role: profileRole,
    user_id: userId,
  }, { onConflict: "user_id,profile_role" });
  if (error) return { error: "Não foi possível registrar o aceite. Atualize a página e tente novamente." };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
