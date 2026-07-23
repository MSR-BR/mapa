import Link from "next/link";

import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { QuickStartForm } from "@/modules/projects/quick-start-form";

const statusLabels: Record<string, string> = {
  archived: "Arquivado",
  completed: "Concluído",
  draft: "Rascunho",
  in_progress: "Em andamento",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  const { resume } = await searchParams;
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, status, knowledge_area, academic_level, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(12);
  const projects = data ?? [];

  return (
    <main className="workspace-shell dashboard-home">
      <section className="quick-start" aria-labelledby="quick-start-title">
        <p className="eyebrow">Seu próximo mapa começa aqui</p>
        <h1 id="quick-start-title">O que você quer pesquisar?</h1>
        <p className="quick-start-summary">
          Descreva em linguagem natural o trabalho que deseja criar. Tema, nível,
          recorte e demais orientações podem ir no mesmo prompt.
        </p>
        <QuickStartForm resumeDraft={resume === "1"} />
        <p className="quick-start-note">Ao pressionar Enter, a pesquisa e a estrutura começam automaticamente.</p>
      </section>

      <section className="recent-projects" aria-labelledby="recent-projects-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Biblioteca</p>
            <h2 id="recent-projects-title">Projetos recentes</h2>
          </div>
        </div>

        {error ? (
          <div className="inline-state error-state" role="alert">
            <strong>Não foi possível carregar os projetos.</strong>
            <span>Tente atualizar a página em alguns instantes.</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="inline-state empty-projects">
            <span className="empty-state-icon" aria-hidden="true">⌁</span>
            <strong>Sua biblioteca ainda está vazia.</strong>
            <span>Escreva uma ideia acima para criar o primeiro mapa.</span>
          </div>
        ) : (
          <div className="project-grid" aria-label="Projetos">
            {projects.map((project) => (
              <Link className="project-card" href={`/dashboard/projects/${project.id}`} key={project.id}>
                <div className="project-card-topline">
                  <span className={`project-status status-${project.status}`}>
                    {statusLabels[project.status] ?? project.status}
                  </span>
                  <span className="card-arrow" aria-hidden="true">↗</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.knowledge_area || "Área a definir"}</p>
                <time dateTime={project.updated_at}>
                  Atualizado em {new Intl.DateTimeFormat("pt-BR").format(new Date(project.updated_at))}
                </time>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
