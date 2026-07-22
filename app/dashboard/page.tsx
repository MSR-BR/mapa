import Link from "next/link";

import { requireAuthenticatedUser } from "@/modules/projects/auth";

export default async function DashboardPage() {
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, status, knowledge_area, academic_level, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);
  const projects = data ?? [];

  return (
    <main className="workspace-shell">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Área pessoal</p>
          <h1>Seus projetos</h1>
          <p className="auth-summary">Planeje e organize suas pesquisas em um só lugar.</p>
        </div>
        <Link className="primary-link" href="/dashboard/projects/new">Novo projeto</Link>
      </div>

      {error ? (
        <p className="form-message error">Não foi possível carregar os projetos.</p>
      ) : projects.length === 0 ? (
        <section className="empty-state">
          <h2>Nenhum projeto ainda</h2>
          <p>Crie o primeiro projeto para começar o planejamento.</p>
          <Link className="primary-link" href="/dashboard/projects/new">Criar projeto</Link>
        </section>
      ) : (
        <section className="project-grid" aria-label="Projetos">
          {projects.map((project) => (
            <Link className="project-card" href={`/dashboard/projects/${project.id}`} key={project.id}>
              <span className="project-status">{project.status}</span>
              <h2>{project.title}</h2>
              <p>{project.knowledge_area || "Área não informada"}</p>
              <time dateTime={project.updated_at}>
                Atualizado em {new Intl.DateTimeFormat("pt-BR").format(new Date(project.updated_at))}
              </time>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
