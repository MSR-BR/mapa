"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/modules/projects/auth";

import { isUserProfileRole } from "./types";

export async function setActiveProfileRole(formData: FormData) {
  const role = formData.get("role");
  if (!isUserProfileRole(role)) return;

  const { supabase, userId } = await requireAuthenticatedUser();
  const now = new Date().toISOString();
  await supabase
    .from("user_profiles")
    .upsert(
      { active_role: role, updated_at: now, user_id: userId },
      { onConflict: "user_id" },
    );

  if (role === "advisor") {
    await supabase.rpc("claim_pending_advisor_projects");
  }

  revalidatePath("/dashboard");
}
