import { NextResponse } from "next/server";
import { z } from "zod";

import {
  generateGeneralObjective,
  generateSpecificObjectives,
  regenerateProblemStatement,
} from "@/modules/generation/gemini";
import { toJson } from "@/modules/generation/types";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import {
  validateGeneralObjective,
  validateProblemStatement,
  validateSpecificObjectives,
} from "@/modules/research-workflow/definition-validation";
import {
  researchWorkflowContentSchema,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type ValidatedElement,
  type WorkflowElementType,
} from "@/modules/research-workflow/schema";
import { collectDependentElementTypes } from "@/modules/research-workflow/state-machine";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import {
  discoveryWithWorkflowReferences,
  studentContextNotes,
} from "@/modules/research-workflow/workflow-references";

export const maxDuration = 120;

const requestSchema = z.object({
  action: z.enum(["back", "regenerate", "save", "validate"]),
  content: z.string().optional(),
  objectives: z.array(z.object({
    content: z.string(),
    id: z.string().uuid(),
    studentJustification: z.string().optional().nullable(),
  })).optional(),
  revision: z.number().int().positive(),
  step: z.enum(["problem_statement", "general_objective", "specific_objectives"]),
  studentJustification: z.string().optional().nullable(),
});

const problemDraftSchema = z.string().trim().max(500);
const generalDraftSchema = z.string().trim().max(700);
const specificDraftsSchema = z.array(z.object({
  id: z.string().uuid(),
  content: z.string().trim().max(700),
  studentJustification: z.string().trim().max(1_000).nullable().default(null),
})).min(3).max(6);

type DefinitionRouteStep = z.infer<typeof requestSchema>["step"];

function currentElement(content: ResearchWorkflowContent, type: WorkflowElementType) {
  return content.elements.find((element) => element.type === type);
}

function archiveElement(content: ResearchWorkflowContent, element: ValidatedElement) {
  return [...content.elementVersions, { ...element, archivedAt: new Date().toISOString(), elementId: element.id }];
}

function upsertElement(
  content: ResearchWorkflowContent,
  input: Pick<ValidatedElement, "id" | "proposedContent" | "referenceIds" | "status" | "type" | "updatedBy">
    & { approvedContent?: string | null; sourceRevision: number; studentJustification?: string | null },
) {
  const existing = content.elements.find((element) => element.id === input.id);
  const next: ValidatedElement = {
    approvedContent: input.approvedContent === undefined ? existing?.approvedContent ?? null : input.approvedContent,
    id: input.id,
    proposedContent: input.proposedContent,
    referenceIds: input.referenceIds,
    revision: existing ? existing.revision + 1 : 1,
    sourceRevision: input.sourceRevision,
    status: input.status,
    studentJustification: input.studentJustification === undefined ? existing?.studentJustification ?? null : input.studentJustification,
    type: input.type,
    updatedBy: input.updatedBy,
  };
  return researchWorkflowContentSchema.parse({
    ...content,
    elementVersions: existing ? archiveElement(content, existing) : content.elementVersions,
    elements: existing
      ? content.elements.map((element) => element.id === existing.id ? next : element)
      : [...content.elements, next],
  });
}

function markDescendantsStale(content: ResearchWorkflowContent, sourceType: WorkflowElementType) {
  const dependentTypes = new Set(collectDependentElementTypes(sourceType));
  const changed = content.elements.filter((element) => dependentTypes.has(element.type) && element.status !== "stale");
  if (changed.length === 0) return content;
  const changedIds = new Set(changed.map((element) => element.id));
  return researchWorkflowContentSchema.parse({
    ...content,
    elementVersions: changed.reduce((history, element) => (
      [...history, { ...element, archivedAt: new Date().toISOString(), elementId: element.id }]
    ), content.elementVersions),
    elements: content.elements.map((element) => changedIds.has(element.id)
      ? { ...element, approvedContent: null, revision: element.revision + 1, status: "stale", updatedBy: "system" }
      : element),
  });
}

