"use client";
import { useAiProgress } from "@/modules/ai/use-ai-progress";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ResearchActivityIcon } from "@/modules/generation/research-activity-icon";
import { WorkflowProgress } from "./workflow-progress";
import { getAnalyticsWorkflowPosition, getReferenceCountBucket, setAnalyticsContext, trackAnalyticsEvent, type AnalyticsReasonCode } from "@/modules/analytics/analytics";
import { profileMutationHeaders, useActiveProfile } from "@/modules/profile/active-profile-context";
import { discoveryClientFailure, discoveryResponseReason } from "./discovery-failure";
import { readWorkflowPayload } from "./request-failure";
import type { ResearchWorkflow } from "./schema";

type Props = {
  autoDiscover?: boolean;
  initialWorkflow: ResearchWorkflow;
  originalPrompt: string;
  projectId: string;
};

type Operation = "discovering" | "selecting" | null;

const STAGE_LABELS: Record<string, string> = {
  interpreting: "interpretação do briefing",
  literature: "busca bibliográfica",
  proposals: "formação dos cards",
  saving: "salvamento das propostas",
};

export function ProposalDiscoveryWorkspace({ autoDiscover = false, initialWorkflow, originalPrompt, projectId }: Props) {
  const aiProgress = useAiProgress();
  const { activeRole, roleVersion } = useActiveProfile();
  const router = useRouter();
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [operation, setOperation] = useState<Operation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorStage, setErrorStage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorReason, setErrorReason] = useState<AnalyticsReasonCode | null>(null);
  const [briefingPreserved, setBriefingPreserved] = useState(false);
  const autoTriggered = useRef(false);
  const discovery = workflow.content.discovery;
  const selectedCandidate = discovery?.candidates.find(
    (candidate) => candidate.id === discovery.selectedCandidateId,
  );
  const busy = operation !== null;

  // Keyed by the stored report, not the object: choosing a card replaces the object but is not a new view.
  const discoveryReportId = discovery?.reportId ?? null;
  const referenceCount = discovery?.references.length ?? null;
  useEffect(() => {
    setAnalyticsContext({ app_auth_state: "authenticated", app_role: activeRole, app_surface: autoDiscover ? "resume" : "dashboard", ...getAnalyticsWorkflowPosition("discovery") });
    if (referenceCount !== null) {
      trackAnalyticsEvent("proposal_viewed", { ...getAnalyticsWorkflowPosition("discovery"), app_surface: autoDiscover ? "resume" : "dashboard", app_reference_count_bucket: getReferenceCountBucket(referenceCount) });
    }
  }, [activeRole, autoDiscover, discoveryReportId, referenceCount]);

  async function discover() {
    setOperation("discovering");
    setMessage(null);
    setErrorStage(null);
    setErrorCode(null);
    setErrorReason(null);
    trackAnalyticsEvent("generation_started", { ...getAnalyticsWorkflowPosition("discovery"), app_surface: autoDiscover ? "resume" : "dashboard", app_result: "started" });
    try {
      const response = await aiProgress.request(`/api/projects/${projectId}/discover`, {
        headers: profileMutationHeaders(roleVersion),
        method: "POST",
        signal: AbortSignal.timeout(110_000),
      });
      const payload = await readWorkflowPayload<{ code?: string; error?: string; errorCode?: string; preservedBriefing?: boolean; stage?: string; workflow?: ResearchWorkflow }>(response);
      if (!response.ok || !payload.workflow) {
        const reason = discoveryResponseReason(response.status, payload);
        setErrorStage(payload.stage ?? null);
        setErrorCode(payload.errorCode ?? null);
        setErrorReason(reason);
        setBriefingPreserved(payload.preservedBriefing ?? true);
        trackAnalyticsEvent("generation_failed", { ...getAnalyticsWorkflowPosition("discovery"), app_result: "failed", app_reason_code: reason });
        setMessage(payload.error || "Não foi possível buscar propostas.");
        return;
      }
      setWorkflow(payload.workflow);
      setBriefingPreserved(false);
      setErrorCode(null);
      const references = payload.workflow.content.discovery?.references.length ?? 0;
      trackAnalyticsEvent("generation_completed", { ...getAnalyticsWorkflowPosition("discovery"), app_result: "success", app_reference_count_bucket: getReferenceCountBucket(references) });
    } catch (error) {
      const failure = discoveryClientFailure(error);
      setErrorReason(failure.reason);
      setBriefingPreserved(true);
      trackAnalyticsEvent("generation_failed", { ...getAnalyticsWorkflowPosition("discovery"), app_result: failure.cancelled ? "cancelled" : "failed", app_reason_code: failure.reason });
      setMessage(failure.message);
    } finally {
      setOperation(null);
    }
  }

  async function selectCandidate(candidateId: string) {
    if (busy) return;
    setOperation("selecting");
    setMessage(null);
    trackAnalyticsEvent("proposal_selected", { ...getAnalyticsWorkflowPosition("discovery"), app_result: "started" });
    try {
      const response = await aiProgress.request(`/api/projects/${projectId}/proposal-selection`, {
        body: JSON.stringify({ candidateId }),
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) },
        method: "POST",
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível escolher a proposta.");
      setWorkflow((current) => current.content.discovery ? {
        ...current,
        content: {
          ...current.content,
          discovery: { ...current.content.discovery, selectedCandidateId: candidateId },
        },
        state: "choosing_problem",
        stableState: "choosing_problem",
      } : current);
      router.replace(`/dashboard/projects/${encodeURIComponent(projectId)}?workflowStep=problem_statement`, { scroll: false });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível escolher a proposta.");
    } finally {
      setOperation(null);
    }
  }

  useEffect(() => {
    if (!autoDiscover || autoTriggered.current || discovery) return;
    autoTriggered.current = true;
    void discover();
    // A descoberta automática ocorre uma vez ao entrar pelo prompt principal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDiscover, discovery]);

  return (
    <section className="proposal-discovery" aria-labelledby="proposal-discovery-title">
      {operation ? (
        <div className="generation-overlay" role="status" aria-live="polite">
          <div className="generation-overlay-card">
            <ResearchActivityIcon />
            {operation === "discovering" ? (
              <>
                <p className="section-kicker">Explorando possibilidades</p>
                <h2>{aiProgress.label}</h2><button type="button" onClick={aiProgress.cancel}>Cancelar solicitação</button>
              </>
            ) : (
              <>
                <p className="section-kicker">Proposta escolhida</p>
                <h2>{aiProgress.label}</h2><button type="button" onClick={aiProgress.cancel}>Cancelar solicitação</button>
                <p>Esta escolha será preservada para construir as próximas etapas.</p>
              </>
            )}
          </div>
        </div>
      ) : null}

      <WorkflowProgress current={1} currentStep={selectedCandidate ? "problem_statement" : null} disabled={busy} projectId={projectId} revision={workflow.revision} />

      <div className="proposal-original-prompt">
        <span>Seu pedido original</span>
        <p>{discovery?.originalPrompt || originalPrompt}</p>
      </div>

      <div className="proposal-discovery-heading">
        <div>
          <p className="section-kicker">Etapa 1 · problemática</p>
          <h2 id="proposal-discovery-title">
            {selectedCandidate ? "Proposta escolhida" : "Escolha um caminho para a pesquisa"}
          </h2>
          <p>
            {selectedCandidate
              ? "A problemática foi registrada e será usada para construir o objetivo geral."
              : "A primeira opção preserva seu pedido. As demais exploram recortes sustentados pela literatura encontrada."}
          </p>
        </div>
        {discovery ? (
          <span className="literature-count">
            {discovery.references.length} referências verificáveis
          </span>
        ) : null}
      </div>

      {discovery?.references.some(reference => reference.source === "crossref") ? (
        <p className="proposal-original-prompt" role="status">Usamos o Crossref como fonte alternativa. A cobertura bibliográfica é reduzida; confira a adequação das referências antes de utilizá-las no trabalho.</p>
      ) : null}

      {message ? (
        <div className="proposal-error" role="alert">
          <div>
            <strong>{errorCode === "research-starter-unauthorized" ? "A integração bibliográfica precisa ser atualizada" : "Não foi possível concluir a descoberta"}</strong>
            <span>{message}</span>
            {errorStage && errorStage in STAGE_LABELS ? <small>Etapa: {STAGE_LABELS[errorStage]}.</small> : null}
            {briefingPreserved ? <small>Seu briefing continua salvo e será reutilizado na nova tentativa.</small> : null}
          </div>
      <button disabled={busy} onClick={() => { trackAnalyticsEvent("generation_retry", { ...getAnalyticsWorkflowPosition("discovery"), app_result: "retry", app_reason_code: errorReason ?? "unknown" }); void discover(); }} type="button">Tentar novamente</button>
        </div>
      ) : null}

      {!discovery && !busy && !message ? (
        <div className="proposal-empty">
          <span aria-hidden="true">✦</span>
          <h3>Encontre a problemática mais promissora</h3>
          <p>O Mapa cruza seu pedido com literatura verificável antes de sugerir alternativas.</p>
          <button onClick={() => void discover()} type="button">Buscar propostas</button>
        </div>
      ) : null}

      {selectedCandidate ? (
        <article className="proposal-selected-card">
          <span>Proposta validada</span>
          <h3>{selectedCandidate.title}</h3>
          <strong>{selectedCandidate.problemQuestion}</strong>
          <p>{selectedCandidate.context}</p>
          <div className="proposal-tags">
            {selectedCandidate.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
          </div>
          <p className="proposal-next-step">Próxima etapa: validar o objetivo geral na Change 011.</p>
        </article>
      ) : discovery ? (
        <div className="proposal-grid" aria-label="Seis propostas de pesquisa">
          {discovery.candidates.map((candidate) => (
            <button
              aria-label={`Escolher proposta: ${candidate.title}`}
              className="proposal-card"
              disabled={busy}
              key={candidate.id}
              onClick={() => void selectCandidate(candidate.id)}
              type="button"
            >
              <span className="proposal-kind">
                {candidate.kind === "exact" ? "Mais próxima do seu pedido" : `Alternativa ${candidate.position - 1}`}
              </span>
              <h3>{candidate.title}</h3>
              <strong>{candidate.problemQuestion}</strong>
              <p>{candidate.context}</p>
              <div className="proposal-card-meta">
                <span>{candidate.knowledgeAreaProposed ? "Área proposta" : "Área"}: {candidate.knowledgeArea}</span>
                <span>{candidate.referenceIds.length} fontes relacionadas</span>
              </div>
              <span className="proposal-card-action">Escolher esta proposta →</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
