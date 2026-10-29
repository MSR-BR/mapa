import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireActorContext } from "@/modules/profile/authorization";
import { saveStudentAcademicProfile } from "@/modules/profile/student-academic-actions";
import { STUDY_LEVELS } from "@/modules/profile/student-academic-profile";

export const metadata: Metadata = { title: "Dados acadêmicos", robots: { index: false, follow: false } };

export default async function StudentProfilePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActorContext();
  if (actor.activeRole !== "student") redirect("/dashboard");
  const [{ data: saved }, { error }] = await Promise.all([
    actor.supabase.from("student_academic_profiles").select("display_name,university,department,course_name,study_levels").eq("user_id", actor.userId).maybeSingle(),
    searchParams,
  ]);
  const metadata = actor.claims.user_metadata && typeof actor.claims.user_metadata === "object"
    ? actor.claims.user_metadata as Record<string, unknown> : {};
  const suggestedName = [metadata.full_name, metadata.name].find((value) => typeof value === "string") as string | undefined;
  return <main className="workspace-shell student-profile-shell">
    <Link href="/dashboard">← Voltar ao mapa</Link>
    <p className="section-kicker">Perfil de aluno</p>
    <h1>Complete seus dados acadêmicos</h1>
    <p>Esses dados ajudam a identificar seus projetos para o orientador. Você pode preenchê-los agora ou continuar o mapa e voltar depois. Apenas seu nome será exibido nos cards dos projetos orientados.</p>
    {error ? <p role="alert" className="error-state">{error === "invalid" ? "Revise os campos obrigatórios." : "Não foi possível salvar. Tente novamente."}</p> : null}
    <form action={saveStudentAcademicProfile} className="student-profile-form">
      <label>Seu nome <input name="displayName" autoComplete="name" defaultValue={saved?.display_name ?? suggestedName ?? ""} minLength={2} maxLength={120} required /></label>
      <label>Universidade ou instituição <input name="university" autoComplete="organization" defaultValue={saved?.university ?? ""} minLength={2} maxLength={160} required /></label>
      <label>Instituto ou departamento <input name="department" defaultValue={saved?.department ?? ""} minLength={2} maxLength={160} required /></label>
      <label>Curso ou programa <input name="courseName" defaultValue={saved?.course_name ?? ""} minLength={2} maxLength={160} required /></label>
      <fieldset><legend>Nível do curso</legend><p>Marque as opções que descrevem seus vínculos atuais.</p>
        {STUDY_LEVELS.map((item) => <label key={item.value}><input type="checkbox" name="studyLevels" value={item.value} defaultChecked={saved?.study_levels.includes(item.value)} />{item.label}</label>)}
      </fieldset>
      <div className="student-profile-actions"><button className="primary-button" type="submit">Salvar dados</button><Link href="/dashboard">Preencher depois</Link></div>
    </form>
  </main>;
}
