import { WorkflowRequestError } from "@/modules/research-workflow/request-failure";
import { currentResearchIntakeReview, researchIntakeReviewTextsSchema } from "@/modules/projects/research-intake";
import { rewriteInitialBriefing } from "@/modules/generation/rewrite-initial-briefing";
import { withAiProgress } from "@/modules/ai/route";
import { contentWithDraft, saveVersionedWorkflow } from "@/modules/research-workflow/save-versioned-workflow";
import { workflowForView } from "@/modules/research-workflow/workflow-navigation";
import { NextResponse } from "next/server";
import { z } from "zod";

import { notifyAdvisorOfReviewRequest } from "@/lib/email/project-notifications";
import { reviewFinalMapCoherence } from "@/modules/generation/gemini";
import { claimEmail, loadProjectAdvisorEmail } from "@/modules/projects/advisor";
import {
  authorizeProjectCapabilityResponse,
  authorizeProjectRoute,
  type AuthorizedProjectContext,
} from "@/modules/projects/auth";
import {
  buildFinalMap,
  canCompleteFinalMap,
  finalMapSummary,
} from "@/modules/research-workflow/final-map";
import {
  projectAdvisorGate,
  STUDENT_ADVISOR_REQUIRED_CODE,
  STUDENT_ADVISOR_REQUIRED_MESSAGE,
} from "@/modules/research-workflow/advisor-requirement";
import { pendingAdvisorReview, withAdvisorReviewRequest } from "@/modules/research-workflow/advisor-review";
import {
  researchWorkflowContentSchema,
  type CoherenceFinding,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type ValidatedElement,
} from "@/modules/research-workflow/schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";

export const maxDuration = 120;

const requestSchema = z.object({
  action: z.enum(["complete", "go_to", "review", "prepare_export", "save_export_review"]),
  revision: z.number().int().positive(),
  reviewTexts: researchIntakeReviewTextsSchema.optional(),
  targetStep: z.enum(["development", "discovery", "general", "literature", "methodology", "problem", "specifics"]).optional(),
});

type TargetStep = NonNullable<z.infer<typeof requestSchema>["targetStep"]>;

function archive(elements: ValidatedElement[], history: ResearchWorkflowContent["elementVersions"]) {
  const now = new Date().toISOString();
  return elements.reduce((versions, item) => [...versions, { ...item, archivedAt: now, elementId: item.id }], history);
}

function finalMapFinding(message: string, workflow: ResearchWorkflow): CoherenceFinding {
  return {
    elementIds: [workflow.projectId],
    id: crypto.randomUUID(),
    message,
    resolution: "A revisão determinística foi preservada; tente revisar com IA novamente mais tarde.",
    rule: "IA: fallback seguro",
    severity: "warning",
  };
}

function replaceFinalMapFindings(content: ResearchWorkflowContent, findings: CoherenceFinding[]) {
  return researchWorkflowContentSchema.parse({
    ...content,
    coherenceFindings: [
      ...content.coherenceFindings.filter((finding) => !finding.rule.startsWith("Change 014") && !finding.rule.startsWith("IA:")),
      ...findings,
    ].slice(-40),
  });
}

function upsertFinalMap(content: ResearchWorkflowContent, summary: string, sourceRevision: number) {
  const existing = content.elements.find((item) => item.type === "final_map");
  const next: ValidatedElement = {
    approvedContent: summary,
    id: existing?.id ?? crypto.randomUUID(),
    proposedContent: summary,
    referenceIds: [],
    revision: existing ? existing.revision + 1 : 1,
    sourceRevision,
    status: "validated",
    studentJustification: existing?.studentJustification ?? null,
    type: "final_map",
    updatedBy: "system",
  };
  return researchWorkflowContentSchema.parse({
    ...content,
    activeStep: null,
    elementVersions: existing ? archive([existing], content.elementVersions) : content.elementVersions,
    elements: existing
      ? content.elements.map((item) => item.id === existing.id ? next : item)
      : [...content.elements, next],
    traceLinks: [
      ...content.traceLinks.filter((link) => link.toElementId !== next.id),
      ...content.elements
        .filter((item) => ["development_topic", "general_objective", "literature_topic", "methodology_mapping", "problem_statement", "research_title", "specific_objective"].includes(item.type))
        .map((item) => ({
          fromElementId: item.id,
          rule: "Elemento consolidado no mapa final.",
          sourceRevision,
          toElementId: next.id,
        })),
    ],
  });
}

