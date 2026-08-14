"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/modules/projects/auth";

import { isUserProfileRole } from "./types";

export async function setActiveProfileRole(formData: FormData) {
  const role = formData.get("role");
  if (!isUserProfileRole(role)) redirect("/dashboard?profile=invalid");

  const { supabase, userId } = await requireAuthenticatedUser();
  const now = new Date().toISOString();

  const { data: existingProfile, error: updateError } = await supabase
    .from("user_profiles")
    .update({ active_role: role, updated_at: now })
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (updateError) redirect("/dashboard?profile=error");

  if (!existingProfile) {
    const { error: insertError } = await supabase
      .from("user_profiles")
      .insert({ active_role: role, created_at: now, updated_at: now, user_id: userId });

    if (insertError) redirect("/dashboard?profile=error");
  }

  if (role === "advisor") {
    await supabase.rpc("claim_pending_advisor_projects");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
