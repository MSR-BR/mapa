import { NextResponse } from "next/server";
import { z } from "zod";

import { generateMethodologyPlan } from "@/modules/generation/gemini";
import { toJson } from "@/modules/generation/types";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import {
  methodologyPlanInputSchema,
  validateMethodologyPlan,
  type MethodologyPlanInput,
} from "@/modules/research-workflow/methodology-validation";
import {
  researchWorkflowContentSchema,
  type MethodologyClassification,
  type MethodologyRow,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type ValidatedElement,
} from "@/modules/research-workflow/schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import type { ChapterTopicInput } from "@/modules/research-workflow/chapter-validation";

export const maxDuration = 120;

const requestSchema = z.object({
  action: z.enum(["back", "initialize", "regenerate", "save", "validate"]),
  classification: methodologyPlanInputSchema.shape.classification.optional(),
  revision: z.number().int().positive(),
  rows: methodologyPlanInputSchema.shape.rows.optional(),
  title: methodologyPlanInputSchema.shape.title.optional(),
});

function element(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.find((item) => item.type === type);
}

function specificObjectives(content: ResearchWorkflowContent) {
  return content.elements.filter((item) => item.type === "specific_objective" && item.status === "validated");
}

function chapterTopics(content: ResearchWorkflowContent, chapter: "literature" | "development") {
  const elementType = chapter === "literature" ? "literature_topic" : "development_topic";
  const elements = new Map(content.elements.filter((item) => item.type === elementType).map((item) => [item.id, item]));
  return content.chapterTopicDetails
    .filter((detail) => detail.chapter === chapter)
    .toSorted((left, right) => left.order - right.order)
    .flatMap((detail): ChapterTopicInput[] => {
      const topic = elements.get(detail.topicId);
      return topic ? [{
        exceptionJustification: detail.exceptionJustification,
        generalObjectiveAligned: detail.generalObjectiveAligned,
        id: topic.id,
        objectiveCoverage: detail.objectiveCoverage,
        referenceIds: topic.referenceIds,
        title: topic.proposedContent,
      }] : [];
    });
}

function archive(elements: ValidatedElement[], history: ResearchWorkflowContent["elementVersions"]) {
  const now = new Date().toISOString();
  return elements.reduce((versions, item) => [...versions, { ...item, archivedAt: now, elementId: item.id }], history);
}

function methodSummary(row: MethodologyPlanInput["rows"][number]) {
  return [
    `Levantamento: ${row.dataCollection}`,
    `Análise/tratamento: ${row.analysisTreatment}`,
    `Resultado esperado: ${row.expectedResult}`,
  ].join("\n");
}

function sameClassification(left: MethodologyClassification | null, right: MethodologyPlanInput["classification"]) {
  if (!left) return false;
  const current: MethodologyPlanInput["classification"] = {
    analysisTechniques: left.analysisTechniques,
    approach: left.approach,
    ethicsWarnings: left.ethicsWarnings,
    instruments: left.instruments,
    nature: left.nature,
    objectives: left.objectives,
    procedures: left.procedures,
    rationale: left.rationale,
  };
  return JSON.stringify(current) === JSON.stringify(right);
}

function sameRow(left: MethodologyRow | undefined, right: MethodologyPlanInput["rows"][number]) {
  if (!left) return false;
  const current: MethodologyPlanInput["rows"][number] = {
    analysisTreatment: left.analysisTreatment,
    associatedTopicIds: left.associatedTopicIds,
    dataCollection: left.dataCollection,
    expectedResult: left.expectedResult,
    id: left.id,
    objectiveId: left.objectiveId,
    warnings: left.warnings,
  };
  return JSON.stringify(current) === JSON.stringify(right);
}

function statusFor(actor: "ai" | "user", unchanged: boolean, previous?: { status: ValidatedElement["status"] }) {
  if (unchanged && previous?.status === "validated") return "validated";
  return actor === "ai" ? "suggested" : "edited";
}