function workflowResponse(
  workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  revision: number,
  sourceRevision: number,
  state: ResearchWorkflow["state"],
  stableState: ResearchWorkflow["stableState"],
  updatedAt: string,
): ResearchWorkflow {
  return { ...workflow, content, revision, sourceRevision, stableState, state, updatedAt };
}

async function saveWorkflow(
  workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  sourceRevision: number,
  state: ResearchWorkflow["state"],
  stableState: ResearchWorkflow["stableState"],
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  ownerId: string,
) {
  const revision = workflow.revision + 1;
  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("research_workflows")
    .update({
      content: toJson(content),
      revision,
      source_revision: sourceRevision,
      stable_state: stableState,
      state,
      updated_at: updatedAt,
    })
    .eq("project_id", workflow.projectId)
    .eq("owner_id", ownerId)
    .eq("revision", workflow.revision)
    .select("updated_at")
    .maybeSingle();
  if (error || !data) return null;
  return workflowResponse(workflow, content, revision, sourceRevision, state, stableState, data.updated_at);
}

function draftContent(
  workflow: ResearchWorkflow,
  step: DefinitionRouteStep,
  body: z.infer<typeof requestSchema>,
) {
  const sourceRevision = workflow.sourceRevision;
  if (step === "specific_objectives") {
    const objectives = specificDraftsSchema.parse(body.objectives);
    let content = workflow.content;
    for (const objective of objectives) {
      const existing = content.elements.find((element) => element.id === objective.id);
      content = upsertElement(content, {
        approvedContent: existing?.approvedContent ?? null,
        id: objective.id,
        proposedContent: objective.content,
        referenceIds: existing?.referenceIds ?? [],
        sourceRevision,
        status: existing?.approvedContent === objective.content ? "validated" : "edited",
        studentJustification: objective.studentJustification,
        type: "specific_objective",
        updatedBy: "user",
      });
    }
    const submittedIds = new Set(objectives.map((objective) => objective.id));
    const removed = content.elements.filter((element) => element.type === "specific_objective" && !submittedIds.has(element.id));
    return researchWorkflowContentSchema.parse({
      ...content,
      elementVersions: removed.reduce((history, element) => (
        [...history, { ...element, archivedAt: new Date().toISOString(), elementId: element.id }]
      ), content.elementVersions),
      elements: content.elements.filter((element) => element.type !== "specific_objective" || submittedIds.has(element.id)),
      traceLinks: content.traceLinks.filter((link) => !removed.some((element) => element.id === link.toElementId || element.id === link.fromElementId)),
    });
  }

  const value = step === "problem_statement"
    ? problemDraftSchema.parse(body.content)
    : generalDraftSchema.parse(body.content);
  if (!value) throw new Error("O rascunho não pode ficar vazio.");
  const type = step;
  const existing = currentElement(workflow.content, type);
  if (!existing) throw new Error("Conteúdo da etapa não encontrado.");
  return upsertElement(workflow.content, {
    approvedContent: existing.approvedContent,
    id: existing.id,
    proposedContent: value,
    referenceIds: existing.referenceIds,
    sourceRevision,
    status: existing.approvedContent === value ? "validated" : "edited",
    studentJustification: (body.studentJustification ?? "").trim() || null,
    type,
    updatedBy: "user",
  });
}

