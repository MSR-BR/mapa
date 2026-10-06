import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeProjectRoute } from "@/modules/projects/auth";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import { WORKFLOW_NAVIGATION_TARGETS, canNavigateToWorkflowTarget, workflowForView } from "@/modules/research-workflow/workflow-navigation";

// Compatibility endpoint for already-open clients. Navigation never writes.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = z.object({ target: z.enum(WORKFLOW_NAVIGATION_TARGETS) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Destino inválido." }, { status: 400 });
  const access = await authorizeProjectRoute({ projectId: id, request, capability: "related_read" });
  if (!access.ok) return access.response;
  const workflow = await loadResearchWorkflow(access.value.supabase, access.value.project.owner_id, id);
  if (!workflow || !canNavigateToWorkflowTarget(workflow, parsed.data.target)) {
    return NextResponse.json({ error: "Esta etapa ainda não foi criada. Conclua os pré-requisitos para iniciá-la." }, { status: 409 });
  }
  return NextResponse.json({ workflow: workflowForView(workflow, parsed.data.target) }, { headers: { "Cache-Control": "private, no-store" } });
}