function targetState(targetStep: TargetStep) {
  const states: Record<TargetStep, Pick<ResearchWorkflow, "state" | "stableState"> & { activeStep: ResearchWorkflowContent["activeStep"] }> = {
    development: { activeStep: "development_topics", stableState: "validating_development", state: "validating_development" },
    discovery: { activeStep: null, stableState: "choosing_problem", state: "choosing_problem" },
    general: { activeStep: "general_objective", stableState: "validating_general_objective", state: "validating_general_objective" },
    literature: { activeStep: "literature_topics", stableState: "validating_literature", state: "validating_literature" },
    methodology: { activeStep: "methodology_matrix", stableState: "validating_methodology", state: "validating_methodology" },
    problem: { activeStep: "problem_statement", stableState: "choosing_problem", state: "choosing_problem" },
    specifics: { activeStep: "specific_objectives", stableState: "validating_specific_objectives", state: "validating_specific_objectives" },
  };
  return states[targetStep];
}



async function aiFindingsWithFallback(workflow: ResearchWorkflow) {
  const finalMap = buildFinalMap(workflow);
  try {
    return await reviewFinalMapCoherence(finalMap);
  } catch {
    return [finalMapFinding("A revisão complementar por IA não ficou disponível agora.", workflow)];
  }
}

async function handlePost(request: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) return NextResponse.json({ error: "Operação inválida." }, { status: 400 });

  const access = await authorizeProjectRoute({ mutation: true, projectId: id, request });
  if (!access.ok) return access.response;
  const { actor, supabase, userId } = access.value;
  const claims = actor.claims;
  const isSelfDirectedProject = access.value.project.authoring_role === "advisor";
  const editAction = parsed.data.action;
  const editStep = "final_map" as const;
  const baseWorkflow = await loadResearchWorkflow(supabase, userId, id);
  const workflow = baseWorkflow ? { ...baseWorkflow, content: contentWithDraft(baseWorkflow, "final_map") } : null;
