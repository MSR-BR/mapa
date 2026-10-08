"use client";
import { saveThenCompleteStep } from "./complete-step-client";
import { useRegenerationRequests } from "./use-regeneration-requests";
import { saveThenRegenerateCard } from "./regenerate-card-client";
import { WorkflowAction } from "./workflow-action";
import { useAiProgress } from "@/modules/ai/use-ai-progress";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ResearchActivityIcon } from "@/modules/generation/research-activity-icon";
import { getAnalyticsWorkflowPosition, getReferenceCountBucket, setAnalyticsContext, trackAnalyticsEvent } from "@/modules/analytics/analytics";
import { profileMutationHeaders, useActiveProfile } from "@/modules/profile/active-profile-context";
import { STUDENT_ADVISOR_REQUIRED_MESSAGE } from "./advisor-requirement";
import { AiGuidanceField } from "./ai-guidance-field";
import { pendingAdvisorReview } from "./advisor-review";
import { AdvisorReviewNotice } from "./advisor-review-notice";
import { ManualReferencePanel } from "./manual-reference-panel";
import { WorkflowHistory } from "./workflow-history";
import { WorkflowProgress, type WorkflowProgressHandle } from "./workflow-progress";
import { workflowForView, workflowNavigationUrl } from "./workflow-navigation";
import type { ResearchWorkflow, ValidatedElement } from "./schema";

type Props = {
  advisorEmail: string | null;
  initialWorkflow: ResearchWorkflow;
  isSelfDirectedProject?: boolean;
  projectId: string;
};

type ObjectiveDraft = { id: string; content: string; studentJustification: string };
type Operation = "complete" | "initialize" | "back" | "regenerate" | "save" | "validate" | null;

function findElement(workflow: ResearchWorkflow, type: ValidatedElement["type"]) {
  return workflow.content.elements.find((element) => element.type === type);
}

function specificDrafts(workflow: ResearchWorkflow): ObjectiveDraft[] {
  return workflow.content.elements
    .filter((element) => element.type === "specific_objective")
    .map((element) => ({ content: element.proposedContent, id: element.id, studentJustification: element.studentJustification ?? "" }));
}

