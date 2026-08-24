import { NextResponse } from "next/server";

import { toJson } from "@/modules/generation/types";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { discoverResearchProposals } from "@/modules/research-workflow/discovery-service";
import {
  researchWorkflowSchema,
  type ResearchWorkflow,
} from "@/modules/research-workflow/schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import { DiscoveryError } from "@/modules/research-workflow/discovery-errors";
import { ResearchStarterClientError } from "@/modules/research-starter/client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const maxDuration = 120;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Projeto inválido." }, { status: 400 });

  const { supabase, userId } = await requireAuthenticatedUser();
  const [{ data: project }, workflow] = await Promise.all([
    supabase
      .from("projects")
      .select("id, owner_id, title, theme, problem_statement, keywords, knowledge_area, academic_level, advisor_email, advisor_id, status, workflow_version, created_at, updated_at, deleted_at")
      .eq("id", id)
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .maybeSingle(),
    loadResearchWorkflow(supabase, userId, id),
  ]);

  if (!project || project.workflow_version !== 2 || !workflow) {
    return NextResponse.json({ error: "Fluxo v2 não encontrado." }, { status: 404 });
  }
  if (workflow.content.discovery && workflow.state !== "failed") {
    return NextResponse.json({ workflow }, { headers: { "Cache-Control": "private, no-store" } });
  }
  if (workflow.state === "discovering") {
    return NextResponse.json({ error: "A descoberta já está em andamento." }, { status: 409 });
  }
  if (workflow.state !== "draft_prompt" && workflow.state !== "failed") {
    return NextResponse.json({ error: "A descoberta não pode ser iniciada nesta etapa." }, { status: 409 });
  }

  const claimRevision = workflow.revision + 1;
  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("research_workflows")
    .update({ revision: claimRevision, state: "discovering", updated_at: now })
    .eq("project_id", id)
    .eq("owner_id", userId)
    .eq("revision", workflow.revision)
    .in("state", ["draft_prompt", "failed"])
    .select("project_id")
    .maybeSingle();

  if (claimError || !claimed) {
    return NextResponse.json({ error: "A descoberta já foi iniciada em outra sessão." }, { status: 409 });
  }

  try {
    const discovery = await discoverResearchProposals(project, workflow.content.initialBriefing);
    const completedAt = new Date().toISOString();
    const content = { ...workflow.content, discovery };
    const { data: saved, error: saveError } = await supabase
      .from("research_workflows")
      .update({
        content: toJson(content),
        revision: claimRevision + 1,
        stable_state: "choosing_problem",
        state: "choosing_problem",
        updated_at: completedAt,
      })
      .eq("project_id", id)
      .eq("owner_id", userId)
      .eq("revision", claimRevision)
      .eq("state", "discovering")
      .select("updated_at")
      .maybeSingle();
    if (saveError || !saved) throw new Error("Não foi possível salvar as propostas.");

    const nextWorkflow: ResearchWorkflow = researchWorkflowSchema.parse({
      content,
      ownerId: userId,
      projectId: id,
      revision: claimRevision + 1,
      schemaVersion: workflow.schemaVersion,
      sourceRevision: workflow.sourceRevision,
      stableState: "choosing_problem",
      state: "choosing_problem",
      updatedAt: saved.updated_at,
    });
    return NextResponse.json({ workflow: nextWorkflow }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const errorCode = error instanceof DiscoveryError
      ? error.code
      : error instanceof ResearchStarterClientError && error.code === "not-configured"
        ? "research-starter-config"
        : error instanceof ResearchStarterClientError
          ? "research-starter-unavailable"
          : "unexpected";
    const stage = error instanceof DiscoveryError ? error.stage : "literature";
    const retryable = error instanceof DiscoveryError ? error.retryable : true;
    console.error("proposal_discovery_failed", {
      errorCode,
      message: error instanceof Error ? error.message : "unknown-error",
      projectId: id,
      stage,
    });
    await supabase
      .from("research_workflows")
      .update({ revision: claimRevision + 1, state: "failed", updated_at: new Date().toISOString() })
      .eq("project_id", id)
      .eq("owner_id", userId)
      .eq("revision", claimRevision);
    return NextResponse.json({
      error: errorCode === "briefing-too-short"
        ? "Descreva um pouco mais o tema da pesquisa antes de formar as propostas."
        : errorCode === "research-starter-empty"
        ? "O Research Starter não encontrou literatura verificável. Ajuste o tema e tente novamente."
        : errorCode === "research-starter-config"
          ? "O Research Starter não está configurado neste ambiente."
          : errorCode === "research-starter-unavailable"
            ? "O Research Starter está temporariamente indisponível. Tente novamente em instantes."
            : errorCode === "gemini-quota-exhausted"
              ? "A IA está sem créditos disponíveis no momento. Recarregue a conta Gemini e tente novamente."
              : errorCode === "gemini-unavailable"
                ? "O serviço de IA está temporariamente indisponível. Tente novamente em instantes."
            : errorCode === "proposal-shape-invalid"
              ? "A IA não devolveu seis propostas válidas. Tente novamente; seu briefing foi preservado."
              : errorCode === "unverified-references"
                ? "A IA associou uma fonte não verificada. Tente novamente; nenhuma referência foi inventada."
                : "Não foi possível formar as propostas. Tente novamente; seu briefing foi preservado.",
      errorCode,
      retryable,
      stage,
      preservedBriefing: Boolean(workflow.content.initialBriefing),
    }, { status: errorCode === "briefing-too-short" ? 422 : errorCode === "research-starter-config" ? 503 : 502, headers: { "Cache-Control": "private, no-store" } });
  }
}
