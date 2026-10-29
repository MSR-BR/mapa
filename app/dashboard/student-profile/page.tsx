import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireActorContext } from "@/modules/profile/authorization";
import { StudentAcademicForm } from "@/modules/profile/student-academic-form";
import { STUDY_LEVELS, type StudyLevel } from "@/modules/profile/student-academic-profile";

export const metadata: Metadata = { title: "Dados acadêmicos", robots: { index: false, follow: false } };

export default async function StudentProfilePage() {
  const actor = await requireActorContext();
  if (actor.activeRole !== "student") redirect("/dashboard");
  const { data: saved, error } = await actor.supabase.from("student_academic_profiles")
    .select("display_name,university,department,course_name,study_levels")
    .eq("user_id", actor.userId).maybeSingle();
  const metadata = actor.claims.user_metadata && typeof actor.claims.user_metadata === "object"
    ? actor.claims.user_metadata as Record<string, unknown> : {};
  const suggestedName = [metadata.full_name, metadata.name]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim().slice(0, 120) ?? "";
  const initial = {
    displayName: saved?.display_name ?? suggestedName,
    university: saved?.university ?? "",
    department: saved?.department ?? "",
    courseName: saved?.course_name ?? "",
    studyLevels: (saved?.study_levels ?? []).filter((value): value is StudyLevel =>
      STUDY_LEVELS.some((item) => item.value === value)),
  };
  return <main className="workspace-shell student-profile-shell">
    <Link href="/dashboard">← Voltar ao mapa</Link>
    <p className="section-kicker">Perfil de aluno</p>
    <h1>Complete seus dados acadêmicos</h1>
    <p>Esses dados ajudam a identificar seus projetos para o orientador. Você pode preenchê-los agora ou continuar o mapa e voltar depois. Apenas seu nome será exibido nos cards dos projetos orientados.</p>
    {error ? <p role="alert" className="error-state">Seus dados acadêmicos não puderam ser carregados. Recarregue a página antes de editá-los. <Link href="/dashboard">Voltar ao mapa</Link></p>
      : <StudentAcademicForm initial={initial} />}
  </main>;
}
