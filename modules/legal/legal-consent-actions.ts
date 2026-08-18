"use server";

import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { LEGAL_TERMS_VERSION } from "./legal-content";

export async function acceptLegalTerms() {
  const { supabase, userId } = await requireAuthenticatedUser();
  const { data: profile } = await supabase.from("user_profiles").select("active_role").eq("user_id", userId).maybeSingle();
  const profileRole = profile?.active_role === "advisor" ? "advisor" : "student";
  const now = new Date(Date.now() + 5_000).toISOString();
  const { error } = await supabase.from("legal_consents").upsert({
    accepted_at: now,
    created_at: now,
    terms_version: LEGAL_TERMS_VERSION,
    updated_at: now,
    profile_role: profileRole,
    user_id: userId,
  }, { onConflict: "user_id,profile_role" });
  if (error) redirect("/dashboard?legal=error");
  redirect("/dashboard");
}
