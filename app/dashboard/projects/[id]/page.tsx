import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteProject, duplicateProject, updateProject } from "@/modules/projects/actions";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { ProjectForm } from "@/modules/projects/project-form";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase, userId } = await requireAuthenticatedUser();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!project) notFound();

  return (
    <main className="workspace-shell narrow-workspace">
      <Link className="back-link" href="/dashboard">← Voltar aos projetos</Link>
      <p className="eyebrow">Editar projeto</p>
      <h1>{project.title}</h1>
      <ProjectForm action={updateProject} project={project} submitLabel="Salvar alterações" />
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
