import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { DashboardProjectGrid } from "@/modules/projects/dashboard-project-grid";
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
        <h1 id="quick-start-title">Qual seu tema de pesquisa?</h1>
        <p className="quick-start-summary">
          Descreva em linguagem natural o trabalho que deseja criar. Tema, nível,
          recorte e demais orientações podem ir no mesmo prompt.
        </p>
        <QuickStartForm resumeDraft={resume === "1"} />
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
          <DashboardProjectGrid
            projects={projects.map((project) => ({
              academicArea: project.knowledge_area || "Área a definir",
              projectId: project.id,
              statusLabel: statusLabels[project.status] ?? project.status,
              title: project.title,
              updatedAt: project.updated_at,
            }))}
          />
        )}
      </section>
    </main>
  );
}
