import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { DashboardProjectGrid } from "@/modules/projects/dashboard-project-grid";
import { QuickStartForm } from "@/modules/projects/quick-start-form";
import { workflowDashboardMeta } from "@/modules/research-workflow/dashboard";
import {
  researchWorkflowContentSchema,
  researchWorkflowSchema,
} from "@/modules/research-workflow/schema";

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
    .select("id, title, status, knowledge_area, academic_level, updated_at, workflow_version")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(12);
  const projects = data ?? [];
  const v2ProjectIds = projects.filter((project) => project.workflow_version === 2).map((project) => project.id);
  const { data: workflows } = v2ProjectIds.length > 0
    ? await supabase
      .from("research_workflows")
      .select("project_id, owner_id, schema_version, state, stable_state, revision, source_revision, content, updated_at")
      .in("project_id", v2ProjectIds)
    : { data: [] };
  const workflowByProject = new Map((workflows ?? []).flatMap((workflow) => {
    const content = researchWorkflowContentSchema.safeParse(workflow.content);
    if (!content.success) return [];
    const parsed = researchWorkflowSchema.safeParse({
      content: content.data,
      ownerId: workflow.owner_id,
      projectId: workflow.project_id,
      revision: workflow.revision,
      schemaVersion: workflow.schema_version,
      sourceRevision: workflow.source_revision,
      stableState: workflow.stable_state,
      state: workflow.state,
      updatedAt: workflow.updated_at,
    });
    return parsed.success ? [[workflow.project_id, parsed.data] as const] : [];
  }));
  const dashboardProjects = projects.map((project) => {
    const workflow = workflowByProject.get(project.id);
    const meta = project.workflow_version === 2 && workflow
      ? workflowDashboardMeta(workflow, { area: project.knowledge_area, title: project.title })
      : null;
    return {
      academicArea: meta?.area ?? project.knowledge_area ?? "Área a definir",
      progress: meta?.progress ?? null,
      projectId: project.id,
      stageLabel: meta?.stageLabel ?? "Fluxo clássico",
      statusLabel: project.workflow_version === 2 ? "Mapa v2" : statusLabels[project.status] ?? project.status,
      title: meta?.title ?? project.title,
      updatedAt: project.updated_at,
      workflowVersion: project.workflow_version,
    };
  });

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
          <DashboardProjectGrid projects={dashboardProjects} />
        )}
      </section>
    </main>
  );
}
