"use client";
import { saveThenCompleteStep } from "./complete-step-client";
import { methodologyIssues } from "./methodology-assistance";
import { useRegenerationRequests } from "./use-regeneration-requests";
import { saveThenRegenerateCard } from "./regenerate-card-client";
import { WorkflowAction } from "./workflow-action";
import { useAiProgress } from "@/modules/ai/use-ai-progress";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState, type MouseEvent } from "react";

import { ResearchActivityIcon } from "@/modules/generation/research-activity-icon";
import { getAnalyticsWorkflowPosition, getReferenceCountBucket, setAnalyticsContext, trackAnalyticsEvent } from "@/modules/analytics/analytics";
import { profileMutationHeaders, useActiveProfile } from "@/modules/profile/active-profile-context";
import { pendingAdvisorReview } from "./advisor-review";
import { AiGuidanceField } from "./ai-guidance-field";
import { AdvisorReviewNotice } from "./advisor-review-notice";
import type { ChapterTopicInput } from "./chapter-validation";
import { FINAL_TITLE_MAX_LENGTH, FINAL_TITLE_RECOMMENDED_LENGTH, methodologyCompatibilityWarnings, type MethodologyPlanInput } from "./methodology-validation";
import { WorkflowHistory } from "./workflow-history";
import { WorkflowProgress, type WorkflowProgressHandle } from "./workflow-progress";
import { workflowForView, workflowNavigationUrl } from "./workflow-navigation";
import { reconcileTopicLinks } from "./topic-integrity";
import type { ResearchWorkflow } from "./schema";

type Props = { initialWorkflow: ResearchWorkflow; isSelfDirectedProject?: boolean; projectId: string };
type Operation = "back" | "complete" | "initialize" | "regenerate" | "save" | "validate" | null;
type ClassificationDraft = MethodologyPlanInput["classification"];
type MethodologyRowDraft = MethodologyPlanInput["rows"][number];
type WorkflowReference = NonNullable<ResearchWorkflow["content"]["discovery"]>["references"][number];
type MethodologyHelpTopic = "approach" | "nature" | "objectives" | "regeneration";

const METHODOLOGY_HELP: Record<MethodologyHelpTopic, { body: string; title: string }> = {
  regeneration: { body: "Este pedido será usado somente na próxima regeneração.", title: "Pedido pontual" },
  approach: {
    body: "Qualitativa interpreta sentidos, experiências, documentos ou processos. Quantitativa mede variáveis e usa números/estatística. Mista combina as duas quando a pesquisa precisa interpretar e medir.",
    title: "Abordagem",
  },
  nature: {
    body: "Básica busca ampliar conhecimento teórico sobre um fenômeno. Aplicada usa esse conhecimento para resolver, orientar ou melhorar uma situação prática, produto, processo ou intervenção.",
    title: "Natureza",
  },
  objectives: {
    body: "Exploratória aproxima e mapeia um tema pouco definido. Descritiva caracteriza uma realidade, perfil ou processo. Explicativa busca relações, causas ou fatores que ajudam a explicar o fenômeno.",
    title: "Objetivos metodológicos",
  },
};

const EMPTY_CLASSIFICATION: ClassificationDraft = {
  analysisTechniques: [],
  approach: "Qualitativa",
  ethicsWarnings: [],
  instruments: [],
  nature: "Aplicada",
  objectives: ["Exploratória", "Descritiva"],
  procedures: [],
  rationale: "",
};

function findTitle(workflow: ResearchWorkflow) {
  return workflow.content.elements.find((element) => element.type === "research_title")?.proposedContent ?? "";
}

function specificObjectives(workflow: ResearchWorkflow) {
  return workflow.content.elements.filter((element) => element.type === "specific_objective" && element.status === "validated");
}

function generalObjective(workflow: ResearchWorkflow) {
  return workflow.content.elements.find((element) => element.type === "general_objective" && element.status === "validated");
}

function methodologyObjectives(workflow: ResearchWorkflow) {
  const specifics = specificObjectives(workflow).map((objective, index) => ({
    content: objective.approvedContent ?? objective.proposedContent,
    id: objective.id,
    label: `OE${index + 1}`,
    type: "specific" as const,
  }));
  const general = generalObjective(workflow);
  return [
    ...specifics,
    ...(general ? [{
      content: general.approvedContent ?? general.proposedContent,
      id: general.id,
      label: "OEG",
      type: "general" as const,
    }] : []),
  ];
}

