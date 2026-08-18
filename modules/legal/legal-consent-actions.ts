"use server";

import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { LEGAL_TERMS_VERSION } from "./legal-content";

export async function acceptLegalTerms() {
  const { supabase, userId } = await requireAuthenticatedUser();
  const now = new Date(Date.now() + 5_000).toISOString();
  const { error } = await supabase.from("legal_consents").upsert({
    accepted_at: now,
    created_at: now,
    terms_version: LEGAL_TERMS_VERSION,
    updated_at: now,
    user_id: userId,
  }, { onConflict: "user_id" });
  if (error) redirect("/dashboard?legal=error");
  redirect("/dashboard");
}
