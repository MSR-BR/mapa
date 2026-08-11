import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { DashboardProjectGrid } from "@/modules/projects/dashboard-project-grid";
import { QuickStartForm } from "@/modules/projects/quick-start-form";
import { workflowDashboardMeta } from "@/modules/research-workflow/dashboard";
import {
  researchWorkflowContentSchema,
  researchWorkflowSchema,
  type DiscoveryReference,
  type ResearchWorkflowContent,
} from "@/modules/research-workflow/schema";

const statusLabels: Record<string, string> = {
  archived: "Arquivado",
  completed: "Concluído",
  draft: "Rascunho",
  in_progress: "Em andamento",
};

type CardReference = {
  label: string;
  title: string | null;
};

function referenceLabel(reference: DiscoveryReference) {
  const authors = reference.authors.slice(0, 2).join(", ") || "Fonte";
  return `${authors}${reference.year ? ` (${reference.year})` : ""}`;
}

function readClassicReferences(value: unknown): CardReference[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): CardReference[] => {
    if (!item || typeof item !== "object") return [];
    const reference = item as { authors?: unknown; title?: unknown; year?: unknown };
    const authors = Array.isArray(reference.authors)
      ? reference.authors.filter((author): author is string => typeof author === "string")
      : [];
    const title = typeof reference.title === "string" ? reference.title : null;
    const year = typeof reference.year === "number" ? reference.year : null;
    return [{
      label: `${authors.slice(0, 2).join(", ") || "Fonte"}${year ? ` (${year})` : ""}`,
      title,
    }];
  });
}

function workflowReferences(content: ResearchWorkflowContent): CardReference[] {
  const references = [...(content.discovery?.references ?? []), ...content.referenceArchive]
    .filter((reference, index, all) => all.findIndex((item) => item.referenceId === reference.referenceId) === index);
  return references.map((reference) => ({
    label: referenceLabel(reference),
    title: reference.title,
  }));
}

function isWorkflowFinished(project: { status: string; workflow_version: number }, workflow: { state: string } | undefined) {
  return project.status === "completed" || (project.workflow_version === 2 && workflow?.state === "completed");
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ continue?: string; resume?: string }> }) {
  const { resume, continue: continueParam } = await searchParams;
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, status, knowledge_area, academic_level, problem_statement, updated_at, workflow_version")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(12);
  const projects = data ?? [];
  const projectIds = projects.map((project) => project.id);
  const v2ProjectIds = projects.filter((project) => project.workflow_version === 2).map((project) => project.id);
  const [{ data: workflows }, { data: structures }] = await Promise.all([
    v2ProjectIds.length > 0
      ? supabase
        .from("research_workflows")
        .select("project_id, owner_id, schema_version, state, stable_state, revision, source_revision, content, updated_at")
        .in("project_id", v2ProjectIds)
      : Promise.resolve({ data: [] }),
    projectIds.length > 0
      ? supabase
        .from("research_structures")
        .select("project_id, prompt_version, references_data")
        .in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);
  const structureByProject = new Map((structures ?? []).map((structure) => [structure.project_id, structure]));
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
    const structure = structureByProject.get(project.id);
    const meta = project.workflow_version === 2 && workflow
      ? workflowDashboardMeta(workflow, { area: project.knowledge_area, title: project.title })
      : null;
    const references = workflow
      ? workflowReferences(workflow.content)
      : readClassicReferences(structure?.references_data);
    const integrationSource = project.problem_statement?.match(/^Integração dos projetos:\s*(.+)$/i)?.[1]?.trim() ?? null;
    const isIntegration = structure?.prompt_version.endsWith("-merge") || Boolean(integrationSource);
    return {
      academicArea: meta?.area ?? project.knowledge_area ?? "Área a definir",
      integrationSource,
      isIntegration,
      progress: meta?.progress ?? null,
      projectId: project.id,
      referenceCount: references.length,
      referencePreview: references.slice(0, 2),
      stageLabel: meta?.stageLabel ?? "Fluxo clássico",
      statusLabel: isIntegration ? "Integração" : project.workflow_version === 2 ? "Mapa v2" : statusLabels[project.status] ?? project.status,
      title: meta?.title ?? project.title,
      updatedAt: project.updated_at,
      workflowVersion: project.workflow_version,
    };
  });
  const dashboardProjectById = new Map(dashboardProjects.map((project) => [project.projectId, project]));
  const activeProjects = projects
    .filter((project) => {
      const workflow = workflowByProject.get(project.id);
      const dashboardProject = dashboardProjectById.get(project.id);
      return !dashboardProject?.isIntegration && !isWorkflowFinished(project, workflow);
    })
    .map((project) => dashboardProjectById.get(project.id))
    .filter((project): project is typeof dashboardProjects[number] => Boolean(project));
  const completedProjects = projects
    .filter((project) => {
      const workflow = workflowByProject.get(project.id);
      const dashboardProject = dashboardProjectById.get(project.id);
      return !dashboardProject?.isIntegration && isWorkflowFinished(project, workflow);
    })
    .map((project) => dashboardProjectById.get(project.id))
    .filter((project): project is typeof dashboardProjects[number] => Boolean(project));
  const integratedProjects = dashboardProjects.filter((project) => project.isIntegration);
  const continuationMeta = activeProjects[0] ?? null;

  if (continueParam === "1" && resume !== "1" && continuationMeta) {
    redirect(`/dashboard/projects/${continuationMeta.projectId}`);
  }

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
        {continuationMeta ? (
          <div className="continue-project-card">
            <div>
              <p className="section-kicker">Continue de onde parou</p>
              <h2>{continuationMeta.title}</h2>
              <span>{continuationMeta.stageLabel} · {continuationMeta.progress ?? 0}% concluído</span>
            </div>
            <a className="primary-link" href={`/dashboard/projects/${continuationMeta.projectId}`}>Abrir etapa</a>
          </div>
        ) : null}

        <div className="section-heading">
          <div>
            <p className="section-kicker">Biblioteca</p>
            <h2 id="recent-projects-title">Seus projetos</h2>
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
          <div className="project-library-sections">
            <DashboardProjectGrid
              description="Projetos salvos que ainda têm etapas abertas. Use esta área para continuar a construção do mapa."
              emptyMessage="Nenhum projeto em andamento agora."
              projects={activeProjects}
              title="Projetos em andamento"
              variant="active"
            />
            <DashboardProjectGrid
              allowIntegration
              description="Mapas finalizados. Marque dois a quatro projetos aqui para gerar uma integração."
              emptyMessage="Nenhum projeto concluído ainda."
              projects={completedProjects}
              title="Projetos concluídos"
              variant="completed"
            />
            <DashboardProjectGrid
              allowIntegration={false}
              description="Mapas gerados pela integração de dois ou mais projetos, mantidos separados dos originais."
              emptyMessage="Nenhum projeto integrado ainda."
              projects={integratedProjects}
              title="Projetos integrados"
              variant="integrated"
            />
          </div>
        )}
      </section>
    </main>
  );
}
