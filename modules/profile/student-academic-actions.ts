"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorContext } from "./authorization";
import { parseStudentAcademicProfile } from "./student-academic-profile";

export type StudentAcademicSaveState = { status: "idle" | "invalid" | "save_error" };

export async function saveStudentAcademicProfile(
  _previousState: StudentAcademicSaveState,
  formData: FormData,
): Promise<StudentAcademicSaveState> {
  const actor = await requireActorContext();
  if (actor.activeRole !== "student") redirect("/dashboard");
  const profile = parseStudentAcademicProfile(formData);
  if (!profile) return { status: "invalid" };
  const { error } = await actor.supabase.from("student_academic_profiles")
    .upsert({ ...profile, user_id: actor.userId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { status: "save_error" };
  revalidatePath("/dashboard");
  redirect("/dashboard?profile=complete");
}
