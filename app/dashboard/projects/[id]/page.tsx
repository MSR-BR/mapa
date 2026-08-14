import Link from "next/link";
import { notFound } from "next/navigation";

import { GenerationWorkspace } from "@/modules/generation/generation-workspace";
import { loadGenerationSnapshot } from "@/modules/generation/storage";
import { claimEmail, normalizeAdvisorEmail } from "@/modules/projects/advisor";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
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

  const { claims, supabase, userId } = await requireAuthenticatedUser();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, theme, problem_statement, keywords, knowledge_area, academic_level, status, workflow_version, created_at, updated_at, deleted_at, owner_id, advisor_email, advisor_id",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!project) notFound();
  const isOwner = project.owner_id === userId;
  const userEmail = claimEmail(claims as Record<string, unknown>);
  const isAdvisor = !isOwner && Boolean(userEmail) && normalizeAdvisorEmail(project.advisor_email) === userEmail;
  if (!isOwner && !isAdvisor) notFound();

  const source = integrationSource(project.problem_statement);

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
        <Link className="back-link" href="/dashboard">← Voltar aos projetos</Link>
        <p className="eyebrow">Mapa da pesquisa</p>
        <h1>{project.title}</h1>
        <IntegrationBanner source={source} />
        {isFinalMapStage ? (
          <FinalMapWorkspace initialWorkflow={workflow} projectId={project.id} />
        ) : isMethodologyStage ? (
          <MethodologyWorkspace initialWorkflow={workflow} projectId={project.id} />
        ) : isChapterPlanningStage ? (
          <LiteratureDevelopmentWorkspace initialWorkflow={workflow} projectId={project.id} />
        ) : workflow.content.discovery?.selectedCandidateId ? (
          <ResearchDefinitionWorkspace initialWorkflow={workflow} projectId={project.id} />
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
      <Link className="back-link" href="/dashboard">← Voltar aos projetos</Link>
      <p className="eyebrow">Mapa da pesquisa</p>
      <h1>{project.title}</h1>
      <IntegrationBanner source={source} />
      <GenerationWorkspace autoGenerate={generate === "1"} initialSnapshot={generationSnapshot} projectId={project.id} />
    </main>
  );
}
