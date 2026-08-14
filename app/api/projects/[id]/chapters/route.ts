import { NextResponse } from "next/server";
import { z } from "zod";

import {
  generateDevelopmentTopics,
  generateLiteratureTopics,
} from "@/modules/generation/gemini";
import { toJson } from "@/modules/generation/types";
import { loadProjectAdvisorEmail } from "@/modules/projects/advisor";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { fetchResearchStarterReport } from "@/modules/research-starter/client";
import { pendingAdvisorReview, withAdvisorReviewRequest } from "@/modules/research-workflow/advisor-review";
import {
  chapterTopicsInputSchema,
  validateChapterTopics,
  validateCompleteObjectiveCoverage,
  type ChapterTopicInput,
} from "@/modules/research-workflow/chapter-validation";
import { suggestControlledConcepts } from "@/modules/research-workflow/knowledge-library";
import {
  proposalDiscoverySchema,
  researchWorkflowContentSchema,
  type ChapterTopicDetail,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type ValidatedElement,
} from "@/modules/research-workflow/schema";
import {
  buildOptimizedDiscoveryKeywords,
  buildOptimizedResearchQuery,
  normalizeLiteratureSearchTerms,
} from "@/modules/research-workflow/literature-optimization";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import {
  discoveryWithWorkflowReferences,
  studentContextNotes,
} from "@/modules/research-workflow/workflow-references";

export const maxDuration = 120;

const requestSchema = z.object({
  action: z.enum(["back", "concept", "initialize", "optimize", "regenerate", "save", "validate"]),
  conceptId: z.string().uuid().optional(),
  conceptStatus: z.enum(["accepted", "rejected"]).optional(),
  keywords: z.array(z.string().trim().min(2).max(160)).min(1).max(10).optional(),
  revision: z.number().int().positive(),
  step: z.enum(["literature", "development"]),
  topics: z.unknown().optional(),
});

function element(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.find((item) => item.type === type);
}

function specificObjectives(content: ResearchWorkflowContent) {
  return content.elements.filter((item) => item.type === "specific_objective" && item.status === "validated");
}

function topicsFromContent(content: ResearchWorkflowContent, chapter: "literature" | "development") {
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
        studentJustification: detail.studentJustification,
        title: topic.proposedContent,
      }] : [];
    });
}

function archive(elements: ValidatedElement[], history: ResearchWorkflowContent["elementVersions"]) {
  const now = new Date().toISOString();
  return elements.reduce((versions, item) => [...versions, { ...item, archivedAt: now, elementId: item.id }], history);
}

function replaceTopics(
  content: ResearchWorkflowContent,
  chapter: "literature" | "development",
  topics: ChapterTopicInput[],
  sourceRevision: number,
  actor: "ai" | "user",
) {
  const type = chapter === "literature" ? "literature_topic" : "development_topic";
  const oldElements = content.elements.filter((item) => item.type === type);
  const oldById = new Map(oldElements.map((item) => [item.id, item]));
  const nextElements = topics.map((topic): ValidatedElement => {
    const previous = oldById.get(topic.id);
    return {
      approvedContent: previous?.approvedContent === topic.title ? topic.title : null,
      id: topic.id,
      proposedContent: topic.title,
      referenceIds: [...new Set(topic.referenceIds)],
      revision: previous ? previous.revision + 1 : 1,
      sourceRevision,
      status: previous?.approvedContent === topic.title ? "validated" : actor === "ai" ? "suggested" : "edited",
      studentJustification: previous?.studentJustification ?? null,
      type,
      updatedBy: actor,
    };
  });
  const details: ChapterTopicDetail[] = topics.map((topic, index) => ({
    chapter,
    exceptionJustification: topic.exceptionJustification,
    generalObjectiveAligned: topic.generalObjectiveAligned,
    objectiveCoverage: topic.objectiveCoverage,
    order: index + 1,
    studentJustification: topic.studentJustification,
    topicId: topic.id,
  }));
  return researchWorkflowContentSchema.parse({
    ...content,
    chapterTopicDetails: [
      ...content.chapterTopicDetails.filter((detail) => detail.chapter !== chapter),
      ...details,
    ],
    elementVersions: archive(oldElements, content.elementVersions),
    elements: [...content.elements.filter((item) => item.type !== type), ...nextElements],
    traceLinks: content.traceLinks.filter((link) => !oldElements.some((item) => item.id === link.fromElementId || item.id === link.toElementId)),
  });
}