function validationErrors(content: ResearchWorkflowContent, step: DefinitionRouteStep) {
  const problem = currentElement(content, "problem_statement");
  if (!problem) return ["A problemática não foi encontrada."];
  if (step === "problem_statement") return validateProblemStatement(problem.proposedContent);
  const general = currentElement(content, "general_objective");
  if (!general) return ["O objetivo geral não foi encontrado."];
  if (step === "general_objective") return validateGeneralObjective(general.proposedContent, problem.proposedContent);
  const specifics = content.elements.filter((element) => element.type === "specific_objective");
  return validateSpecificObjectives(
    specifics.map((element) => ({ content: element.proposedContent, id: element.id })),
    general.proposedContent,
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) {
    return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
  }

  const { supabase, userId } = await requireAuthenticatedUser();
  const workflow = await loadResearchWorkflow(supabase, userId, id);
  const discovery = workflow?.content.discovery;
  const candidate = discovery?.candidates.find((item) => item.id === discovery.selectedCandidateId);
  if (!workflow || !discovery || !candidate) {
    return NextResponse.json({ error: "Fluxo da pesquisa não encontrado." }, { status: 404 });
  }
  if (workflow.revision !== parsed.data.revision) {
    return NextResponse.json({ error: "Esta etapa foi alterada em outra aba. Recarregue para continuar." }, { status: 409 });
  }
  if (workflow.content.activeStep !== parsed.data.step) {
    return NextResponse.json({ error: "Esta não é a etapa ativa do projeto." }, { status: 409 });
  }

  const { action, step } = parsed.data;
  if (action === "back") {
    let content = workflow.content;
    let state: ResearchWorkflow["state"] = workflow.state;
    let stableState: ResearchWorkflow["stableState"] = workflow.stableState;
    if (step === "specific_objectives") {
      content = researchWorkflowContentSchema.parse({ ...content, activeStep: "general_objective" });
      state = "validating_general_objective";
      stableState = "validating_general_objective";
    } else if (step === "general_objective") {
      content = researchWorkflowContentSchema.parse({ ...content, activeStep: "problem_statement" });
      state = "choosing_problem";
      stableState = "choosing_problem";
    } else {
      content = markDescendantsStale(content, "problem_statement");
      const removed = content.elements.filter((element) => element.type === "problem_candidate" || element.type === "problem_statement");
      content = researchWorkflowContentSchema.parse({
        ...content,
        activeStep: null,
        discovery: { ...discovery, selectedCandidateId: null },
        elementVersions: removed.reduce((history, element) => (
          [...history, { ...element, archivedAt: new Date().toISOString(), elementId: element.id }]
        ), content.elementVersions),
        elements: content.elements.filter((element) => !removed.some((item) => item.id === element.id)),
        traceLinks: content.traceLinks.filter((link) => !removed.some((element) => element.id === link.toElementId || element.id === link.fromElementId)),
      });
      state = "choosing_problem";
      stableState = "choosing_problem";
    }
    const saved = await saveWorkflow(workflow, content, workflow.sourceRevision, state, stableState, supabase, userId);
    return saved
      ? NextResponse.json({ workflow: saved })
      : NextResponse.json({ error: "A etapa foi alterada em outra aba." }, { status: 409 });
  }

  let content: ResearchWorkflowContent;
  try {
    content = draftContent(workflow, step, parsed.data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Conteúdo inválido." }, { status: 400 });
  }

  if (action === "save") {
    const saved = await saveWorkflow(workflow, content, workflow.sourceRevision, workflow.state, workflow.stableState, supabase, userId);
    return saved
      ? NextResponse.json({ message: "Rascunho salvo.", workflow: saved })
      : NextResponse.json({ error: "O rascunho foi alterado em outra aba." }, { status: 409 });
  }

  if (action === "regenerate") {
    const problem = currentElement(content, "problem_statement");
    const general = currentElement(content, "general_objective");
    const generationDiscovery = discoveryWithWorkflowReferences(discovery, content);
    const studentContext = studentContextNotes(content);
    if (!problem) return NextResponse.json({ error: "Problemática não encontrada." }, { status: 409 });
    if (step === "problem_statement") {
      const generated = await regenerateProblemStatement(candidate, generationDiscovery, studentContext);
      const existing = currentElement(content, "problem_statement")!;
      content = upsertElement(content, {
        approvedContent: null,
        id: existing.id,
        proposedContent: generated.content,
        referenceIds: generated.referenceIds,
        sourceRevision: workflow.sourceRevision,
        status: "suggested",
        studentJustification: existing.studentJustification,
        type: "problem_statement",
        updatedBy: "ai",
      });
    } else if (step === "general_objective") {
      const generated = await generateGeneralObjective(problem.proposedContent, candidate, generationDiscovery, studentContext);
      const existing = general;
      content = upsertElement(content, {
        approvedContent: null,
        id: existing?.id ?? crypto.randomUUID(),
        proposedContent: generated.content,
        referenceIds: generated.referenceIds,
        sourceRevision: workflow.sourceRevision,
        status: "suggested",
        studentJustification: existing?.studentJustification ?? null,
        type: "general_objective",
        updatedBy: "ai",
      });
    } else {
      if (!general) return NextResponse.json({ error: "Objetivo geral não encontrado." }, { status: 409 });
      const generated = await generateSpecificObjectives(problem.proposedContent, general.proposedContent, generationDiscovery, studentContext);
      const existing = content.elements.filter((element) => element.type === "specific_objective");
      for (const [index, objective] of generated.entries()) {
        content = upsertElement(content, {
          approvedContent: null,
          id: existing[index]?.id ?? crypto.randomUUID(),
          proposedContent: objective.content,
          referenceIds: objective.referenceIds,
          sourceRevision: workflow.sourceRevision,
          status: "suggested",
          studentJustification: existing[index]?.studentJustification ?? null,
          type: "specific_objective",
          updatedBy: "ai",
        });
      }
      const retainedIds = new Set(generated.map((_, index) => existing[index]?.id).filter(Boolean));
      const removed = existing.filter((element) => !retainedIds.has(element.id));
      content = researchWorkflowContentSchema.parse({
        ...content,
        elementVersions: removed.reduce((history, element) => (
          [...history, { ...element, archivedAt: new Date().toISOString(), elementId: element.id }]
        ), content.elementVersions),
        elements: content.elements.filter((element) => element.type !== "specific_objective" || retainedIds.has(element.id) || !existing.some((item) => item.id === element.id)),
        traceLinks: content.traceLinks.filter((link) => !removed.some((element) => element.id === link.toElementId || element.id === link.fromElementId)),
      });
    }
    const saved = await saveWorkflow(workflow, content, workflow.sourceRevision, workflow.state, workflow.stableState, supabase, userId);
    return saved
      ? NextResponse.json({ message: "Nova sugestão criada.", workflow: saved })
      : NextResponse.json({ error: "A etapa foi alterada em outra aba." }, { status: 409 });
  }

  const errors = validationErrors(content, step);
  if (errors.length > 0) {
    const elementIds = step === "specific_objectives"
      ? content.elements.filter((element) => element.type === "specific_objective").map((element) => element.id)
      : [currentElement(content, step)?.id].filter((value): value is string => Boolean(value));
    content = researchWorkflowContentSchema.parse({
      ...content,
      coherenceFindings: errors.map((message) => ({
        elementIds,
        id: crypto.randomUUID(),
        message,
        resolution: null,
        rule: "Validação estrutural da Change 011",
        severity: "blocking",
      })),
    });
    const saved = await saveWorkflow(workflow, content, workflow.sourceRevision, workflow.state, workflow.stableState, supabase, userId);
    if (!saved) {
      return NextResponse.json({ error: "A etapa foi alterada em outra aba." }, { status: 409 });
    }
    return NextResponse.json({ errors, workflow: saved }, { status: 422 });
  }

  const sourceRevision = workflow.sourceRevision + 1;
  content = researchWorkflowContentSchema.parse({ ...content, coherenceFindings: [] });
  let state: ResearchWorkflow["state"];
  let stableState: ResearchWorkflow["stableState"];
  if (step === "problem_statement") {
    const problem = currentElement(content, "problem_statement")!;
    content = markDescendantsStale(content, "problem_statement");
    content = upsertElement(content, {
      approvedContent: problem.proposedContent,
      id: problem.id,
      proposedContent: problem.proposedContent,
      referenceIds: problem.referenceIds,
      sourceRevision,
      status: "validated",
      type: "problem_statement",
      updatedBy: problem.updatedBy === "ai" ? "ai" : "user",
    });
    const generationDiscovery = discoveryWithWorkflowReferences(discovery, content);
    const studentContext = studentContextNotes(content);
    const generated = await generateGeneralObjective(problem.proposedContent, candidate, generationDiscovery, studentContext);
    const existingGeneral = currentElement(content, "general_objective");
    const generalId = existingGeneral?.id ?? crypto.randomUUID();
    content = upsertElement(content, {
      approvedContent: null,
      id: generalId,
      proposedContent: generated.content,
      referenceIds: generated.referenceIds,
      sourceRevision,
      status: "suggested",
      studentJustification: existingGeneral?.studentJustification ?? null,
      type: "general_objective",
      updatedBy: "ai",
    });
    content = researchWorkflowContentSchema.parse({
      ...content,
      activeStep: "general_objective",
      traceLinks: [
        ...content.traceLinks.filter((link) => !(link.fromElementId === problem.id && link.toElementId === generalId)),
        { fromElementId: problem.id, rule: "O objetivo geral responde diretamente à problemática.", sourceRevision, toElementId: generalId },
      ],
    });
    state = "validating_general_objective";
    stableState = "validating_general_objective";
  } else if (step === "general_objective") {
    const problem = currentElement(content, "problem_statement")!;
    const general = currentElement(content, "general_objective")!;
    content = markDescendantsStale(content, "general_objective");
    content = upsertElement(content, {
      approvedContent: general.proposedContent,
      id: general.id,
      proposedContent: general.proposedContent,
      referenceIds: general.referenceIds,
      sourceRevision,
      status: "validated",
      type: "general_objective",
      updatedBy: general.updatedBy === "ai" ? "ai" : "user",
    });
    const generationDiscovery = discoveryWithWorkflowReferences(discovery, content);
    const studentContext = studentContextNotes(content);
    const generated = await generateSpecificObjectives(problem.proposedContent, general.proposedContent, generationDiscovery, studentContext);
    const existingSpecifics = content.elements.filter((element) => element.type === "specific_objective");
    const specificIds: string[] = [];
    for (const [index, objective] of generated.entries()) {
      const specificId = existingSpecifics[index]?.id ?? crypto.randomUUID();
      specificIds.push(specificId);
      content = upsertElement(content, {
        approvedContent: null,
        id: specificId,
        proposedContent: objective.content,
        referenceIds: objective.referenceIds,
        sourceRevision,
        status: "suggested",
        studentJustification: existingSpecifics[index]?.studentJustification ?? null,
        type: "specific_objective",
        updatedBy: "ai",
      });
    }
    content = researchWorkflowContentSchema.parse({
      ...content,
      activeStep: "specific_objectives",
      traceLinks: [
        ...content.traceLinks.filter((link) => link.fromElementId !== general.id || !existingSpecifics.some((item) => item.id === link.toElementId)),
        ...specificIds.map((specificId) => ({
          fromElementId: general.id,
          rule: "O objetivo específico contribui para atender o objetivo geral.",
          sourceRevision,
          toElementId: specificId,
        })),
      ],
    });
    state = "validating_specific_objectives";
    stableState = "validating_specific_objectives";
  } else {
    const specifics = content.elements.filter((element) => element.type === "specific_objective");
    for (const objective of specifics) {
      content = upsertElement(content, {
        approvedContent: objective.proposedContent,
        id: objective.id,
        proposedContent: objective.proposedContent,
        referenceIds: objective.referenceIds,
        sourceRevision,
        status: "validated",
        type: "specific_objective",
        updatedBy: objective.updatedBy === "ai" ? "ai" : "user",
      });
    }
    content = researchWorkflowContentSchema.parse({ ...content, activeStep: "literature_topics" });
    state = "validating_literature";
    stableState = "validating_literature";
  }

  const saved = await saveWorkflow(workflow, content, sourceRevision, state, stableState, supabase, userId);
  if (saved && step === "problem_statement") {
    const approvedProblem = currentElement(content, "problem_statement")?.approvedContent;
    const { error } = await supabase
      .from("projects")
      .update({ problem_statement: approvedProblem, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", userId)
      .eq("workflow_version", 2);
    if (error) {
      return NextResponse.json({ error: "A problemática foi validada, mas o resumo do projeto não foi atualizado.", workflow: saved }, { status: 500 });
    }
  }
  return saved
    ? NextResponse.json({ message: "Etapa validada.", workflow: saved })
    : NextResponse.json({ error: "A etapa foi alterada em outra aba." }, { status: 409 });
}
