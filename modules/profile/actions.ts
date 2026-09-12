"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/modules/projects/auth";

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
