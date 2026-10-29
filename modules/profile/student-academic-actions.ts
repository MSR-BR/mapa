"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorContext } from "./authorization";
import { parseStudentAcademicProfile } from "./student-academic-profile";

export async function saveStudentAcademicProfile(formData: FormData) {
  const actor = await requireActorContext();
  if (actor.activeRole !== "student") redirect("/dashboard");
  const profile = parseStudentAcademicProfile(formData);
  if (!profile) redirect("/dashboard/student-profile?error=invalid");
  const { error } = await actor.supabase.from("student_academic_profiles")
    .upsert({ ...profile, user_id: actor.userId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) redirect("/dashboard/student-profile?error=save");
  revalidatePath("/dashboard");
  redirect("/dashboard?profile=complete");
}