function addTraceLinks(
  content: ResearchWorkflowContent,
  chapter: "literature" | "development",
  sourceRevision: number,
  generalObjectiveId?: string | null,
) {
  const topics = topicsFromContent(content, chapter);
  return researchWorkflowContentSchema.parse({
    ...content,
    traceLinks: [
      ...content.traceLinks,
      ...topics.flatMap((topic) => topic.objectiveCoverage.map((coverage) => ({
        fromElementId: coverage.objectiveId,
        rule: coverage.objectiveId === generalObjectiveId
          ? "O tópico se articula ao objetivo geral no Capítulo 4."
          : chapter === "literature"
          ? `O tópico fundamenta o objetivo específico com cobertura ${coverage.degree}.`
          : "O tópico operacionaliza o objetivo específico no Capítulo 4.",
        sourceRevision,
        toElementId: topic.id,
      }))),
    ],
  });
}

function validateContext(workflow: ResearchWorkflow) {
  const discovery = workflow.content.discovery;
  const problem = element(workflow.content, "problem_statement");
  const general = element(workflow.content, "general_objective");
  const specifics = specificObjectives(workflow.content);
  if (!discovery || !problem?.approvedContent || !general?.approvedContent || specifics.length < 3) return null;
  return { discovery, general, problem, specifics };
}

