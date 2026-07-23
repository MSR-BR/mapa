import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteProject, duplicateProject } from "@/modules/projects/actions";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { GenerationWorkspace } from "@/modules/generation/generation-workspace";
import { loadGenerationSnapshot } from "@/modules/generation/storage";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ generate?: string }> }) {
  const { id } = await params;
  const { generate } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase, userId } = await requireAuthenticatedUser();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, theme, problem_statement, keywords, knowledge_area, academic_level, status, created_at, updated_at, deleted_at, owner_id",
    )
    .eq("id", id)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!project) notFound();
  const generationSnapshot = await loadGenerationSnapshot(supabase, userId, id);

  return (
    <main className="workspace-shell narrow-workspace">
      <Link className="back-link" href="/dashboard">← Voltar aos projetos</Link>
      <p className="eyebrow">Mapa da pesquisa</p>
      <h1>{project.title}</h1>
      <GenerationWorkspace autoGenerate={generate === "1"} initialSnapshot={generationSnapshot} projectId={project.id} />
      <section className="project-danger-zone" aria-labelledby="project-actions-title">
        <h2 id="project-actions-title">Outras ações</h2>
        <form action={duplicateProject}>
          <input name="projectId" type="hidden" value={project.id} />
          <button className="secondary-button" type="submit">Duplicar projeto</button>
        </form>
        <form action={deleteProject} className="delete-form">
          <input name="projectId" type="hidden" value={project.id} />
          <label><input name="confirmDelete" required type="checkbox" value="yes" /> Confirmo que desejo excluir este projeto.</label>
          <button className="danger-button" type="submit">Excluir projeto</button>
        </form>
      </section>
    </main>
  );
}