function readTopics(workflow: ResearchWorkflow, chapter: "literature" | "development"): ChapterTopicInput[] {
  const type = chapter === "literature" ? "literature_topic" : "development_topic";
  const elements = new Map(workflow.content.elements.filter((element) => element.type === type).map((element) => [element.id, element]));
  return workflow.content.chapterTopicDetails
    .filter((detail) => detail.chapter === chapter)
    .toSorted((left, right) => left.order - right.order)
    .flatMap((detail) => {
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

function classificationDraft(workflow: ResearchWorkflow): ClassificationDraft {
  const classification = workflow.content.methodologyClassification;
  if (!classification) return EMPTY_CLASSIFICATION;
  return {
    analysisTechniques: classification.analysisTechniques,
    approach: classification.approach,
    ethicsWarnings: classification.ethicsWarnings,
    instruments: classification.instruments,
    nature: classification.nature,
    objectives: classification.objectives,
    procedures: classification.procedures,
    rationale: classification.rationale,
  };
}

function rowsDraft(workflow: ResearchWorkflow): MethodologyRowDraft[] {
  return reconcileTopicLinks(workflow.content).methodologyRows.map((row) => ({
    analysisTreatment: row.analysisTreatment,
    associatedTopicIds: row.associatedTopicIds,
    dataCollection: row.dataCollection,
    expectedResult: row.expectedResult,
    id: row.id,
    objectiveId: row.objectiveId,
    studentJustification: row.studentJustification,
    warnings: row.warnings,
  }));
}

function textToList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

function ethicsTextToList(value: string) {
  return value.split(/\n+/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
}

function listToText(items: string[]) {
  return items.join(", ");
}

function listToEthicsText(items: string[]) {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length > 1 && cleaned.some((item) => item.length < 10)) return cleaned.join(", ");
  return cleaned.join("\n");
}

function referenceText(reference: WorkflowReference) {
  const author = reference.authors[0] ?? "Fonte";
  return `${author}${reference.year ? ` (${reference.year})` : ""}. ${reference.title ?? reference.referenceId}`;
}

function methodologyMessageText(message: string) {
  return message
    .replace(/^Linha (\d+)(?=:)/i, (_, index: string) => `OE${index} (objetivo específico ${index})`)
    .replace(/^A linha (\d+)/i, (_, index: string) => `OE${index} (objetivo específico ${index})`);
}

export function MethodologyWorkspace({ initialWorkflow, isSelfDirectedProject = false, projectId }: Props) {
  const aiProgress = useAiProgress();
  const router = useRouter();
  const progressRef = useRef<WorkflowProgressHandle>(null);
  const { activeRole, roleVersion } = useActiveProfile();
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [title, setTitle] = useState(() => findTitle(initialWorkflow));
  const [classification, setClassification] = useState<ClassificationDraft>(() => classificationDraft(initialWorkflow));
  const [proceduresText, setProceduresText] = useState(() => listToText(classificationDraft(initialWorkflow).procedures));
  const [instrumentsText, setInstrumentsText] = useState(() => listToText(classificationDraft(initialWorkflow).instruments));
  const [analysisText, setAnalysisText] = useState(() => listToText(classificationDraft(initialWorkflow).analysisTechniques));
  const [ethicsText, setEthicsText] = useState(() => listToEthicsText(classificationDraft(initialWorkflow).ethicsWarnings));
  const [rows, setRows] = useState<MethodologyRowDraft[]>(() => rowsDraft(initialWorkflow));
  const [regenerationRequests, updateRequest] = useRegenerationRequests(projectId);
  const [operation, setOperation] = useState<Operation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [openHelp, setOpenHelp] = useState<MethodologyHelpTopic | null>(null);
  const busy = operation !== null;
  const waitingForAdvisor = !isSelfDirectedProject && Boolean(pendingAdvisorReview(workflow.content));
  const validateButtonLabel = "Próximo";
  const objectives = methodologyObjectives(workflow);
  const general = generalObjective(workflow);
  const literatureTopics = readTopics(workflow, "literature");
  const developmentTopics = readTopics(workflow, "development");
  const topics = [...literatureTopics.map((topic) => ({ ...topic, chapterLabel: "Cap. 2" })), ...developmentTopics.map((topic) => ({ ...topic, chapterLabel: "Cap. 4" }))];
  const references = [...(workflow.content.discovery?.references ?? []), ...workflow.content.referenceArchive]
    .filter((reference, index, all) => all.findIndex((item) => item.referenceId === reference.referenceId) === index);
  const referenceById = new Map(references.map((reference) => [reference.referenceId, reference]));
  const currentClassification = useMemo<ClassificationDraft>(() => ({
    ...classification,
    analysisTechniques: textToList(analysisText),
    ethicsWarnings: ethicsTextToList(ethicsText),
    instruments: textToList(instrumentsText),
    procedures: textToList(proceduresText),
  }), [analysisText, classification, ethicsText, instrumentsText, proceduresText]);
  const savedPlan = JSON.stringify({ classification: classificationDraft(workflow), rows: rowsDraft(workflow), title: findTitle(workflow) });
  const currentPlan = JSON.stringify({ classification: currentClassification, rows, title });
  const changed = savedPlan !== currentPlan;
  const fieldIssues = methodologyIssues({ classification: currentClassification, rows, title }, objectives, new Set(topics.map((topic) => topic.id)));
  const initializeOnce = useRef(false);
  const needsInitialSuggestion = !initialWorkflow.content.stepDrafts.methodology_matrix && (!findTitle(initialWorkflow) || !initialWorkflow.content.methodologyClassification || initialWorkflow.content.methodologyRows.length === 0);

  const findings = workflow.content.coherenceFindings.filter((finding) => finding.rule.includes("Change 013") || finding.rule.includes("metodológica"));
  const blockingMessages = errors.length > 0 ? errors : changed ? [] : findings.filter((finding) => finding.severity === "blocking").map((finding) => finding.message);
  const liveWarningMessages = methodologyCompatibilityWarnings(rows, currentClassification, {
    allowedObjectiveIds: new Set(objectives.filter((objective) => objective.type === "specific").map((objective) => objective.id)),
    generalObjectiveId: general?.id,
  });
  const titleLengthWarning = title.trim().length > FINAL_TITLE_RECOMMENDED_LENGTH
    ? `O título final tem mais de ${FINAL_TITLE_RECOMMENDED_LENGTH} caracteres; ele pode seguir assim, mas considere encurtá-lo para facilitar a identificação do projeto.`
    : null;
  const warningFindings = [
    ...(titleLengthWarning ? [{
      elementIds: [],
      id: "live-methodology-title-length-warning",
      message: titleLengthWarning,
      resolution: "Aviso de concisão: o título continua válido e não impede o avanço.",
      rule: "Concisão do título final",
      severity: "warning" as const,
    }] : []),
    ...findings.filter((finding) => finding.severity !== "blocking" && !finding.rule.toLocaleLowerCase("pt-BR").includes("compatibilidade metodológica")),
    ...liveWarningMessages.map((message, index) => ({
      elementIds: rows.map((row) => row.id),
      id: `live-methodology-warning-${index}`,
      message,
      resolution: "Aviso atualizado a partir dos campos atuais; confirme ou ajuste a célula correspondente.",
      rule: "Compatibilidade metodológica em tempo real",
      severity: "warning" as const,
    })),
  ];

  useEffect(() => {
    const analyticsPosition = getAnalyticsWorkflowPosition("methodology_matrix");
    setAnalyticsContext({ app_auth_state: "authenticated", app_role: activeRole, app_surface: "dashboard", ...analyticsPosition });
    trackAnalyticsEvent("stage_started", { ...analyticsPosition, app_role: activeRole, app_has_advisor: "unknown" });
  }, [activeRole]);

  function applyWorkflow(received: ResearchWorkflow) {
    const next = received.navigation ? received : workflowForView(received, "methodology_matrix");
    setWorkflow(next);
    if (!received.navigation && changed) return;
    const nextClassification = classificationDraft(next);
    setTitle(findTitle(next));
    setClassification(nextClassification);
    setProceduresText(listToText(nextClassification.procedures));
    setInstrumentsText(listToText(nextClassification.instruments));
    setAnalysisText(listToText(nextClassification.analysisTechniques));
    setEthicsText(listToEthicsText(nextClassification.ethicsWarnings));
    setRows(rowsDraft(next));
  }



  function toggleHelp(topic: MethodologyHelpTopic, event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setOpenHelp((current) => current === topic ? null : topic);
  }

  function helpButton(topic: MethodologyHelpTopic) {
    const help = METHODOLOGY_HELP[topic];
    const open = openHelp === topic;
    return (
      <span className="methodology-help" data-methodology-help>
        <button aria-expanded={open} aria-label={`Explicar ${help.title}`} className="methodology-help-button" onClick={(event) => toggleHelp(topic, event)} type="button">i</button>
        {open ? (
          <span className="methodology-help-popover" role="tooltip">
            <strong>{help.title}</strong>
            <span>{help.body}</span>
          </span>
        ) : null}
      </span>
    );
  }

  function goToField(fieldId: string) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const details = field.closest("details");
    if (details) details.open = true;
    field.scrollIntoView({ block: "center", behavior: "smooth" });
    (field.querySelector<HTMLElement>("textarea, input, select, summary") ?? field).focus({ preventScroll: true });
  }

  async function completeFields() {
    if (busy || waitingForAdvisor) return;
    setOperation("complete"); setMessage(null); setErrors([]);
    try {
      const result = await saveThenCompleteStep({ path: `/api/projects/${projectId}/methodology`, body: { revision: workflow.revision, classification: currentClassification, rows, title },
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) }, request: aiProgress.request, onSaved: applyWorkflow });
      applyWorkflow(result.workflow); setMessage(result.message ?? "Campos preenchidos. Revise e use Próximo.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível completar. Seu rascunho foi preservado."); }
    finally { setOperation(null); }
  }

  async function regenerateCard(targetId: string) {
    if (busy) return;
    setOperation("regenerate"); setMessage(null); setErrors([]);
    try {
      const result = await saveThenRegenerateCard({ projectId, step: "methodology_matrix", targetId, instruction: regenerationRequests[targetId] ?? "",
        savePath: `/api/projects/${projectId}/methodology`, saveBody: { revision: workflow.revision, classification: currentClassification, rows, title },
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) }, request: aiProgress.request, onSaved: applyWorkflow });
      applyWorkflow(result.workflow); setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível regenerar este quadro."); }
    finally { setOperation(null); }
  }

  async function submit(action: Exclude<Operation, null>) {
    if (busy) return;
    if ((action === "regenerate") && changed) {
      setMessage("Salve o rascunho antes de solicitar uma proposta à IA. Suas edições permanecem nesta tela.");
      return false;
    }
    if (action === "validate" && fieldIssues.length > 0) {
      setErrors(fieldIssues.map((issue) => issue.message));
      goToField("methodology-assistance");
      return false;
    }
    setOperation(action);
    setMessage(null);
    setErrors([]);
    const analyticsPosition = getAnalyticsWorkflowPosition("methodology_matrix");
    if (action === "validate") trackAnalyticsEvent("stage_submitted", { ...analyticsPosition, app_role: activeRole });
    try {
      const includePlan = action === "save" || action === "validate";
      const response = await aiProgress.request(`/api/projects/${projectId}/methodology`, {
        body: JSON.stringify({
          action,
          currentGuidanceNotes: action === "regenerate" ? rows.filter((row) => workflow.content.methodologyRows.some((saved) => saved.id === row.id)).map((row) => ({ id: row.id, note: row.studentJustification })) : undefined,
          regenerationGuidance: action === "regenerate" ? ["methodology", ...rows.map((row) => row.id)].flatMap((id) => regenerationRequests[id]?.trim() ? [{ id, instruction: regenerationRequests[id].trim() }] : []) : undefined,
          classification: includePlan ? currentClassification : undefined,
          revision: workflow.revision,
          rows: includePlan ? rows : undefined,
          title: includePlan ? title : undefined,
        }),
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; errors?: string[]; message?: string; workflow?: ResearchWorkflow };
      if (payload.workflow) applyWorkflow(payload.workflow);
      if (response.status === 422) {
        trackAnalyticsEvent("stage_blocked", { ...analyticsPosition, app_result: "blocked", app_reason_code: "validation" });
        setErrors(payload.errors ?? [payload.error ?? "Revise a matriz metodológica."]);
        return;
      }
      if (!response.ok || !payload.workflow) throw new Error(payload.error || "Não foi possível atualizar a metodologia.");
      setMessage(payload.message ?? null);
      trackAnalyticsEvent(action === "validate" ? "stage_completed" : "stage_saved", { ...analyticsPosition, app_result: "success", app_role: activeRole, app_reference_count_bucket: getReferenceCountBucket(references.length) });
      if (action === "validate" || action === "back") {
        router.replace(workflowNavigationUrl(projectId, payload.workflow), { scroll: false });
      }
      return true;
    } catch (error) {
      trackAnalyticsEvent("stage_blocked", { ...analyticsPosition, app_result: "failed", app_reason_code: "provider_invalid_response" });
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a metodologia.");
      return false;
    } finally {
      setOperation(null);
    }
  }



  const initializeSuggestion = useEffectEvent(() => { void submit("initialize"); });
  useEffect(() => {
    if (!needsInitialSuggestion || waitingForAdvisor || initializeOnce.current) return;
    initializeOnce.current = true;
    initializeSuggestion();
  }, [needsInitialSuggestion, waitingForAdvisor]);

  useEffect(() => {
    if (!openHelp) return;
    function closeHelp(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest("[data-methodology-help]")) setOpenHelp(null);
    }
    function closeHelpWithKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenHelp(null);
    }
    document.addEventListener("pointerdown", closeHelp);
    document.addEventListener("keydown", closeHelpWithKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeHelp);
      document.removeEventListener("keydown", closeHelpWithKeyboard);
    };
  }, [openHelp]);

  function updateRow(id: string, update: Partial<MethodologyRowDraft>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...update } : row));
  }

  function clearValidationErrors() {
    if (errors.length > 0) setErrors([]);
  }

  function moveRow(index: number, direction: -1 | 1) {
    clearValidationErrors();
    setRows((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function topicIdsForObjective(objectiveId: string) {
    const direct = topics
      .filter((topic) => topic.objectiveCoverage.some((coverage) => coverage.objectiveId === objectiveId))
      .map((topic) => topic.id);
    if (direct.length > 0) return direct.slice(0, 4);
    if (general?.id === objectiveId) {
      const aligned = developmentTopics.filter((topic) => topic.generalObjectiveAligned).map((topic) => topic.id);
      if (aligned.length > 0) return aligned.slice(0, 4);
    }
    return topics[0] ? [topics[0].id] : [];
  }

  function addGeneralObjectiveRow() {
    if (!general || rows.some((row) => row.objectiveId === general.id)) return;
    clearValidationErrors();
    setRows((current) => [...current, {
      analysisTreatment: "Será realizada uma síntese integrada dos dados e evidências para responder ao objetivo geral.",
      associatedTopicIds: topicIdsForObjective(general.id),
      dataCollection: "Serão integradas as informações levantadas nos objetivos específicos e nos capítulos da proposta.",
      expectedResult: "Uma síntese final capaz de responder ao objetivo geral da pesquisa.",
      id: crypto.randomUUID(),
      objectiveId: general.id,
      studentJustification: null,
      warnings: [],
    }]);
  }

  function toggleTopic(row: MethodologyRowDraft, topicId: string) {
    const exists = row.associatedTopicIds.includes(topicId);
    updateRow(row.id, {
      associatedTopicIds: exists
        ? row.associatedTopicIds.filter((id) => id !== topicId)
        : [...row.associatedTopicIds, topicId],
    });
  }

  function toggleClassificationObjective(value: ClassificationDraft["objectives"][number]) {
    setClassification((current) => {
      const exists = current.objectives.includes(value);
      const objectives = exists ? current.objectives.filter((item) => item !== value) : [...current.objectives, value];
      return { ...current, objectives: objectives.length > 0 ? objectives : [value] };
    });
  }

  if (workflow.state === "reviewing_map") {
    return (
      <section className="definition-complete methodology-complete">
        <WorkflowProgress ref={progressRef} current={4} currentStep="final_map" onWorkflow={applyWorkflow} projectId={projectId} revision={workflow.revision} availableSteps={workflow.navigation?.availableSteps} onSave={() => submit("save")} />
        <p className="section-kicker">Passo 1/2 · Etapa 4/4 validado</p>
        <h2>Matriz metodológica consolidada</h2>
        <div className="definition-summary">
          <div><span>Título da pesquisa</span><p>{workflow.content.elements.find((element) => element.type === "research_title")?.approvedContent}</p></div>
          <div><span>Classificação</span><p>{workflow.content.methodologyClassification?.nature} · {workflow.content.methodologyClassification?.approach} · {workflow.content.methodologyClassification?.objectives.join(", ")}</p></div>
          <div><span>Linhas metodológicas</span><ol>{workflow.content.methodologyRows.map((row) => <li key={row.id}>{row.expectedResult}</li>)}</ol></div>
        </div>
        <p className="proposal-next-step">Próxima etapa: página final única e rastreabilidade na Change 014.</p>
      </section>
    );
  }

  return (
    <section className="methodology-workspace" aria-labelledby="methodology-heading" onChange={clearValidationErrors} onInput={clearValidationErrors}>
      {busy ? (
        <div className="generation-overlay" role="status" aria-live="polite">
          <div className="generation-overlay-card">
            <ResearchActivityIcon />
            <p className="section-kicker">Passo 1/2 · Etapa 4/4</p>
            <h2>{aiProgress.label}</h2><button type="button" onClick={aiProgress.cancel}>Cancelar solicitação</button>
          </div>
        </div>
      ) : null}

      <WorkflowProgress ref={progressRef} current={4} currentStep="methodology_matrix" disabled={busy} hasUnsavedChanges={changed} onWorkflow={applyWorkflow} projectId={projectId} revision={workflow.revision} availableSteps={workflow.navigation?.availableSteps} onSave={() => submit("save")} />
      <WorkflowHistory workflow={workflow} step={"methodology_matrix"} hasUnsavedChanges={changed} onWorkflow={applyWorkflow} />

      <div className="definition-heading">
        <div>
          <p className="section-kicker">Passo 1/2 · Etapa 4/4</p>
          <h2 id="methodology-heading">Matriz metodológica e resultados esperados</h2>
          <p>A IA prepara uma proposta para todos os campos. Revise o que desejar e use Próximo; contexto e orientações são opcionais.</p>
        </div>
        <span className={`definition-origin ${changed ? "user" : "ai"}`}>{changed ? "Editado por você" : "Sugestão da IA"}</span>
      </div>
      {isSelfDirectedProject ? null : <AdvisorReviewNotice projectId={projectId} workflow={workflow} />}

      <aside className="workflow-assistance" id="methodology-assistance" tabIndex={-1} aria-label="Como continuar">
        <strong>{fieldIssues.length ? "Vamos completar sua matriz" : "Sua matriz está pronta para continuar"}</strong>
        <p>{fieldIssues.length ? "A IA pode preencher as lacunas e as linhas que faltam, preservando o que você já escreveu." : "Você pode seguir com esta sugestão. Avisos de coerência são recomendações e não impedem o avanço."}</p>
        {fieldIssues.length ? <><button className="definition-button primary" disabled={busy || waitingForAdvisor} onClick={() => void completeFields()} type="button">Completar campos com IA</button>
          <ul>{fieldIssues.map((issue) => <li key={`${issue.fieldId}-${issue.message}`}><button className="field-issue-link" onClick={() => goToField(issue.fieldId)} type="button">{issue.message}</button></li>)}</ul></> : null}
      </aside>

      <div className="methodology-title-editor">
        <label>Título final sugerido *<input id="methodology-title" disabled={busy || waitingForAdvisor} maxLength={FINAL_TITLE_MAX_LENGTH} onChange={(event) => setTitle(event.target.value)} value={title} /></label>
        <small>Até {FINAL_TITLE_MAX_LENGTH} caracteres. Acima de {FINAL_TITLE_RECOMMENDED_LENGTH}, o sistema apenas recomenda encurtar; você pode avançar.</small>
      </div>

      <div className="methodology-stage-request ai-guidance-field">
        <label>Orientação para reescrever o título (opcional)<textarea disabled={busy || waitingForAdvisor} maxLength={1000} value={regenerationRequests.title ?? ""} onChange={(event) => updateRequest("title", event.target.value)} /></label>
        <WorkflowAction className="definition-button secondary" disabled={busy || waitingForAdvisor} type="button" onClick={() => void regenerateCard("title")} help="Usa o título atual e seu pedido para reescrever somente o título. A classificação e as linhas permanecem preservadas.">Regenerar título com IA</WorkflowAction>
      </div>

      <aside className="methodology-classification" aria-label="Classificação metodológica">
        <div>
          <label><span className="methodology-field-heading">Natureza * {helpButton("nature")}</span><select id="methodology-nature" disabled={busy || waitingForAdvisor} onChange={(event) => setClassification((current) => ({ ...current, nature: event.target.value as ClassificationDraft["nature"] }))} value={classification.nature}><option>Aplicada</option><option>Básica</option></select></label>
          <label><span className="methodology-field-heading">Abordagem * {helpButton("approach")}</span><select id="methodology-approach" disabled={busy || waitingForAdvisor} onChange={(event) => setClassification((current) => ({ ...current, approach: event.target.value as ClassificationDraft["approach"] }))} value={classification.approach}><option>Qualitativa</option><option>Quantitativa</option><option>Mista</option></select></label>
        </div>
        <fieldset id="methodology-objectives" tabIndex={-1}>
          <legend><span className="methodology-field-heading">Objetivos metodológicos * {helpButton("objectives")}</span></legend>
          {(["Exploratória", "Descritiva", "Explicativa"] as const).map((value) => (
            <label key={value}><input disabled={busy || waitingForAdvisor} checked={classification.objectives.includes(value)} onChange={() => toggleClassificationObjective(value)} type="checkbox" />{value}</label>
          ))}
        </fieldset>
        <label>Procedimentos *<input id="methodology-procedures" disabled={busy || waitingForAdvisor} onChange={(event) => setProceduresText(event.target.value)} value={proceduresText} /></label>
        <label>Instrumentos *<input id="methodology-instruments" disabled={busy || waitingForAdvisor} onChange={(event) => setInstrumentsText(event.target.value)} value={instrumentsText} /></label>
        <label>Técnicas de análise *<input id="methodology-analysisTechniques" disabled={busy || waitingForAdvisor} onChange={(event) => setAnalysisText(event.target.value)} value={analysisText} /></label>
        <label>Justificativa metodológica *<textarea id="methodology-rationale" disabled={busy || waitingForAdvisor} maxLength={800} onChange={(event) => setClassification((current) => ({ ...current, rationale: event.target.value }))} value={classification.rationale} /></label>
        <label>Avisos éticos ou de acesso<textarea id="methodology-ethicsWarnings" disabled={busy || waitingForAdvisor} maxLength={2400} onChange={(event) => setEthicsText(event.target.value)} placeholder="Opcional. Se houver mais de um aviso, coloque um por linha." value={ethicsText} /></label>
        <label>Orientação para a classificação (opcional)<textarea disabled={busy || waitingForAdvisor} maxLength={1000} value={regenerationRequests.classification ?? ""} onChange={(event) => updateRequest("classification", event.target.value)} /></label>
        <WorkflowAction className="definition-button secondary" disabled={busy || waitingForAdvisor} type="button" onClick={() => void regenerateCard("classification")} help="Reescreve somente a classificação metodológica com os valores atuais e sua orientação. Preserva título e matriz.">Regenerar classificação com IA</WorkflowAction>
      </aside>

      <div id="methodology-rows" tabIndex={-1} className="methodology-matrix" role="table" aria-label="Matriz metodológica por objetivo">
        <div className="methodology-matrix-head" role="row">
          <span role="columnheader">Objetivo</span>
          <span role="columnheader">Levantamento</span>
          <span role="columnheader">Análise/tratamento</span>
          <span role="columnheader">Resultado esperado</span>
        </div>
        {rows.map((row, index) => {
          const objective = objectives.find((item) => item.id === row.objectiveId);
          return (
            <article className="methodology-row" key={row.id} role="row">
              <div className="methodology-objective" role="cell">
                <div className="methodology-objective-actions">
                  <span>{objective?.label ?? `Linha ${index + 1}`}</span>
                  <button aria-label={`Mover ${objective?.label ?? "linha"} para cima`} disabled={busy || waitingForAdvisor || index === 0} onClick={() => moveRow(index, -1)} type="button">↑</button>
                  <button aria-label={`Mover ${objective?.label ?? "linha"} para baixo`} disabled={busy || waitingForAdvisor || index === rows.length - 1} onClick={() => moveRow(index, 1)} type="button">↓</button>
                </div>
                <p>{objective?.content}</p>
              </div>
              <label role="cell">Levantamento *<textarea id={`methodology-${row.id}-dataCollection`} disabled={busy || waitingForAdvisor} maxLength={1200} onChange={(event) => updateRow(row.id, { dataCollection: event.target.value })} value={row.dataCollection} /></label>
              <label role="cell">Análise/tratamento *<textarea id={`methodology-${row.id}-analysisTreatment`} disabled={busy || waitingForAdvisor} maxLength={1200} onChange={(event) => updateRow(row.id, { analysisTreatment: event.target.value })} value={row.analysisTreatment} /></label>
              <label role="cell">Resultado esperado *<textarea id={`methodology-${row.id}-expectedResult`} disabled={busy || waitingForAdvisor} maxLength={1000} onChange={(event) => updateRow(row.id, { expectedResult: event.target.value })} value={row.expectedResult} /></label>
              <details className="methodology-row-note">
                <summary>Contexto e pedido para regenerar — {objective?.label ?? `linha ${index + 1}`}</summary>
                <AiGuidanceField context={row.studentJustification ?? ""} contextPlaceholder="Explique a contribuição desta linha metodológica e o contexto que deve orientar a análise." label={`Contexto e orientações para a IA — ${objective?.label ?? `linha ${index + 1}`}`} onContextChange={(value) => updateRow(row.id, { studentJustification: value || null })} disabled={busy || waitingForAdvisor} onRegenerate={() => void regenerateCard(row.id)} onRequestChange={(value) => updateRequest(row.id, value)} request={regenerationRequests[row.id] ?? ""} requestPlaceholder="Descreva o ajuste desejado para esta linha na próxima regeneração." />
              </details>
              <details className="methodology-topic-links" id={`methodology-${row.id}-associatedTopicIds`}>
                <summary>{row.associatedTopicIds.filter((topicId) => topics.some((topic) => topic.id === topicId)).length} tópicos associados</summary>
                {topics.map((topic) => (
                  <label key={topic.id}>
                    <input disabled={busy || waitingForAdvisor} checked={row.associatedTopicIds.includes(topic.id)} onChange={() => toggleTopic(row, topic.id)} type="checkbox" />
                    <span>{topic.chapterLabel}</span><strong>{topic.title}</strong>
                    {topic.referenceIds.length > 0 ? (
                      <small>{topic.referenceIds.flatMap((referenceId) => {
                        const reference = referenceById.get(referenceId);
                        return reference ? [referenceText(reference)] : [];
                      }).slice(0, 2).join(" · ")}</small>
                    ) : null}
                  </label>
                ))}
              </details>
            </article>
          );
        })}
        {general && !rows.some((row) => row.objectiveId === general.id) ? (
          <button className="add-specific-objective methodology-add-row" onClick={addGeneralObjectiveRow} type="button">+ Adicionar linha OEG</button>
        ) : null}
      </div>

      {blockingMessages.length > 0 ? <div className="definition-findings" role="alert"><strong>Revise antes de avançar</strong><ul>{blockingMessages.map((error) => <li key={error}>{methodologyMessageText(error)}</li>)}</ul></div> : null}
      {warningFindings.length > 0 ? (
        <div className="methodology-findings" role="status">
          <strong>Sugestões de melhoria <small>(opcionais; você pode avançar)</small></strong>
          <ul>{warningFindings.map((finding) => <li className={finding.severity} key={finding.id}>{methodologyMessageText(finding.message)}</li>)}</ul>
        </div>
      ) : <div className="methodology-findings methodology-findings-clear" role="status"><strong>Coerência atualizada</strong><span>Nenhum aviso foi detectado nos dados atuais.</span></div>}
      {message ? <p className="definition-message" role="status">{message}</p> : null}
      <p className="proposal-next-step">Depois de validar esta etapa, a página final exibirá o painel <strong>Encerramento do projeto</strong>, onde você poderá revisar a coerência e encerrar o mapa.</p>

      <div className="definition-actions">
        <WorkflowAction help="Salva o conteúdo da página como rascunho e abre a etapa anterior. Se o salvamento falhar, você permanece aqui." className="definition-button secondary" disabled={busy} onClick={() => progressRef.current?.saveAndNavigate("development_topics")} type="button">Voltar</WorkflowAction>
        <WorkflowAction help="Salva o estado atual da página sem avançar nem mudar o contexto confirmado do projeto." className="definition-button secondary" disabled={busy || !changed} onClick={() => void submit("save")} type="button">Salvar rascunho</WorkflowAction>
        <WorkflowAction help="Processa os dados da página, confirma esta etapa e segue para a próxima. Projetos de aluno continuam sujeitos à aprovação do orientador." aria-describedby="methodology-assistance" className="definition-button primary" disabled={busy || waitingForAdvisor} onClick={() => void submit("validate")} type="button">{validateButtonLabel}</WorkflowAction>
      </div>
    </section>
  );
}
