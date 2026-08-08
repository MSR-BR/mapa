import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { GenerationWorkspace } from "@/modules/generation/generation-workspace";
import { loadGenerationSnapshot } from "@/modules/generation/storage";
import { ProposalDiscoveryWorkspace } from "@/modules/research-workflow/proposal-discovery-workspace";
import { ResearchDefinitionWorkspace } from "@/modules/research-workflow/research-definition-workspace";
import { LiteratureDevelopmentWorkspace } from "@/modules/research-workflow/literature-development-workspace";
import { MethodologyWorkspace } from "@/modules/research-workflow/methodology-workspace";
import { FinalMapWorkspace } from "@/modules/research-workflow/final-map-workspace";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ discover?: string; generate?: string }> }) {
  const { id } = await params;
  const { discover, generate } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase, userId } = await requireAuthenticatedUser();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, theme, problem_statement, keywords, knowledge_area, academic_level, status, workflow_version, created_at, updated_at, deleted_at, owner_id",
    )
    .eq("id", id)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!project) notFound();

  if (project.workflow_version === 2) {
    const workflow = await loadResearchWorkflow(supabase, userId, id);
    if (!workflow) notFound();
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

  const generationSnapshot = await loadGenerationSnapshot(supabase, userId, id);

  return (
    <main className="workspace-shell narrow-workspace">
      <Link className="back-link" href="/dashboard">← Voltar aos projetos</Link>
      <p className="eyebrow">Mapa da pesquisa</p>
      <h1>{project.title}</h1>
      <GenerationWorkspace autoGenerate={generate === "1"} initialSnapshot={generationSnapshot} projectId={project.id} />
    </main>
  );
}
