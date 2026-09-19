import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GenerationWorkspace } from "@/modules/generation/generation-workspace";
import { loadGenerationSnapshot } from "@/modules/generation/storage";
import { ActorAuthorizationError } from "@/modules/profile/authorization";
import { authorizeProject } from "@/modules/projects/auth";
import { PendingProjectCleanup } from "@/modules/projects/pending-project-cleanup";
import { ProjectAdvisorPanel } from "@/modules/projects/project-advisor-panel";
import { AdvisorReviewWorkspace } from "@/modules/research-workflow/advisor-review-workspace";
import { FinalMapWorkspace } from "@/modules/research-workflow/final-map-workspace";
import { LiteratureDevelopmentWorkspace } from "@/modules/research-workflow/literature-development-workspace";
import { MethodologyWorkspace } from "@/modules/research-workflow/methodology-workspace";
import { ProposalDiscoveryWorkspace } from "@/modules/research-workflow/proposal-discovery-workspace";
import { ResearchDefinitionWorkspace } from "@/modules/research-workflow/research-definition-workspace";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";

function integrationSource(problemStatement: string | null) {
  return problemStatement?.match(/^Integração dos projetos:\s*(.+)$/i)?.[1]?.trim() ?? null;
}

function IntegrationBanner({ source }: { source: string | null }) {
  return source ? (
    <div className="integration-result-banner" role="status">
      <strong>Projeto integrado</strong>
      <span>Este mapa é uma integração dos projetos: {source}.</span>
    </div>
  ) : null;
}

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ discover?: string; generate?: string; integrated?: string }> }) {
  const { id } = await params;
  const { discover, generate } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  let access;
  try {
    access = await authorizeProject(id, "related_read", { requireLegalConsent: true });
  } catch (error) {
    if (error instanceof ActorAuthorizationError) {
      if (error.code === "authentication_required") redirect("/login");
      if (error.code === "project_not_found") notFound();
      redirect(`/dashboard?error=${error.code}`);
    }
    throw error;
  }
  const { relation, supabase, userId } = access;
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, theme, problem_statement, keywords, knowledge_area, academic_level, status, workflow_version, created_at, updated_at, deleted_at, owner_id, advisor_email, advisor_id, authoring_role",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!project) notFound();
  const isOwner = relation === "owner";
  const isAdvisor = relation === "advisor";

  const source = integrationSource(project.problem_statement);
  const isSelfDirectedProject = isOwner && access.project.authoring_role === "advisor";
  const isStudentAuthoredProject = isOwner && access.project.authoring_role === "student";

  if (project.workflow_version === 2) {
    const workflow = await loadResearchWorkflow(supabase, project.owner_id, id);
    if (!workflow) notFound();
    if (isAdvisor) {
      return (
        <main className="workspace-shell proposal-workspace-shell">
          <Link className="back-link" href="/dashboard">← Voltar aos projetos</Link>
          <p className="eyebrow">Mapa da pesquisa</p>
          <h1>{project.title}</h1>
          <IntegrationBanner source={source} />
          <AdvisorReviewWorkspace initialWorkflow={workflow} projectId={project.id} projectTitle={project.title} />
        </main>
      );
    }
    const isMethodologyStage = workflow.state === "validating_methodology";
    const isFinalMapStage = ["completed", "reviewing_map"].includes(workflow.state);
    const isChapterPlanningStage = Boolean(workflow.content.discovery?.selectedCandidateId)
      && (
        ["literature_topics", "development_topics"].includes(workflow.content.activeStep ?? "")
        || ["validating_literature", "validating_development"].includes(workflow.state)
      );
    return (
      <main className="workspace-shell proposal-workspace-shell">
        <PendingProjectCleanup />
        <Link className="back-link" href="/dashboard">← Voltar aos projetos</Link>
        <p className="eyebrow">Mapa da pesquisa</p>
        <h1>{project.title}</h1>
        <IntegrationBanner source={source} />
        {isStudentAuthoredProject ? (
          <ProjectAdvisorPanel
            advisorEmail={project.advisor_email}
            advisorLinked={Boolean(project.advisor_id)}
            projectId={project.id}
          />
        ) : null}
        {isFinalMapStage ? (
          <FinalMapWorkspace initialWorkflow={workflow} isSelfDirectedProject={isSelfDirectedProject} projectId={project.id} />
        ) : isMethodologyStage ? (
          <MethodologyWorkspace initialWorkflow={workflow} isSelfDirectedProject={isSelfDirectedProject} projectId={project.id} />
        ) : isChapterPlanningStage ? (
          <LiteratureDevelopmentWorkspace initialWorkflow={workflow} isSelfDirectedProject={isSelfDirectedProject} projectId={project.id} />
        ) : workflow.content.discovery?.selectedCandidateId ? (
          <ResearchDefinitionWorkspace
            advisorEmail={project.advisor_email}
            initialWorkflow={workflow}
            isSelfDirectedProject={isSelfDirectedProject}
            projectId={project.id}
          />
        ) : (
          <ProposalDiscoveryWorkspace
            autoDiscover={discover === "1"}
            initialWorkflow={workflow}
            originalPrompt={workflow.content.discovery?.originalPrompt || project.problem_statement || project.title}
            projectId={project.id}
          />
        )}
      </main>
    );
  }

  if (!isOwner) notFound();
  const generationSnapshot = await loadGenerationSnapshot(supabase, userId, id);

  return (
    <main className="workspace-shell narrow-workspace">
      <PendingProjectCleanup />
      <Link className="back-link" href="/dashboard">← Voltar aos projetos</Link>
      <p className="eyebrow">Mapa da pesquisa</p>
      <h1>{project.title}</h1>
      <IntegrationBanner source={source} />
      {isStudentAuthoredProject ? (
        <ProjectAdvisorPanel
          advisorEmail={project.advisor_email}
          advisorLinked={Boolean(project.advisor_id)}
          projectId={project.id}
        />
      ) : null}
      <GenerationWorkspace autoGenerate={generate === "1"} initialSnapshot={generationSnapshot} projectId={project.id} />
    </main>
  );
}
