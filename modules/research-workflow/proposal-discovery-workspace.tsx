"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ResearchActivityIcon } from "@/modules/generation/research-activity-icon";
import { WorkflowProgress } from "./workflow-progress";
import { getAnalyticsWorkflowPosition, getReferenceCountBucket, setAnalyticsContext, trackAnalyticsEvent } from "@/modules/analytics/analytics";
import { profileMutationHeaders, useActiveProfile } from "@/modules/profile/active-profile-context";
import type { ResearchWorkflow } from "./schema";

type Props = {
  autoDiscover?: boolean;
  initialWorkflow: ResearchWorkflow;
  originalPrompt: string;
  projectId: string;
};

type Operation = "discovering" | "selecting" | null;

export function ProposalDiscoveryWorkspace({ autoDiscover = false, initialWorkflow, originalPrompt, projectId }: Props) {
  const { activeRole, roleVersion } = useActiveProfile();
  const router = useRouter();
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [operation, setOperation] = useState<Operation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorStage, setErrorStage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [briefingPreserved, setBriefingPreserved] = useState(false);
  const autoTriggered = useRef(false);
  const discovery = workflow.content.discovery;
  const selectedCandidate = discovery?.candidates.find(
    (candidate) => candidate.id === discovery.selectedCandidateId,
  );
  const busy = operation !== null;

  useEffect(() => {
    setAnalyticsContext({ app_auth_state: "authenticated", app_role: activeRole, app_surface: autoDiscover ? "resume" : "dashboard", ...getAnalyticsWorkflowPosition("discovery") });
    if (discovery) {
      trackAnalyticsEvent("proposal_viewed", { ...getAnalyticsWorkflowPosition("discovery"), app_surface: autoDiscover ? "resume" : "dashboard", app_reference_count_bucket: getReferenceCountBucket(discovery.references.length) });
    }
  }, [activeRole, autoDiscover, discovery]);

  async function discover() {
    setOperation("discovering");
    setMessage(null);
    setErrorStage(null);
    setErrorCode(null);
    trackAnalyticsEvent("generation_started", { ...getAnalyticsWorkflowPosition("discovery"), app_surface: autoDiscover ? "resume" : "dashboard", app_result: "started" });
    try {
      const response = await fetch(`/api/projects/${projectId}/discover`, {
        headers: profileMutationHeaders(roleVersion),
        method: "POST",
        signal: AbortSignal.timeout(110_000),
      });
      const payload = await response.json() as { error?: string; errorCode?: string; preservedBriefing?: boolean; stage?: string; workflow?: ResearchWorkflow };
      if (!response.ok || !payload.workflow) {
        setErrorStage(payload.stage ?? null);
        setErrorCode(payload.errorCode ?? null);
        setBriefingPreserved(payload.preservedBriefing ?? true);
        throw new Error(payload.error || "Não foi possível buscar propostas.");
      }
      setWorkflow(payload.workflow);
      setBriefingPreserved(false);
      setErrorCode(null);
      const references = payload.workflow.content.discovery?.references.length ?? 0;
      trackAnalyticsEvent("generation_completed", { ...getAnalyticsWorkflowPosition("discovery"), app_result: "success", app_reference_count_bucket: getReferenceCountBucket(references) });
    } catch (error) {
      trackAnalyticsEvent("generation_failed", { ...getAnalyticsWorkflowPosition("discovery"), app_result: "failed", app_reason_code: error instanceof DOMException && error.name === "TimeoutError" ? "provider_timeout" : "provider_invalid_response" });
      setMessage(error instanceof DOMException && error.name === "TimeoutError"
        ? "A busca demorou mais que o esperado. Tente novamente; seu briefing foi preservado."
        : error instanceof Error ? error.message : "Não foi possível buscar propostas.");
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
      const response = await fetch(`/api/projects/${projectId}/proposal-selection`, {
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
                <h2>Buscando literatura e formando propostas…</h2>
                <ol className="generation-progress">
                  <li className="done">Interpretando objeto, relação e recorte do pedido</li>
                  <li className="current">Consultando literatura verificável no Research Starter</li>
                  <li>Construindo uma proposta fiel e cinco alternativas</li>
                </ol>
              </>
            ) : (
              <>
                <p className="section-kicker">Proposta escolhida</p>
                <h2>Registrando a problemática da pesquisa…</h2>
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

      {message ? (
        <div className="proposal-error" role="alert">
          <div>
            <strong>{errorCode === "research-starter-unauthorized" ? "A integração bibliográfica precisa ser atualizada" : "Não foi possível concluir a descoberta"}</strong>
            <span>{message}</span>
            {errorStage ? <small>Etapa: {errorStage === "literature" ? "busca bibliográfica" : errorStage === "proposals" ? "formação dos cards" : "interpretação do briefing"}.</small> : null}
            {briefingPreserved ? <small>Seu briefing continua salvo e será reutilizado na nova tentativa.</small> : null}
          </div>
      <button disabled={busy} onClick={() => { trackAnalyticsEvent("generation_retry", { ...getAnalyticsWorkflowPosition("discovery"), app_result: "retry", app_reason_code: "provider_invalid_response" }); void discover(); }} type="button">Tentar novamente</button>
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
