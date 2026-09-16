import { NextResponse } from "next/server";
import { z } from "zod";

import { toJson } from "@/modules/generation/types";
import {
  authorizeProjectRoute,
  type AuthorizedProjectContext,
} from "@/modules/projects/auth";
import { pendingAdvisorReview } from "@/modules/research-workflow/advisor-review";
import {
  researchWorkflowContentSchema,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type ValidatedElement,
} from "@/modules/research-workflow/schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import {
  WORKFLOW_NAVIGATION_TARGETS,
  canNavigateToWorkflowTarget,
  workflowNavigationState,
} from "@/modules/research-workflow/workflow-navigation";

const requestSchema = z.object({
  revision: z.number().int().positive(),
  target: z.enum(WORKFLOW_NAVIGATION_TARGETS),
});

function invalidateFinalMap(content: ResearchWorkflowContent) {
  const finalMap = content.elements.find((element) => element.type === "final_map");
  if (!finalMap || finalMap.status === "stale") return content;
  const archived: ValidatedElement & { archivedAt: string; elementId: string } = {
    ...finalMap,
    archivedAt: new Date().toISOString(),
    elementId: finalMap.id,
  };
  return researchWorkflowContentSchema.parse({
    ...content,
    elementVersions: [...content.elementVersions, archived],
    elements: content.elements.map((element) => element.id === finalMap.id
      ? { ...element, approvedContent: null, revision: element.revision + 1, status: "stale", updatedBy: "system" }
      : element),
  });
}

async function saveNavigation(
  workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  target: ReturnType<typeof workflowNavigationState>,
  supabase: AuthorizedProjectContext["supabase"],
  ownerId: string,
) {
  const revision = workflow.revision + 1;
  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("research_workflows")
    .update({
      content: toJson(content),
      revision,
      source_revision: workflow.sourceRevision,
      stable_state: target.stableState,
      state: target.state,
      updated_at: updatedAt,
    })
    .eq("project_id", workflow.projectId)
    .eq("owner_id", ownerId)
    .eq("revision", workflow.revision)
    .select("updated_at")
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...workflow,
    content,
    revision,
    stableState: target.stableState,
    state: target.state,
    updatedAt: data.updated_at,
  };
}

export async function POST(request: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) {
    return NextResponse.json({ error: "Destino de navegação inválido." }, { status: 400 });
  }

  const access = await authorizeProjectRoute({ mutation: true, projectId: id, request });
  if (!access.ok) return access.response;
  const { supabase, userId } = access.value;
  const workflow = await loadResearchWorkflow(supabase, userId, id);
  if (!workflow || workflow.revision !== parsed.data.revision) {
    return NextResponse.json({ error: "O mapa foi alterado em outra aba. Recarregue para continuar." }, { status: 409 });
  }
  if (pendingAdvisorReview(workflow.content)) {
    return NextResponse.json({ error: "A etapa está aguardando revisão e não pode ser reaberta agora." }, { status: 409 });
  }
  if (!canNavigateToWorkflowTarget(workflow, parsed.data.target)) {
    return NextResponse.json({ error: "Escolha uma etapa anterior à atual." }, { status: 409 });
  }

  const target = workflowNavigationState(parsed.data.target);
  const content = invalidateFinalMap(researchWorkflowContentSchema.parse({
    ...workflow.content,
    activeStep: target.activeStep,
  }));
  const saved = await saveNavigation(workflow, content, target, supabase, userId);
  return saved
    ? NextResponse.json({ message: "Etapa anterior aberta sem alterar o conteúdo salvo.", workflow: saved })
    : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
}