function replaceMethodology(
  content: ResearchWorkflowContent,
  input: MethodologyPlanInput,
  sourceRevision: number,
  actor: "ai" | "user",
) {
  const oldMethodElements = content.elements.filter((item) => item.type === "methodology_mapping");
  const oldTitle = element(content, "research_title");
  const oldRows = new Map(content.methodologyRows.map((row) => [row.id, row]));
  const classificationUnchanged = sameClassification(content.methodologyClassification, input.classification);
  const classification: MethodologyClassification = {
    ...input.classification,
    revision: content.methodologyClassification ? content.methodologyClassification.revision + 1 : 1,
    sourceRevision,
    status: statusFor(actor, classificationUnchanged, content.methodologyClassification ?? undefined),
    updatedBy: actor,
  };
  const rows: MethodologyRow[] = input.rows.map((row) => {
    const previous = oldRows.get(row.id);
    return {
      ...row,
      revision: previous ? previous.revision + 1 : 1,
      sourceRevision,
      status: statusFor(actor, sameRow(previous, row), previous),
      updatedBy: actor,
    };
  });
  const methodElements = rows.map((row): ValidatedElement => {
    const previous = oldMethodElements.find((item) => item.id === row.id);
    const summary = methodSummary(row);
    return {
      approvedContent: previous?.approvedContent === summary ? summary : null,
      id: row.id,
      proposedContent: summary,
      referenceIds: [],
      revision: previous ? previous.revision + 1 : 1,
      sourceRevision,
      status: statusFor(actor, previous?.proposedContent === summary, previous),
      type: "methodology_mapping",
      updatedBy: actor,
    };
  });
  const titleElement: ValidatedElement = {
    approvedContent: oldTitle?.approvedContent === input.title ? input.title : null,
    id: oldTitle?.id ?? crypto.randomUUID(),
    proposedContent: input.title,
    referenceIds: [],
    revision: oldTitle ? oldTitle.revision + 1 : 1,
    sourceRevision,
    status: statusFor(actor, oldTitle?.proposedContent === input.title, oldTitle),
    type: "research_title",
    updatedBy: actor,
  };
  const removed = [...oldMethodElements, oldTitle].filter((item): item is ValidatedElement => Boolean(item));
  return researchWorkflowContentSchema.parse({
    ...content,
    activeStep: "methodology_matrix",
    coherenceFindings: [],
    elementVersions: archive(removed, content.elementVersions),
    elements: [
      ...content.elements.filter((item) => item.type !== "methodology_mapping" && item.type !== "research_title"),
      ...methodElements,
      titleElement,
    ],
    methodologyClassification: classification,
    methodologyRows: rows,
    traceLinks: content.traceLinks.filter((link) => !removed.some((item) => item.id === link.fromElementId || item.id === link.toElementId)),
  });
}

function planFromContent(content: ResearchWorkflowContent): MethodologyPlanInput | null {
  const title = element(content, "research_title")?.proposedContent;
  const classification = content.methodologyClassification;
  if (!title || !classification || content.methodologyRows.length === 0) return null;
  const classificationInput: MethodologyPlanInput["classification"] = {
    analysisTechniques: classification.analysisTechniques,
    approach: classification.approach,
    ethicsWarnings: classification.ethicsWarnings,
    instruments: classification.instruments,
    nature: classification.nature,
    objectives: classification.objectives,
    procedures: classification.procedures,
    rationale: classification.rationale,
  };
  return methodologyPlanInputSchema.parse({
    classification: classificationInput,
    rows: content.methodologyRows.map((row) => ({
      analysisTreatment: row.analysisTreatment,
      associatedTopicIds: row.associatedTopicIds,
      dataCollection: row.dataCollection,
      expectedResult: row.expectedResult,
      id: row.id,
      objectiveId: row.objectiveId,
      warnings: row.warnings,
    })),
    title,
  });
}

function planFromRequest(body: z.infer<typeof requestSchema>) {
  if (!body.title || !body.classification || !body.rows) throw new Error("A matriz metodológica está incompleta.");
  return methodologyPlanInputSchema.parse({
    classification: body.classification,
    rows: body.rows,
    title: body.title,
  });
}

function validateContext(workflow: ResearchWorkflow) {
  const discovery = workflow.content.discovery;
  const problem = element(workflow.content, "problem_statement");
  const general = element(workflow.content, "general_objective");
  const specifics = specificObjectives(workflow.content);
  const literature = chapterTopics(workflow.content, "literature");
  const development = chapterTopics(workflow.content, "development");
  if (!discovery || !problem?.approvedContent || !general?.approvedContent || specifics.length < 3 || literature.length < 3 || development.length < 3) {
    return null;
  }
  return { development, discovery, general, literature, problem, specifics };
}