async function saveWorkflow(
  _workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  state: ResearchWorkflow["state"],
  stableState: ResearchWorkflow["stableState"],
  sourceRevision: number,
  supabase: AuthorizedProjectContext["supabase"],
) {
  return saveVersionedWorkflow(supabase, { base: baseWorkflow!, content, state, stableState, sourceRevision, step: editStep, action: editAction });
}
  if (!workflow || workflow.revision !== parsed.data.revision) {
    return NextResponse.json({ code: "revision_conflict", error: new WorkflowRequestError("revision_conflict").message }, { status: 409 });
  }
  if (!isSelfDirectedProject && !["go_to", "prepare_export", "save_export_review"].includes(parsed.data.action) && pendingAdvisorReview(workflow.content)) {
    return NextResponse.json({ code: "advisor_pending", error: new WorkflowRequestError("advisor_pending").message }, { status: 409 });
  }
  if (!["completed", "reviewing_map"].includes(workflow.state)) {
    return NextResponse.json({ code: "prerequisite_required", error: new WorkflowRequestError("prerequisite_required").message }, { status: 409 });
  }
  if (["prepare_export", "save_export_review"].includes(parsed.data.action)) {
    if (pendingAdvisorReview(workflow.content)) {
      return NextResponse.json({ code: "advisor_pending", error: new WorkflowRequestError("advisor_pending").message }, { status: 409 });
    }
    // Only appendix metadata changes: never confirm/rewrite a student's academic units.
    if (!workflow.content.initialBriefing) return NextResponse.json({ workflow: baseWorkflow });
    const cached = currentResearchIntakeReview(workflow.content);
    if (parsed.data.action === "prepare_export" && cached) return NextResponse.json({ workflow: baseWorkflow });
    if (parsed.data.action === "save_export_review" && !parsed.data.reviewTexts) return NextResponse.json({ error: "Preencha os cinco campos da reformulação antes de salvar." }, { status: 400 });
    const review = parsed.data.action === "save_export_review"
      ? { sourceBriefing: workflow.content.initialBriefing, texts: parsed.data.reviewTexts! }
      : await rewriteInitialBriefing(workflow.content.initialBriefing);
    const content = researchWorkflowContentSchema.parse({ ...baseWorkflow!.content, initialBriefingReview: review });
    const saved = await saveVersionedWorkflow(supabase, { base: baseWorkflow!, content, state: baseWorkflow!.state, stableState: baseWorkflow!.stableState, sourceRevision: baseWorkflow!.sourceRevision, step: "final_map", action: parsed.data.action }, { reportErrors: true });
    return saved ? NextResponse.json({ workflow: saved }) : NextResponse.json({ code: "revision_conflict", error: new WorkflowRequestError("revision_conflict").message }, { status: 409 });
  }
  const advisorGate = parsed.data.action === "complete"
    ? projectAdvisorGate({
      advisorEmail: await loadProjectAdvisorEmail(supabase, userId, id),
      authoringRole: access.value.project.authoring_role,
    })
    : null;
  if (advisorGate?.kind === "advisor_required") {
    return NextResponse.json(
      { code: STUDENT_ADVISOR_REQUIRED_CODE, error: STUDENT_ADVISOR_REQUIRED_MESSAGE },
      { status: 409 },
    );
  }

  if (parsed.data.action === "go_to") {
    if (!parsed.data.targetStep) return NextResponse.json({ error: "Etapa de destino inválida." }, { status: 400 });
    const target = targetState(parsed.data.targetStep).activeStep ?? "problem_statement";
    return NextResponse.json({ workflow: workflowForView(baseWorkflow!, target) });
  }

  const deterministicMap = buildFinalMap(workflow);
  const aiFindings = await aiFindingsWithFallback(workflow);
  let content = replaceFinalMapFindings(workflow.content, [...deterministicMap.findings, ...aiFindings]);
  let nextWorkflow = { ...workflow, content };
  const finalMap = buildFinalMap(nextWorkflow);

  if (parsed.data.action === "review") {
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase);
    return saved ? NextResponse.json({ workflow: saved }) : NextResponse.json({ code: "revision_conflict", error: new WorkflowRequestError("revision_conflict").message }, { status: 409 });
  }

  if (!canCompleteFinalMap(finalMap, { advisory: true })) {
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase);
    return saved
      ? NextResponse.json({ errors: finalMap.findings.filter((finding) => finding.severity === "blocking").map((finding) => finding.message), workflow: saved }, { status: 422 })
      : NextResponse.json({ code: "revision_conflict", error: new WorkflowRequestError("revision_conflict").message }, { status: 409 });
  }

  const sourceRevision = workflow.sourceRevision + 1;
  content = upsertFinalMap(content, finalMapSummary(finalMap), sourceRevision);
  nextWorkflow = { ...workflow, content };
  content = replaceFinalMapFindings(content, buildFinalMap(nextWorkflow).findings.filter((finding) => finding.severity !== "blocking"));
  const advisorEmail = advisorGate?.kind === "advisor_review" ? advisorGate.advisorEmail : null;
  const shouldWaitForAdvisor = advisorGate?.kind === "advisor_review";
  if (shouldWaitForAdvisor) {
    const supervisionError = authorizeProjectCapabilityResponse(
      access.value,
      "student_supervision",
    );
    if (supervisionError) return supervisionError;

    content = withAdvisorReviewRequest(
      researchWorkflowContentSchema.parse({ ...content, activeStep: null }),
      {
        advisorEmail,
        sourceRevision,
        step: "final_map",
        studentEmail: claimEmail(claims as Record<string, unknown>),
        transition: { targetActiveStep: null, targetStableState: "completed", targetState: "completed" },
      },
    );
  }
  const saved = await saveWorkflow(
    workflow,
    content,
    shouldWaitForAdvisor ? workflow.state : "completed",
    shouldWaitForAdvisor ? workflow.stableState : "completed",
    sourceRevision,
    supabase,
  );
  const submittedReview = shouldWaitForAdvisor ? pendingAdvisorReview(content) : null;
  if (saved && submittedReview) {
    await notifyAdvisorOfReviewRequest({
      actorEmail: claimEmail(claims as Record<string, unknown>),
      advisorEmail,
      projectId: id,
      reviewId: submittedReview.id,
      step: submittedReview.step,
      supabase,
    });
  }
  return saved
    ? NextResponse.json({ message: shouldWaitForAdvisor ? "Mapa validado pelo estudante. Aguardando revisão." : "Mapa concluído.", workflow: saved })
    : NextResponse.json({ code: "revision_conflict", error: new WorkflowRequestError("revision_conflict").message }, { status: 409 });
}

export const POST = withAiProgress(handlePost);
