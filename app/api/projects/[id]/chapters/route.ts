import { topicsFromContent, replaceTopics } from "@/modules/research-workflow/chapter-content";
import { withAiProgress } from "@/modules/ai/route";
import { contentWithDraft, saveVersionedWorkflow } from "@/modules/research-workflow/save-versioned-workflow";
import { canNavigateToWorkflowTarget, workflowForView } from "@/modules/research-workflow/workflow-navigation";
import { NextResponse } from "next/server";
import { z } from "zod";

import { notifyAdvisorOfReviewRequest } from "@/lib/email/project-notifications";
import {
  generateDevelopmentTopics,
  generateLiteratureTopics,
} from "@/modules/generation/gemini";
import { claimEmail, loadProjectAdvisorEmail } from "@/modules/projects/advisor";
import {
  authorizeProjectCapabilityResponse,
  authorizeProjectRoute,
  type AuthorizedProjectContext,
} from "@/modules/projects/auth";
import { fetchResearchStarterReport, ResearchStarterClientError } from "@/modules/research-starter/client";
import {
  projectAdvisorGate,
  STUDENT_ADVISOR_REQUIRED_CODE,
  STUDENT_ADVISOR_REQUIRED_MESSAGE,
} from "@/modules/research-workflow/advisor-requirement";
import { pendingAdvisorReview, withAdvisorReviewRequest } from "@/modules/research-workflow/advisor-review";
import { currentGuidanceNotesSchema, regenerationGuidanceSchema, scopedCurrentGuidanceNotes, scopedRegenerationGuidance } from "@/modules/research-workflow/regeneration-guidance";
import {
  chapterTopicsInputSchema,
  chapterTopicsDraftSchema,
  chapterInputErrors,
  objectiveCoverageLabel,
  validateChapterTopics,
  validateCompleteObjectiveCoverage,
} from "@/modules/research-workflow/chapter-validation";
import { suggestControlledConcepts } from "@/modules/research-workflow/knowledge-library";
import {
  researchWorkflowContentSchema,
  discoveryReferenceSchema,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type ValidatedElement,
} from "@/modules/research-workflow/schema";
import {
  buildOptimizedResearchQuery,
  normalizeLiteratureSearchTerms,
} from "@/modules/research-workflow/literature-optimization";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import {
  discoveryWithWorkflowReferences,
  mergeReferenceArchive,
  studentContextNotes,
} from "@/modules/research-workflow/workflow-references";

export const maxDuration = 120;

const requestSchema = z.object({
  action: z.enum(["back", "concept", "initialize", "optimize", "regenerate", "save", "validate"]),
  conceptId: z.string().uuid().optional(),
  conceptStatus: z.enum(["accepted", "rejected"]).optional(),
  keywords: z.array(z.string().trim().min(2).max(160)).min(1).max(10).optional(),
  revision: z.number().int().positive(),
  currentGuidanceNotes: currentGuidanceNotesSchema,
  regenerationGuidance: regenerationGuidanceSchema,
  step: z.enum(["literature", "development"]),
  topics: z.unknown().optional(),
});

function archive(elements: ValidatedElement[], history: ResearchWorkflowContent["elementVersions"]) {
  const now = new Date().toISOString();
  return elements.reduce((versions, item) => [...versions, { ...item, archivedAt: now, elementId: item.id }], history);
}

function element(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.find((item) => item.type === type);
}

function specificObjectives(content: ResearchWorkflowContent) {
  return content.elements.filter((item) => item.type === "specific_objective" && item.status === "validated");
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
          ? `O tópico fundamenta o objetivo específico com cobertura: ${objectiveCoverageLabel(coverage.degree)}.`
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

function parseSubmittedTopics(input: unknown, draft = false) {
  const parsed = (draft ? chapterTopicsDraftSchema : chapterTopicsInputSchema).safeParse(input);
  return parsed.success ? { errors: [], topics: parsed.data } : { errors: chapterInputErrors(parsed.error), topics: null };
}

async function generatedLiteratureTopics(
  context: NonNullable<ReturnType<typeof validateContext>>,
  content: ResearchWorkflowContent,
  guidance = studentContextNotes(content),
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
    guidance,
  );
  return generated.map((topic) => ({ ...topic, id: crypto.randomUUID() }));
}