async function saveWorkflow(
  workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  state: ResearchWorkflow["state"],
  stableState: ResearchWorkflow["stableState"],
  sourceRevision: number,
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  ownerId: string,
) {
  const revision = workflow.revision + 1;
  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("research_workflows")
    .update({ content: toJson(content), revision, source_revision: sourceRevision, stable_state: stableState, state, updated_at: updatedAt })
    .eq("project_id", workflow.projectId)
    .eq("owner_id", ownerId)
    .eq("revision", workflow.revision)
    .select("updated_at")
    .maybeSingle();
  return error || !data ? null : { ...workflow, content, revision, sourceRevision, stableState, state, updatedAt: data.updated_at };
}

function validationFindings(
  content: ResearchWorkflowContent,
  errors: string[],
  warnings: string[],
) {
  const methodIds = content.methodologyRows.map((row) => row.id);
  const titleId = element(content, "research_title")?.id;
  return [
    ...errors.map((message) => ({
      elementIds: methodIds.length > 0 ? methodIds : [titleId].filter((value): value is string => Boolean(value)),
      id: crypto.randomUUID(),
      message,
      resolution: null,
      rule: "Validação metodológica da Change 013",
      severity: "blocking" as const,
    })),
    ...warnings.map((message) => ({
      elementIds: methodIds.length > 0 ? methodIds : [titleId].filter((value): value is string => Boolean(value)),
      id: crypto.randomUUID(),
      message,
      resolution: "Aviso de coerência: confirme ou ajuste a célula correspondente.",
      rule: "Compatibilidade metodológica da Change 013",
      severity: "warning" as const,
    })),
  ];
}

function approveMethodology(
  content: ResearchWorkflowContent,
  sourceRevision: number,
  context: NonNullable<ReturnType<typeof validateContext>>,
) {
  const title = element(content, "research_title");
  if (!title || !content.methodologyClassification) throw new Error("Metodologia incompleta.");
  const validatedElements = content.elements.filter((item) => item.type === "methodology_mapping" || item.type === "research_title");
  const methodIds = new Set(content.methodologyRows.map((row) => row.id));
  const generalId = context.general.id;
  return researchWorkflowContentSchema.parse({
    ...content,
    activeStep: null,
    elementVersions: archive(validatedElements, content.elementVersions),
    elements: content.elements.map((item) => item.type === "methodology_mapping" || item.type === "research_title"
      ? { ...item, approvedContent: item.proposedContent, revision: item.revision + 1, sourceRevision, status: "validated" }
      : item),
    methodologyClassification: {
      ...content.methodologyClassification,
      revision: content.methodologyClassification.revision + 1,
      sourceRevision,
      status: "validated",
    },
    methodologyRows: content.methodologyRows.map((row) => ({
      ...row,
      revision: row.revision + 1,
      sourceRevision,
      status: "validated",
    })),
    traceLinks: [
      ...content.traceLinks.filter((link) => !methodIds.has(link.toElementId) && link.toElementId !== title.id),
      { fromElementId: generalId, rule: "O título final deriva do objetivo geral validado.", sourceRevision, toElementId: title.id },
      ...content.methodologyRows.flatMap((row) => [
        { fromElementId: row.objectiveId, rule: "A matriz metodológica operacionaliza o objetivo específico.", sourceRevision, toElementId: row.id },
        ...row.associatedTopicIds.map((topicId) => ({
          fromElementId: topicId,
          rule: "O tópico de capítulo informa a decisão metodológica.",
          sourceRevision,
          toElementId: row.id,
        })),
      ]),
    ],
  });
}