export function ResearchDefinitionWorkspace({ advisorEmail, initialWorkflow, isSelfDirectedProject = false, projectId }: Props) {
  const aiProgress = useAiProgress();
  const router = useRouter();
  const progressRef = useRef<WorkflowProgressHandle>(null);
  const { activeRole, roleVersion } = useActiveProfile();
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [problem, setProblem] = useState(() => findElement(initialWorkflow, "problem_statement")?.proposedContent ?? "");
  const [general, setGeneral] = useState(() => findElement(initialWorkflow, "general_objective")?.proposedContent ?? "");
  const [problemJustification, setProblemJustification] = useState(() => findElement(initialWorkflow, "problem_statement")?.studentJustification ?? "");
  const [generalJustification, setGeneralJustification] = useState(() => findElement(initialWorkflow, "general_objective")?.studentJustification ?? "");
  const [specifics, setSpecifics] = useState<ObjectiveDraft[]>(() => specificDrafts(initialWorkflow));
  const [regenerationRequests, updateRequest] = useRegenerationRequests(projectId);
  const [promotionId, setPromotionId] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const step = workflow.content.activeStep;
  const discovery = workflow.content.discovery;
  const candidate = discovery?.candidates.find((item) => item.id === discovery.selectedCandidateId);
  const currentElement = step === "problem_statement"
    ? findElement(workflow, "problem_statement")
    : step === "general_objective"
      ? findElement(workflow, "general_objective")
      : undefined;
  const sourceValues = step === "problem_statement"
    ? [candidate?.title, candidate?.problemQuestion]
    : step === "general_objective"
      ? [problem]
      : [problem, general];
  const currentReferenceIds = step === "specific_objectives"
    ? workflow.content.elements.filter((element) => element.type === "specific_objective").flatMap((element) => element.referenceIds)
    : currentElement?.referenceIds.length ? currentElement.referenceIds : candidate?.referenceIds ?? [];
  const referenceIdSet = new Set(currentReferenceIds);
  const allReferences = [...(discovery?.references ?? []), ...workflow.content.referenceArchive]
    .filter((reference, index, all) => all.findIndex((item) => item.referenceId === reference.referenceId) === index);
  const references = allReferences.filter((reference) => referenceIdSet.has(reference.referenceId));
  const currentValueChanged = step === "problem_statement"
    ? problem !== currentElement?.proposedContent || problemJustification !== (currentElement?.studentJustification ?? "")
    : step === "general_objective"
      ? general !== currentElement?.proposedContent || generalJustification !== (currentElement?.studentJustification ?? "")
      : general !== (findElement(workflow, "general_objective")?.proposedContent ?? "")
        || generalJustification !== (findElement(workflow, "general_objective")?.studentJustification ?? "")
        || JSON.stringify(specifics) !== JSON.stringify(specificDrafts(workflow));
  const busy = operation !== null;
  const waitingForAdvisor = !isSelfDirectedProject && Boolean(pendingAdvisorReview(workflow.content));
  const advisorRequired = !isSelfDirectedProject && !advisorEmail?.trim();
  const validateButtonLabel = waitingForAdvisor
    ? "Aguardando validação"
    : advisorRequired
      ? "Informe o orientador para avançar"
      : isSelfDirectedProject
        ? "Próximo"
        : "Enviar para validação";

  useEffect(() => {
    const analyticsPosition = getAnalyticsWorkflowPosition(step ?? "unknown");
    setAnalyticsContext({ app_auth_state: "authenticated", app_role: activeRole, app_surface: "dashboard", ...analyticsPosition });
    if (step) trackAnalyticsEvent("stage_started", { ...analyticsPosition, app_role: activeRole, app_has_advisor: "unknown" });
  }, [activeRole, step]);

  function applyWorkflow(received: ResearchWorkflow) {
    const nextWorkflow = received.navigation ? received : workflowForView(received, step ?? "problem_statement");
    setWorkflow(nextWorkflow);
    if (!received.navigation && currentValueChanged) return;
    setProblem(findElement(nextWorkflow, "problem_statement")?.proposedContent ?? "");
    setGeneral(findElement(nextWorkflow, "general_objective")?.proposedContent ?? "");
    setProblemJustification(findElement(nextWorkflow, "problem_statement")?.studentJustification ?? "");
    setGeneralJustification(findElement(nextWorkflow, "general_objective")?.studentJustification ?? "");
    setSpecifics(specificDrafts(nextWorkflow));
    setPromotionId(null);
  }



  async function completeFields() {
    if (busy || !step) return;
    setOperation("complete"); setMessage(null); setErrors([]);
    try {
      const result = await saveThenCompleteStep({ path: `/api/projects/${projectId}/definition`, body: {
        revision: workflow.revision, step, content: step === "general_objective" ? general : problem,
        generalObjective: general, generalStudentJustification: generalJustification, objectives: specifics,
        studentJustification: step === "general_objective" ? generalJustification : problemJustification,
      }, headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) }, request: aiProgress.request, onSaved: applyWorkflow });
      applyWorkflow(result.workflow); setMessage(result.message ?? "Sugestão preenchida. Revise e use Próximo.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível completar os campos. Seu rascunho permanece salvo."); }
    finally { setOperation(null); }
  }

  async function regenerateCard(targetId: string) {
    if (!step || busy) return;
    setOperation("regenerate"); setMessage(null); setErrors([]);
    try {
      const result = await saveThenRegenerateCard({ projectId, step, targetId, instruction: regenerationRequests[targetId] ?? "",
        savePath: `/api/projects/${projectId}/definition`,
        saveBody: { revision: workflow.revision, step, content: step === "problem_statement" ? problem : step === "general_objective" ? general : undefined,
          studentJustification: step === "problem_statement" ? problemJustification : generalJustification,
          generalObjective: general, generalStudentJustification: generalJustification, objectives: specifics, promoteObjectiveId: promotionId ?? undefined },
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) }, request: aiProgress.request, onSaved: applyWorkflow });
      applyWorkflow(result.workflow); setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível regenerar este quadro."); }
    finally { setOperation(null); }
  }

  async function submit(action: Exclude<Operation, null>) {
    if (!step || busy) return;
    if ((action === "regenerate") && currentValueChanged) {
      setMessage("Salve o rascunho antes de solicitar uma proposta à IA. Suas edições permanecem nesta tela.");
      return false;
    }
    setOperation(action);
    setMessage(null);
    setErrors([]);
    const analyticsPosition = getAnalyticsWorkflowPosition(step);
    if (action === "validate") trackAnalyticsEvent("stage_submitted", { ...analyticsPosition, app_role: activeRole });
    try {
      const allowedRequests = step === "problem_statement" ? ["problem"] : step === "general_objective" ? ["general"] : ["general", ...specifics.map((item) => item.id)];
      const response = await aiProgress.request(`/api/projects/${projectId}/definition`, {
        body: JSON.stringify({
          action,
          regenerationGuidance: action === "regenerate" ? allowedRequests.flatMap((id) => regenerationRequests[id]?.trim() ? [{ id, instruction: regenerationRequests[id].trim() }] : []) : undefined,
          content: step === "problem_statement" ? problem : step === "general_objective" ? general : undefined,
          generalObjective: step === "specific_objectives" ? general : undefined,
          generalStudentJustification: step === "specific_objectives" ? generalJustification : undefined,
          objectives: step === "specific_objectives" ? specifics : undefined,
          // Omit the optional field when no promotion was made. The API also
          // accepts null for compatibility with older cached clients.
          promoteObjectiveId: step === "specific_objectives" ? promotionId ?? undefined : undefined,
          revision: workflow.revision,
          studentJustification: step === "problem_statement" ? problemJustification : step === "general_objective" ? generalJustification : undefined,
          step,
        }),
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) },
        method: "POST",
      });
      const payload = await response.json() as {
        error?: string;
        errors?: string[];
        message?: string;
        workflow?: ResearchWorkflow | null;
      };
      if (payload.workflow) applyWorkflow(payload.workflow);
      if (response.status === 422) {
        trackAnalyticsEvent("stage_blocked", { ...analyticsPosition, app_result: "blocked", app_reason_code: "validation" });
        setErrors(payload.errors ?? ["Revise o conteúdo antes de validar."]);
        return;
      }
      if (!response.ok || !payload.workflow) throw new Error(payload.error || "Não foi possível atualizar esta etapa.");
      trackAnalyticsEvent(action === "validate" ? "stage_completed" : "stage_saved", { ...analyticsPosition, app_result: "success", app_role: activeRole, app_reference_count_bucket: getReferenceCountBucket(references.length) });
      setMessage(payload.message ?? null);
      if (action === "validate" || action === "back") {
        router.replace(workflowNavigationUrl(projectId, payload.workflow), { scroll: false });
      }
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar esta etapa.");
      return false;
    } finally {
      setOperation(null);
    }
  }

  function updateSpecific(id: string, value: string) {
    setSpecifics((current) => current.map((objective) => objective.id === id ? { ...objective, content: value } : objective));
  }

  function updateSpecificJustification(id: string, value: string) {
    setSpecifics((current) => current.map((objective) => objective.id === id ? { ...objective, studentJustification: value } : objective));
  }

  function promoteSpecificObjective(objective: ObjectiveDraft) {
    if (specifics.length <= 3) return;
    setGeneral(objective.content);
    setGeneralJustification(objective.studentJustification);
    setPromotionId(objective.id);
    setSpecifics((current) => current.filter((item) => item.id !== objective.id));
    setMessage("Objetivo promovido. Revise o objetivo geral e os objetivos específicos antes de validar.");
  }

  if (!step) {
    return (
      <section className="definition-complete" aria-labelledby="definition-complete-title">
        <WorkflowProgress ref={progressRef} current={2} currentStep="specific_objectives" onWorkflow={applyWorkflow} projectId={projectId} revision={workflow.revision} availableSteps={workflow.navigation?.availableSteps} onSave={() => submit("save")} />
        <p className="section-kicker">Problemática e objetivos validados</p>
        <h2 id="definition-complete-title">Problemática e objetivos consolidados</h2>
        <div className="definition-summary">
          <div><span>Problemática</span><p>{findElement(workflow, "problem_statement")?.approvedContent}</p></div>
          <div><span>Objetivo geral</span><p>{findElement(workflow, "general_objective")?.approvedContent}</p></div>
          <div>
            <span>Objetivos específicos</span>
            <ol>{workflow.content.elements.filter((element) => element.type === "specific_objective").map((element) => <li key={element.id}>{element.approvedContent}</li>)}</ol>
          </div>
        </div>
        <p className="proposal-next-step">Próxima etapa: construir a revisão da literatura na Change 012.</p>
      </section>
    );
  }

  const workflowStage = step === "problem_statement" ? 1 : 2;
  const visibleStepLabel = step === "problem_statement"
    ? "Etapa 1/4 · Problemática"
    : step === "general_objective"
      ? "Passo 1/2 · Etapa 2/4"
      : "Passo 2/2 · Etapa 2/4";
  const title = step === "problem_statement" ? "Problemática da pesquisa" : step === "general_objective" ? "Objetivo geral" : "Objetivos específicos";
  const explanation = step === "problem_statement"
    ? "A grande pergunta representa a razão central da pesquisa e orientará todas as etapas seguintes."
    : step === "general_objective"
      ? "O objetivo geral responde diretamente à problemática e expressa o principal resultado intelectual pretendido."
      : "Os objetivos específicos formam uma progressão lógica de três a seis etapas necessárias para atender o objetivo geral.";

  return (
    <section className="research-definition" aria-labelledby="definition-title">
      <WorkflowProgress ref={progressRef} current={workflowStage} currentStep={step} disabled={busy} hasUnsavedChanges={currentValueChanged} onWorkflow={applyWorkflow} projectId={projectId} revision={workflow.revision} availableSteps={workflow.navigation?.availableSteps} onSave={() => submit("save")} />
      <WorkflowHistory workflow={workflow} step={step} hasUnsavedChanges={currentValueChanged} onWorkflow={applyWorkflow} />
      {busy ? (
        <div className="generation-overlay" role="status" aria-live="polite">
          <div className="generation-overlay-card">
            <ResearchActivityIcon />
            <p className="section-kicker">{visibleStepLabel}</p>
            <h2>{aiProgress.label}</h2><button type="button" onClick={aiProgress.cancel}>Cancelar solicitação</button>
          </div>
        </div>
      ) : null}

      <div className="definition-heading">
        <div>
          <p className="section-kicker">{visibleStepLabel}</p>
          <h2 id="definition-title">{title}</h2>
          <p>{explanation}</p>
        </div>
        <span className={`definition-origin ${currentElement?.updatedBy === "user" || currentValueChanged ? "user" : "ai"}`}>
          {currentElement?.updatedBy === "user" || currentValueChanged ? "Editado por você" : "Sugestão da IA"}
        </span>
      </div>
      {advisorRequired ? (
        <aside className="student-advisor-required" id="student-advisor-required" role="alert">
          <div>
            <strong>Informe o orientador antes de validar</strong>
            <span>{STUDENT_ADVISOR_REQUIRED_MESSAGE}</span>
          </div>
          <a href="#project-advisor">Ir para o e-mail do orientador</a>
        </aside>
      ) : null}
      {isSelfDirectedProject ? null : <AdvisorReviewNotice projectId={projectId} workflow={workflow} />}

      {step !== "problem_statement" ? <aside className="workflow-assistance" aria-label="Como continuar">
        <strong>Revise a sugestão e use Próximo</strong>
        <p>A IA sugere os textos dos objetivos. Você pode seguir com eles ou editar; contexto e pedido para regenerar são opcionais.</p>
        {(!general.trim() || step === "specific_objectives" && (specifics.length < 3 || specifics.some((item) => !item.content.trim()))) ?
          <button className="definition-button primary" disabled={busy || waitingForAdvisor} onClick={() => void completeFields()} type="button">Completar campos com IA</button> : null}
      </aside> : null}

      <div className="definition-source">
        <span>Origem desta etapa</span>
        {sourceValues.filter(Boolean).map((value) => <p key={value}>{value}</p>)}
      </div>

      <ManualReferencePanel onWorkflow={applyWorkflow} projectId={projectId} workflow={workflow} />

      <div className={`definition-editor${step === "specific_objectives" ? " definition-editor-cards" : ""}`}>
        {step === "problem_statement" ? (
          <div className="definition-editor-with-note">
            <label>
              Grande pergunta da pesquisa
              <textarea disabled={busy || waitingForAdvisor} maxLength={500} onChange={(event) => setProblem(event.target.value)} value={problem} />
              <small>{problem.length}/500 · Comece com “Como” ou “De que forma” e formule uma única pergunta.</small>
            </label>
            <AiGuidanceField context={problemJustification} contextPlaceholder="Explique a relevância da pergunta e o recorte que deve orientar as próximas etapas." label="Contexto e orientações para a IA — problemática" onContextChange={setProblemJustification} disabled={busy || waitingForAdvisor} onRegenerate={() => void regenerateCard("problem")} onRequestChange={(value) => updateRequest("problem", value)} request={regenerationRequests.problem ?? ""} requestPlaceholder="Descreva como a IA deve ajustar a problemática na próxima regeneração." />
          </div>
        ) : step === "general_objective" ? (
          <div className="definition-editor-with-note">
            <label>
              Objetivo geral
              <textarea disabled={busy || waitingForAdvisor} maxLength={700} onChange={(event) => setGeneral(event.target.value)} value={general} />
              <small>{general.length}/700 · Comece com verbo no infinitivo e mantenha o escopo da problemática.</small>
            </label>
            <AiGuidanceField context={generalJustification} contextPlaceholder="Explique como o objetivo responde à problemática e o que deve permanecer nas próximas etapas." label="Contexto e orientações para a IA — objetivo geral" onContextChange={setGeneralJustification} disabled={busy || waitingForAdvisor} onRegenerate={() => void regenerateCard("general")} onRequestChange={(value) => updateRequest("general", value)} request={regenerationRequests.general ?? ""} requestPlaceholder="Descreva como a IA deve ajustar o objetivo geral na próxima regeneração." />
          </div>
        ) : (
          <div className="specific-objective-list">
            <article aria-label="Objetivo geral" className="objective-card specific-general-editor">
              <div className="definition-editor-with-note">
                <label>
                  Objetivo geral (revisável nesta etapa)
                  <textarea disabled={busy || waitingForAdvisor} rows={6} maxLength={700} onChange={(event) => setGeneral(event.target.value)} value={general} />
                  <small>{general.length}/700 · Se um objetivo específico representar melhor a finalidade da pesquisa, use “Usar como objetivo geral” abaixo.</small>
                </label>
                <AiGuidanceField context={generalJustification} contextPlaceholder="Explique como o objetivo geral responde à problemática e orienta os objetivos específicos." label="Contexto e orientações para a IA — objetivo geral" onContextChange={setGeneralJustification} disabled={busy || waitingForAdvisor} onRegenerate={() => void regenerateCard("general")} onRequestChange={(value) => updateRequest("general", value)} request={regenerationRequests.general ?? ""} requestPlaceholder="Descreva como a IA deve ajustar o objetivo geral nesta etapa." />
              </div>
            </article>
            {specifics.map((objective, index) => (
              <article aria-label={`Objetivo específico ${index + 1}`} className="objective-card specific-objective-row" key={objective.id}>
                <div className="definition-editor-with-note">
                  <label>
                    Objetivo específico {index + 1}
                    <textarea disabled={busy || waitingForAdvisor} rows={6} maxLength={700} onChange={(event) => updateSpecific(objective.id, event.target.value)} value={objective.content} />
                    <small>{objective.content.length}/700 caracteres</small>
                  </label>
                  <AiGuidanceField context={objective.studentJustification} contextPlaceholder="Explique a contribuição deste objetivo específico e o contexto que a IA deve considerar depois." label={`Contexto e orientações para a IA — OE${index + 1}`} onContextChange={(value) => updateSpecificJustification(objective.id, value)} disabled={busy || waitingForAdvisor} onRegenerate={() => void regenerateCard(objective.id)} onRequestChange={(value) => updateRequest(objective.id, value)} request={regenerationRequests[objective.id] ?? ""} requestPlaceholder="Descreva o ajuste desejado para este objetivo específico na próxima regeneração." />
                </div>
                <footer className="objective-card-actions">
                  <button
                    aria-label={`Remover objetivo específico ${index + 1}`}
                    disabled={busy || waitingForAdvisor || specifics.length <= 3}
                    onClick={() => setSpecifics((current) => current.filter((item) => item.id !== objective.id))}
                    type="button"
                  >Remover</button>
                  <button
                    className="promote-specific-objective"
                    disabled={busy || waitingForAdvisor || specifics.length <= 3}
                    onClick={() => promoteSpecificObjective(objective)}
                    type="button"
                  >Usar como objetivo geral</button>
                </footer>
              </article>
            ))}
            <button
              className="add-specific-objective"
              disabled={busy || waitingForAdvisor || specifics.length >= 6}
              onClick={() => setSpecifics((current) => [...current, { content: "", id: crypto.randomUUID(), studentJustification: "" }])}
              type="button"
            >+ Adicionar objetivo</button>
          </div>
        )}
      </div>

      {errors.length > 0 ? (
        <div className="definition-findings" role="alert">
          <strong>Revise antes de avançar</strong>
          <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      ) : null}
      {message ? <p className="definition-message" role="status">{message}</p> : null}

      {references.length > 0 ? (
        <details className="definition-references">
          <summary>{references.length} referências relacionadas</summary>
          <ul>
            {references.map((reference) => (
              <li key={reference.referenceId}>
                {reference.url ? <a href={reference.url} rel="noreferrer" target="_blank">{reference.title || reference.referenceId}</a> : reference.title || reference.referenceId}
                {reference.year ? <span> ({reference.year})</span> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="definition-actions">
        <WorkflowAction help="Salva o conteúdo da página como rascunho e abre a etapa anterior. Se o salvamento falhar, você permanece aqui." className="definition-button secondary" disabled={busy} onClick={() => progressRef.current?.saveAndNavigate(step === "specific_objectives" ? "general_objective" : "problem_statement")} type="button">Voltar</WorkflowAction>
        <WorkflowAction help="Salva o estado atual da página sem avançar nem mudar o contexto confirmado do projeto." className="definition-button secondary" disabled={busy || !currentValueChanged} onClick={() => void submit("save")} type="button">Salvar rascunho</WorkflowAction>
        <WorkflowAction help="Processa os dados da página, confirma esta etapa e segue para a próxima. Projetos de aluno continuam sujeitos à aprovação do orientador." aria-describedby={advisorRequired ? "student-advisor-required" : undefined} className="definition-button primary" disabled={busy || waitingForAdvisor || advisorRequired} onClick={() => void submit("validate")} type="button">{validateButtonLabel}</WorkflowAction>
      </div>
    </section>
  );
}
