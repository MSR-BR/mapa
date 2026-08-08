import { NextResponse } from "next/server";

import { toJson } from "@/modules/generation/types";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import {
  researchWorkflowContentSchema,
  type ProblemCandidate,
} from "@/modules/research-workflow/schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function updateSelectedProject(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  ownerId: string,
  projectId: string,
  candidate: ProblemCandidate,
  researchQuery: string,
) {
  const knowledgeArea = candidate.knowledgeAreaProposed
    ? `Área proposta: ${candidate.knowledgeArea}`.slice(0, 120)
    : candidate.knowledgeArea;
  return supabase
    .from("projects")
    .update({
      keywords: candidate.keywords,
      knowledge_area: knowledgeArea,
      problem_statement: candidate.problemQuestion,
      status: "ready",
      theme: researchQuery,
      title: candidate.title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .eq("workflow_version", 2);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const candidateId = body && typeof body === "object" && "candidateId" in body
    ? String(body.candidateId)
    : "";
  if (!UUID.test(id) || !UUID.test(candidateId)) {
    return NextResponse.json({ error: "Seleção inválida." }, { status: 400 });
  }

  const { supabase, userId } = await requireAuthenticatedUser();
  const workflow = await loadResearchWorkflow(supabase, userId, id);
  const discovery = workflow?.content.discovery;
  const candidate = discovery?.candidates.find((item) => item.id === candidateId);
  if (!workflow || !discovery || !candidate) {
    return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
  }
  if (discovery.selectedCandidateId && discovery.selectedCandidateId !== candidateId) {
    return NextResponse.json({ error: "Outra proposta já foi validada." }, { status: 409 });
  }
  if (discovery.selectedCandidateId === candidateId) {
    const { error } = await updateSelectedProject(
      supabase,
      userId,
      id,
      candidate,
      discovery.interpreted.researchQuery,
    );
    return error
      ? NextResponse.json({ error: "Não foi possível atualizar o projeto." }, { status: 500 })
      : NextResponse.json({ ok: true, state: workflow.state });
  }
  if (workflow.state !== "choosing_problem") {
    return NextResponse.json({ error: "A proposta não pode ser escolhida nesta etapa." }, { status: 409 });
  }

  const sourceRevision = workflow.sourceRevision + 1;
  const problemElementId = crypto.randomUUID();
  const content = researchWorkflowContentSchema.parse({
    ...workflow.content,
    activeStep: "problem_statement",
    discovery: { ...discovery, selectedCandidateId: candidateId },
    elements: [
      ...workflow.content.elements,
      {
        approvedContent: null,
        id: candidate.id,
        proposedContent: `${candidate.title}\n${candidate.problemQuestion}`,
        referenceIds: candidate.referenceIds,
        revision: 1,
        sourceRevision,
        status: "suggested",
        type: "problem_candidate",
        updatedBy: "ai",
      },
      {
        approvedContent: null,
        id: problemElementId,
        proposedContent: candidate.problemQuestion,
        referenceIds: candidate.referenceIds,
        revision: 1,
        sourceRevision,
        status: "suggested",
        type: "problem_statement",
        updatedBy: "ai",
      },
    ],
    traceLinks: [
      ...workflow.content.traceLinks,
      {
        fromElementId: candidate.id,
        rule: "A proposta escolhida origina a problemática validada.",
        sourceRevision,
        toElementId: problemElementId,
      },
    ],
  });
  const nextRevision = workflow.revision + 1;
  const now = new Date().toISOString();
  const { data: saved, error: saveError } = await supabase
    .from("research_workflows")
    .update({
      content: toJson(content),
      revision: nextRevision,
      source_revision: sourceRevision,
      stable_state: "choosing_problem",
      state: "choosing_problem",
      updated_at: now,
    })
    .eq("project_id", id)
    .eq("owner_id", userId)
    .eq("revision", workflow.revision)
    .eq("state", "choosing_problem")
    .select("project_id")
    .maybeSingle();
  if (saveError || !saved) {
    return NextResponse.json({ error: "A proposta foi alterada em outra sessão." }, { status: 409 });
  }

  const { error: projectError } = await updateSelectedProject(
    supabase,
    userId,
    id,
    candidate,
    discovery.interpreted.researchQuery,
  );
  if (projectError) {
    return NextResponse.json({ error: "A proposta foi salva, mas o resumo do projeto não foi atualizado." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, state: "choosing_problem" });
}