export async function POST(request: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) return NextResponse.json({ error: "Operação inválida." }, { status: 400 });

  const { supabase, userId } = await requireAuthenticatedUser();
  const workflow = await loadResearchWorkflow(supabase, userId, id);
  if (!workflow || workflow.revision !== parsed.data.revision) {
    return NextResponse.json({ error: "O mapa foi alterado em outra aba. Recarregue para continuar." }, { status: 409 });
  }
  const { action } = parsed.data;
  if (
    workflow.state !== "validating_methodology"
    || (workflow.content.activeStep !== "methodology_matrix" && !(action === "initialize" && workflow.content.activeStep === null))
  ) {
    return NextResponse.json({ error: "Esta não é a etapa metodológica ativa." }, { status: 409 });
  }
  const context = validateContext(workflow);
  if (!context) return NextResponse.json({ error: "Objetivos e capítulos precisam estar validados." }, { status: 409 });
  const approvedProblem = context.problem.approvedContent!;
  const approvedGeneral = context.general.approvedContent!;

  if (action === "back") {
    const content = researchWorkflowContentSchema.parse({ ...workflow.content, activeStep: "development_topics" });
    const saved = await saveWorkflow(workflow, content, "validating_development", "validating_development", workflow.sourceRevision, supabase, userId);
    return saved ? NextResponse.json({ workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  if (action === "initialize" && planFromContent(workflow.content)) {
    return NextResponse.json({ workflow });
  }

  let plan: MethodologyPlanInput;
  try {
    if (action === "initialize" || action === "regenerate") {
      plan = await generateMethodologyPlan(
        approvedProblem,
        approvedGeneral,
        context.specifics.map((item) => ({ content: item.approvedContent!, id: item.id })),
        context.literature,
        context.development,
        context.discovery,
        workflow.content.methodologyRows.map((row) => ({
          analysisTreatment: row.analysisTreatment,
          associatedTopicIds: row.associatedTopicIds,
          dataCollection: row.dataCollection,
          expectedResult: row.expectedResult,
          id: row.id,
          objectiveId: row.objectiveId,
          warnings: row.warnings,
        })),
      );
    } else {
      plan = planFromRequest(parsed.data);
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "A matriz metodológica está incompleta." }, { status: 400 });
  }

  let content = replaceMethodology(workflow.content, plan, workflow.sourceRevision, action === "initialize" || action === "regenerate" ? "ai" : "user");

  if (action === "save" || action === "initialize" || action === "regenerate") {
    const { warnings } = validateMethodologyPlan(plan, {
      allowedObjectiveIds: new Set(context.specifics.map((item) => item.id)),
      allowedTopicIds: new Set([...context.literature, ...context.development].map((topic) => topic.id)),
      generalObjective: approvedGeneral,
    });
    content = researchWorkflowContentSchema.parse({
      ...content,
      coherenceFindings: validationFindings(content, [], warnings),
    });
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase, userId);
    const message = action === "save" ? "Rascunho metodológico salvo." : action === "regenerate" ? "Nova sugestão metodológica criada." : undefined;
    return saved ? NextResponse.json({ message, workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  const { errors, warnings } = validateMethodologyPlan(plan, {
    allowedObjectiveIds: new Set(context.specifics.map((item) => item.id)),
    allowedTopicIds: new Set([...context.literature, ...context.development].map((topic) => topic.id)),
    generalObjective: approvedGeneral,
  });
  if (errors.length > 0) {
    content = researchWorkflowContentSchema.parse({ ...content, coherenceFindings: validationFindings(content, errors, warnings) });
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase, userId);
    return saved
      ? NextResponse.json({ errors, workflow: saved }, { status: 422 })
      : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  const sourceRevision = workflow.sourceRevision + 1;
  content = approveMethodology(
    researchWorkflowContentSchema.parse({ ...content, coherenceFindings: validationFindings(content, [], warnings) }),
    sourceRevision,
    context,
  );
  const saved = await saveWorkflow(workflow, content, "reviewing_map", "reviewing_map", sourceRevision, supabase, userId);
  if (!saved) return NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });

  const finalTitle = element(content, "research_title")?.approvedContent;
  if (finalTitle) {
    const { error } = await supabase
      .from("projects")
      .update({ title: finalTitle, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", userId)
      .eq("workflow_version", 2);
    if (error) return NextResponse.json({ error: "A metodologia foi validada, mas o título do projeto não foi atualizado.", workflow: saved }, { status: 500 });
  }

  return NextResponse.json({ message: "Metodologia validada.", workflow: saved });
}