function parseSubmittedTopics(input: unknown) {
  const parsed = chapterTopicsInputSchema.safeParse(input);
  if (parsed.success) return { errors: [], topics: parsed.data };
  return {
    errors: [...new Set(parsed.error.issues.map((issue) => {
      const [index, field] = issue.path;
      const label = typeof index === "number" ? `Tópico ${index + 1}` : "Tópicos";
      if (field === "title") return `${label}: informe um título entre 3 e 180 caracteres.`;
      if (field === "referenceIds") return `${label}: confira as referências associadas.`;
      if (field === "exceptionJustification") return `${label}: a justificativa da apresentação do estudo de caso deve ter no máximo 500 caracteres.`;
      if (field === "studentJustification") return `${label}: a justificativa do aluno deve ter no máximo 1000 caracteres.`;
      return `${label}: revise os campos obrigatórios.`;
    }))],
    topics: null,
  };
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

async function generatedLiteratureTopics(
  context: NonNullable<ReturnType<typeof validateContext>>,
  content: ResearchWorkflowContent,
) {
  const acceptedConcepts = content.knowledgeSuggestions
    .filter((suggestion) => suggestion.status === "accepted")
    .map((suggestion) => suggestion.term);
  const generated = await generateLiteratureTopics(
    context.problem.approvedContent!,
    context.general.approvedContent!,
    context.specifics.map((item) => ({ content: item.approvedContent!, id: item.id })),
    discoveryWithWorkflowReferences(context.discovery, content),
    acceptedConcepts,
    studentContextNotes(content),
  );
  return generated.map((topic) => ({ ...topic, id: crypto.randomUUID() }));
}

export async function POST(request: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  const requestBody = await request.json().catch(() => null);
  const normalizedRequestBody = requestBody
    && typeof requestBody === "object"
    && "action" in requestBody
    && !["save", "validate"].includes(String(requestBody.action))
    ? { ...requestBody, topics: undefined }
    : requestBody;
  const parsed = requestSchema.safeParse(normalizedRequestBody);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
  const { supabase, userId } = await requireAuthenticatedUser();
  const workflow = await loadResearchWorkflow(supabase, userId, id);
  if (!workflow || workflow.revision !== parsed.data.revision) {
    return NextResponse.json({ error: "O mapa foi alterado em outra aba. Recarregue para continuar." }, { status: 409 });
  }
  if (parsed.data.action === "validate" && pendingAdvisorReview(workflow.content)) {
    return NextResponse.json({ error: "Esta etapa já foi validada pelo estudante e está aguardando validação do orientador." }, { status: 409 });
  }
  const context = validateContext(workflow);
  if (!context) return NextResponse.json({ error: "Problemática e objetivos precisam estar validados." }, { status: 409 });
  const { action, step } = parsed.data;
  const activeStep = step === "literature" ? "literature_topics" : "development_topics";
  if (action !== "initialize" && workflow.content.activeStep !== activeStep) {
    return NextResponse.json({ error: "Esta não é a etapa ativa do projeto." }, { status: 409 });
  }

  if (action === "initialize") {
    if (workflow.state !== "validating_literature" || ![null, "literature_topics"].includes(workflow.content.activeStep)) {
      return NextResponse.json({ error: "A revisão da literatura não pode ser iniciada agora." }, { status: 409 });
    }
    if (topicsFromContent(workflow.content, "literature").length >= 3) return NextResponse.json({ workflow });
    const topics = await generatedLiteratureTopics(context, workflow.content);
    let content = replaceTopics(workflow.content, "literature", topics, workflow.sourceRevision, "ai");
    content = researchWorkflowContentSchema.parse({
      ...content,
      activeStep: "literature_topics",
      knowledgeSuggestions: [
        ...content.knowledgeSuggestions,
        ...suggestControlledConcepts(context.discovery.interpreted.keywords, content.knowledgeSuggestions),
      ],
    });
    const saved = await saveWorkflow(workflow, content, "validating_literature", "validating_literature", workflow.sourceRevision, supabase, userId);
    return saved ? NextResponse.json({ workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  if (action === "concept") {
    const { conceptId, conceptStatus } = parsed.data;
    if (!conceptId || !conceptStatus) return NextResponse.json({ error: "Conceito inválido." }, { status: 400 });
    const content = researchWorkflowContentSchema.parse({
      ...workflow.content,
      knowledgeSuggestions: workflow.content.knowledgeSuggestions.map((suggestion) => suggestion.id === conceptId
        ? { ...suggestion, status: conceptStatus }
        : suggestion),
    });
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase, userId);
    return saved ? NextResponse.json({ message: "Preferência registrada.", workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  if (action === "back") {
    const content = researchWorkflowContentSchema.parse({
      ...workflow.content,
      activeStep: step === "development" ? "literature_topics" : "specific_objectives",
    });
    const state = step === "development" ? "validating_literature" : "validating_specific_objectives";
    const saved = await saveWorkflow(workflow, content, state, state, workflow.sourceRevision, supabase, userId);
    return saved ? NextResponse.json({ workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  if (action === "optimize") {
    if (step !== "literature" || !parsed.data.keywords) return NextResponse.json({ error: "Palavras-chave inválidas." }, { status: 400 });
    const searchTerms = normalizeLiteratureSearchTerms(parsed.data.keywords);
    if (searchTerms.length === 0) return NextResponse.json({ error: "Informe uma frase ou palavra-chave para otimizar a literatura." }, { status: 400 });
    const topic = buildOptimizedResearchQuery(searchTerms);
    let report = await fetchResearchStarterReport({ includeMarkdown: false, maxReferences: 20, maxTopPapers: 10, publicationInterval: { kind: "last-5-years" }, topic });
    if (report.references.length === 0) {
      report = await fetchResearchStarterReport({ includeMarkdown: false, maxReferences: 20, maxTopPapers: 10, publicationInterval: { kind: "last-10-years" }, topic });
    }
    if (report.references.length === 0) return NextResponse.json({ error: "Nenhuma referência verificável foi encontrada. A versão anterior foi preservada." }, { status: 422 });
    const optimizedKeywords = buildOptimizedDiscoveryKeywords(searchTerms, report, context.discovery.interpreted.keywords);
    const nextDiscovery = proposalDiscoverySchema.parse({
      ...context.discovery,
      generatedAt: new Date().toISOString(),
      interpreted: { ...context.discovery.interpreted, keywords: optimizedKeywords, researchQuery: topic },
      references: report.references.slice(0, 20).map(({ authors, doi, referenceId, title, url, year }) => ({ authors: authors.slice(0, 8), doi, referenceId, title, url, year })),
      reportId: report.reportId,
      warnings: report.warnings.slice(0, 12),
    });
    const optimizedContext = { ...context, discovery: nextDiscovery };
    const topics = await generatedLiteratureTopics(optimizedContext, workflow.content);
    let content = replaceTopics(workflow.content, "literature", topics, workflow.sourceRevision, "ai");
    content = researchWorkflowContentSchema.parse({
      ...content,
      discovery: nextDiscovery,
      referenceArchive: [...content.referenceArchive, ...context.discovery.references].slice(-100),
    });
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase, userId);
    return saved ? NextResponse.json({ message: "Literatura otimizada com novas referências.", workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  let content = workflow.content;
  if (action === "save" || action === "validate") {
    if (!parsed.data.topics) return NextResponse.json({ errors: ["Inclua os tópicos da etapa."], error: "Inclua os tópicos da etapa." }, { status: 422 });
    const submittedTopics = parseSubmittedTopics(parsed.data.topics);
    if (!submittedTopics.topics) {
      return NextResponse.json({ errors: submittedTopics.errors, error: submittedTopics.errors[0] ?? "Revise os tópicos da etapa." }, { status: 422 });
    }
    content = replaceTopics(content, step, submittedTopics.topics, workflow.sourceRevision, "user");
  } else if (action === "regenerate") {
    const existing = topicsFromContent(content, step);
    const generated = step === "literature"
      ? await generatedLiteratureTopics(context, content)
      : (await generateDevelopmentTopics(
          context.problem.approvedContent!,
          context.general.approvedContent!,
          context.general.id,
          context.specifics.map((item) => ({ content: item.approvedContent!, id: item.id })),
          topicsFromContent(content, "literature"),
          discoveryWithWorkflowReferences(context.discovery, content),
          studentContextNotes(content),
        )).map((topic) => ({ ...topic, id: crypto.randomUUID() }));
    const stable = generated.map((topic, index) => ({ ...topic, id: existing[index]?.id ?? topic.id }));
    content = replaceTopics(content, step, stable, workflow.sourceRevision, "ai");
  }

  if (action === "save" || action === "regenerate") {
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase, userId);
    return saved ? NextResponse.json({ message: action === "save" ? "Rascunho salvo." : "Nova sugestão criada.", workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  const currentTopics = topicsFromContent(content, step);
  const specificObjectiveIds = new Set(context.specifics.map((item) => item.id));
  const allowedObjectiveIds = step === "development"
    ? new Set([...specificObjectiveIds, context.general.id])
    : specificObjectiveIds;
  const allowedReferenceIds = new Set([
    ...context.discovery.references.map((reference) => reference.referenceId),
    ...content.referenceArchive.map((reference) => reference.referenceId),
  ]);
  const errors = validateChapterTopics(currentTopics, { allowedObjectiveIds, allowedReferenceIds, chapter: step, generalObjectiveId: context.general.id });
  if (step === "development") {
    errors.push(...validateCompleteObjectiveCoverage(topicsFromContent(content, "literature"), currentTopics, [...specificObjectiveIds]));
  }
  if (errors.length > 0) return NextResponse.json({ errors: [...new Set(errors)], error: "Revise a cobertura antes de avançar." }, { status: 422 });

  const sourceRevision = workflow.sourceRevision + 1;
  const type = step === "literature" ? "literature_topic" : "development_topic";
  const validatedElements = content.elements.filter((item) => item.type === type);
  content = researchWorkflowContentSchema.parse({
    ...content,
    elementVersions: archive(validatedElements, content.elementVersions),
    elements: content.elements.map((item) => item.type === type
      ? { ...item, approvedContent: item.proposedContent, revision: item.revision + 1, sourceRevision, status: "validated" }
      : item),
  });
  content = addTraceLinks(content, step, sourceRevision, context.general.id);
  if (step === "literature") {
    const generated = await generateDevelopmentTopics(
      context.problem.approvedContent!,
      context.general.approvedContent!,
      context.general.id,
      context.specifics.map((item) => ({ content: item.approvedContent!, id: item.id })),
      currentTopics,
      discoveryWithWorkflowReferences(context.discovery, content),
      studentContextNotes(content),
    );
    content = replaceTopics(content, "development", generated.map((topic) => ({ ...topic, id: crypto.randomUUID() })), sourceRevision, "ai");
    content = researchWorkflowContentSchema.parse({ ...content, activeStep: "development_topics" });
    const advisorEmail = await loadProjectAdvisorEmail(supabase, userId, id);
    const shouldWaitForAdvisor = Boolean(advisorEmail);
    if (shouldWaitForAdvisor) {
      content = withAdvisorReviewRequest(
        researchWorkflowContentSchema.parse({ ...content, activeStep: "literature_topics" }),
        {
          advisorEmail,
          sourceRevision,
          step: "literature_topics",
          transition: { targetActiveStep: "development_topics", targetStableState: "validating_development", targetState: "validating_development" },
        },
      );
    }
    const saved = await saveWorkflow(
      workflow,
      content,
      shouldWaitForAdvisor ? workflow.state : "validating_development",
      shouldWaitForAdvisor ? workflow.stableState : "validating_development",
      sourceRevision,
      supabase,
      userId,
    );
    return saved
      ? NextResponse.json({ message: shouldWaitForAdvisor ? "Capítulo 2 validado pelo estudante. Aguardando validação do orientador." : "Capítulo 2 validado.", workflow: saved })
      : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }
  content = researchWorkflowContentSchema.parse({ ...content, activeStep: "methodology_matrix" });
  const advisorEmail = await loadProjectAdvisorEmail(supabase, userId, id);
  const shouldWaitForAdvisor = Boolean(advisorEmail);
  if (shouldWaitForAdvisor) {
    content = withAdvisorReviewRequest(
      researchWorkflowContentSchema.parse({ ...content, activeStep: "development_topics" }),
      {
        advisorEmail,
        sourceRevision,
        step: "development_topics",
        transition: { targetActiveStep: "methodology_matrix", targetStableState: "validating_methodology", targetState: "validating_methodology" },
      },
    );
  }
  const saved = await saveWorkflow(
    workflow,
    content,
    shouldWaitForAdvisor ? workflow.state : "validating_methodology",
    shouldWaitForAdvisor ? workflow.stableState : "validating_methodology",
    sourceRevision,
    supabase,
    userId,
  );
  return saved
    ? NextResponse.json({ message: shouldWaitForAdvisor ? "Capítulo 4 validado pelo estudante. Aguardando validação do orientador." : "Capítulo 4 validado.", workflow: saved })
    : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
}