async function handlePost(request: Request, routeContext: { params: Promise<{ id: string }> }) {
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
  const access = await authorizeProjectRoute({ mutation: true, projectId: id, request });
  if (!access.ok) return access.response;
  const { actor, supabase, userId } = access.value;
  const claims = actor.claims;
  const isSelfDirectedProject = access.value.project.authoring_role === "advisor";
  const editAction = parsed.data.action;
  const editStep = parsed.data.step === "literature" ? "literature_topics" : "development_topics";
  const baseWorkflow = await loadResearchWorkflow(supabase, userId, id);
  const workflow = baseWorkflow ? { ...baseWorkflow, content: contentWithDraft(baseWorkflow, parsed.data.step === "literature" ? "literature_topics" : "development_topics") } : null;
async function saveWorkflow(
  _workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  state: ResearchWorkflow["state"],
  stableState: ResearchWorkflow["stableState"],
  sourceRevision: number,
  supabase: AuthorizedProjectContext["supabase"],
) {
  return saveVersionedWorkflow(supabase, { base: baseWorkflow!, content, state, stableState, sourceRevision, step: editStep, action: editAction === "optimize" ? "augment_references" : editAction });
}
  if (!workflow || workflow.revision !== parsed.data.revision) {
    return NextResponse.json({ error: "O mapa foi alterado em outra aba. Recarregue para continuar." }, { status: 409 });
  }
  if (!isSelfDirectedProject && parsed.data.action !== "back" && pendingAdvisorReview(workflow.content)) {
    return NextResponse.json({ error: "Esta etapa já foi validada pelo estudante e está aguardando revisão." }, { status: 409 });
  }
  const context = validateContext(workflow);
  if (!context) return NextResponse.json({ error: "Problemática e objetivos precisam estar validados." }, { status: 409 });
  const { action, step } = parsed.data;
  const activeStep = step === "literature" ? "literature_topics" : "development_topics";
  if (!canNavigateToWorkflowTarget(workflow, activeStep)) {
    return NextResponse.json({ error: "Esta não é a etapa ativa do projeto." }, { status: 409 });
  }
  const advisorGate = action === "validate"
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

  if (action === "initialize") {
    if (!canNavigateToWorkflowTarget(workflow, "literature_topics")) {
      return NextResponse.json({ error: "A revisão da literatura não pode ser iniciada agora." }, { status: 409 });
    }
    if (topicsFromContent(workflow.content, step).length > 0) return NextResponse.json({ workflow: workflowForView(baseWorkflow!, activeStep) });
    if (step !== "literature") return NextResponse.json({ error: "Confirme a revisão da literatura em Próximo para preparar o desenvolvimento." }, { status: 409 });
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
    const saved = await saveWorkflow(workflow, content, "validating_literature", "validating_literature", workflow.sourceRevision, supabase);
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
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase);
    return saved ? NextResponse.json({ message: "Preferência registrada.", workflow: saved }) : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }

  if (action === "back") {
    return NextResponse.json({ workflow: workflowForView(baseWorkflow!, step === "development" ? "literature_topics" : "specific_objectives") });
  }

  if (action === "optimize") {
    if (step !== "literature" || !parsed.data.keywords) return NextResponse.json({ error: "Palavras-chave inválidas." }, { status: 400 });
    const searchTerms = normalizeLiteratureSearchTerms(parsed.data.keywords);
    if (searchTerms.length === 0) return NextResponse.json({ error: "Informe uma frase ou palavra-chave para otimizar a literatura." }, { status: 400 });
    try {
      const topic = buildOptimizedResearchQuery(searchTerms);
      let report = await fetchResearchStarterReport({ includeMarkdown: false, maxReferences: 20, maxTopPapers: 10, publicationInterval: { kind: "last-5-years" }, topic });
      if (report.references.length === 0) {
        report = await fetchResearchStarterReport({ includeMarkdown: false, maxReferences: 20, maxTopPapers: 10, publicationInterval: { kind: "last-10-years" }, topic });
      }
      if (report.references.length === 0) return NextResponse.json({ error: "Nenhuma referência verificável foi encontrada. A versão anterior foi preservada; revise as palavras-chave e tente novamente." }, { status: 422 });
      const newReferences = report.references.slice(0, 20).map(({ authors, doi, referenceId, title, url, year }) => discoveryReferenceSchema.parse({ authors: authors.slice(0, 8), doi, referenceId, title, url, year }));
      // Adding literature never regenerates topics or replaces their links.
      const archivedReferences = mergeReferenceArchive(baseWorkflow!.content.referenceArchive, [...context.discovery.references, ...newReferences]);
      const priorIds = new Set([...baseWorkflow!.content.referenceArchive, ...context.discovery.references].map((reference) => reference.referenceId));
      const added = newReferences.filter((reference) => !priorIds.has(reference.referenceId)).length;
      const content = researchWorkflowContentSchema.parse({ ...baseWorkflow!.content, referenceArchive: archivedReferences });
      const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase);
      if (!saved) return NextResponse.json({ error: "O mapa foi alterado em outra aba. As referências anteriores foram preservadas; recarregue e tente novamente." }, { status: 409 });
      const partialNotice = report.status === "partial" ? " A busca retornou resultados parciais; confira as fontes." : "";
      return NextResponse.json({ message: `${added} nova(s) referência(s) adicionada(s). Os tópicos, referências anteriores e associações foram preservados.${partialNotice}`, workflow: saved });
    } catch (error) {
      if (error instanceof ResearchStarterClientError) {
        const retryMessage = error.retryable ? " Tente novamente em instantes; a versão anterior foi preservada." : " A versão anterior foi preservada.";
        return NextResponse.json({ error: `${error.message}${retryMessage}` }, { status: error.retryable ? 503 : 502 });
      }
      return NextResponse.json({ error: "Não foi possível concluir a otimização da literatura. A versão anterior foi preservada; tente novamente." }, { status: 502 });
    }
  }

  let content = workflow.content;
  if (action === "save" || action === "validate") {
    if (!parsed.data.topics) return NextResponse.json({ errors: ["Inclua os tópicos da etapa."], error: "Inclua os tópicos da etapa." }, { status: 422 });
    const submittedTopics = parseSubmittedTopics(parsed.data.topics, action === "save");
    if (!submittedTopics.topics) {
      return NextResponse.json({ errors: submittedTopics.errors, error: submittedTopics.errors[0] ?? "Revise os tópicos da etapa." }, { status: 422 });
    }
    content = replaceTopics(content, step, submittedTopics.topics, workflow.sourceRevision, "user");
  } else if (action === "regenerate") {
    const existing = topicsFromContent(content, step);
    let oneTimeGuidance: string[];
    try {
      const currentNotes = scopedCurrentGuidanceNotes(parsed.data.currentGuidanceNotes, new Set(existing.map((topic) => topic.id)));
      const noteById = new Map(currentNotes.map((entry) => [entry.id, entry.note]));
      content = researchWorkflowContentSchema.parse({
        ...content,
        elements: content.elements.map((element) => noteById.has(element.id)
          ? { ...element, studentJustification: noteById.get(element.id) }
          : element),
        chapterTopicDetails: content.chapterTopicDetails.map((detail) => detail.chapter === step && noteById.has(detail.topicId)
          ? { ...detail, studentJustification: noteById.get(detail.topicId) }
          : detail),
      });
      oneTimeGuidance = scopedRegenerationGuidance(parsed.data.regenerationGuidance, new Map(existing.map((topic, index) => [topic.id, `o tópico ${step === "literature" ? "2" : "4"}.${index + 1}`])));
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Orientação inválida." }, { status: 400 });
    }
    const currentTopics = topicsFromContent(content, step);
    const stageNotes = currentTopics.flatMap((topic, index) => topic.studentJustification?.trim()
      ? [`Contexto salvo do tópico ${step === "literature" ? "2" : "4"}.${index + 1}: ${topic.studentJustification.trim()}`]
      : []);
    const guidance = [...oneTimeGuidance, ...stageNotes, ...studentContextNotes(content)];
    const generated = step === "literature"
      ? await generatedLiteratureTopics(context, content, guidance)
      : (await generateDevelopmentTopics(
          context.problem.approvedContent!,
          context.general.approvedContent!,
          context.general.id,
          context.specifics.map((item) => ({ content: item.approvedContent!, id: item.id })),
          topicsFromContent(content, "literature"),
          discoveryWithWorkflowReferences(context.discovery, content),
          guidance,
        )).map((topic) => ({ ...topic, id: crypto.randomUUID() }));
    const stable = generated.map((topic, index) => ({ ...topic, id: currentTopics[index]?.id ?? topic.id, studentJustification: currentTopics[index]?.studentJustification ?? null }));
    content = replaceTopics(content, step, stable, workflow.sourceRevision, "ai");
  }

  if (action === "save" && JSON.stringify(topicsFromContent(content, step)) === JSON.stringify(topicsFromContent(workflow.content, step))) {
    return NextResponse.json({ message: "Rascunho já salvo.", workflow: workflowForView(baseWorkflow!, activeStep) });
  }
  if (action === "save" || action === "regenerate") {
    const saved = await saveWorkflow(workflow, content, workflow.state, workflow.stableState, workflow.sourceRevision, supabase);
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
  const errors = validateChapterTopics(currentTopics, {
    allowedObjectiveIds,
    allowedReferenceIds,
    chapter: step,
    generalObjectiveId: context.general.id,
    requireStudentJustification: !isSelfDirectedProject,
  });
  if (step === "development") {
    errors.push(...validateCompleteObjectiveCoverage(topicsFromContent(content, "literature"), currentTopics, [...specificObjectiveIds]));
  }
  const advisoryMessages = [...new Set(errors)];
  if (advisoryMessages.length > 0) {
    content = researchWorkflowContentSchema.parse({
      ...content,
      coherenceFindings: [
        ...content.coherenceFindings.filter((finding) => finding.rule !== "Orientação de capítulos da Change 068"),
        ...advisoryMessages.map((message) => ({
          elementIds: currentTopics.map((topic) => topic.id),
          id: crypto.randomUUID(),
          message,
          resolution: "Sugestão de revisão: você pode seguir agora e ajustar a cobertura depois.",
          rule: "Orientação de capítulos da Change 068",
          severity: "warning" as const,
        })),
      ],
    });
  }

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
    const existingDevelopmentTopics = topicsFromContent(content, "development");
    const reuseExistingDevelopment = existingDevelopmentTopics.length > 0;
    if (!reuseExistingDevelopment) {
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
    }
    content = researchWorkflowContentSchema.parse({ ...content, activeStep: "development_topics" });
    const advisorEmail = advisorGate?.kind === "advisor_review" ? advisorGate.advisorEmail : null;
    const shouldWaitForAdvisor = advisorGate?.kind === "advisor_review";
    if (shouldWaitForAdvisor) {
      const supervisionError = authorizeProjectCapabilityResponse(
        access.value,
        "student_supervision",
      );
      if (supervisionError) return supervisionError;

      content = withAdvisorReviewRequest(
        researchWorkflowContentSchema.parse({ ...content, activeStep: "literature_topics" }),
        {
          advisorEmail,
          sourceRevision,
          step: "literature_topics",
          studentEmail: claimEmail(claims as Record<string, unknown>),
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
      ? NextResponse.json({ message: shouldWaitForAdvisor ? "Capítulo 2 validado pelo estudante. Aguardando revisão." : reuseExistingDevelopment ? "Capítulo 2 validado. A versão já existente do Capítulo 4 foi preservada." : "Capítulo 2 validado.", workflow: saved })
      : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
  }
  content = researchWorkflowContentSchema.parse({ ...content, activeStep: "methodology_matrix" });
  const advisorEmail = advisorGate?.kind === "advisor_review" ? advisorGate.advisorEmail : null;
  const shouldWaitForAdvisor = advisorGate?.kind === "advisor_review";
  if (shouldWaitForAdvisor) {
    const supervisionError = authorizeProjectCapabilityResponse(
      access.value,
      "student_supervision",
    );
    if (supervisionError) return supervisionError;

    content = withAdvisorReviewRequest(
      researchWorkflowContentSchema.parse({ ...content, activeStep: "development_topics" }),
      {
        advisorEmail,
        sourceRevision,
        step: "development_topics",
        studentEmail: claimEmail(claims as Record<string, unknown>),
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
    ? NextResponse.json({ message: shouldWaitForAdvisor ? "Capítulo 4 validado pelo estudante. Aguardando revisão." : "Capítulo 4 validado.", workflow: saved })
    : NextResponse.json({ error: "O mapa foi alterado em outra aba." }, { status: 409 });
}

export const POST = withAiProgress(handlePost);
