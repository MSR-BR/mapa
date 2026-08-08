"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ResearchActivityIcon } from "@/modules/generation/research-activity-icon";
import type { ResearchWorkflow } from "./schema";

type Props = {
  autoDiscover?: boolean;
  initialWorkflow: ResearchWorkflow;
  originalPrompt: string;
  projectId: string;
};

type Operation = "discovering" | "selecting" | null;

export function ProposalDiscoveryWorkspace({ autoDiscover = false, initialWorkflow, originalPrompt, projectId }: Props) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [operation, setOperation] = useState<Operation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const autoTriggered = useRef(false);
  const discovery = workflow.content.discovery;
  const selectedCandidate = discovery?.candidates.find(
    (candidate) => candidate.id === discovery.selectedCandidateId,
  );
  const busy = operation !== null;

  async function discover() {
    setOperation("discovering");
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/discover`, { method: "POST" });
      const payload = await response.json() as { error?: string; workflow?: ResearchWorkflow };
      if (!response.ok || !payload.workflow) {
        throw new Error(payload.error || "Não foi possível buscar propostas.");
      }
      setWorkflow(payload.workflow);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível buscar propostas.");
    } finally {
      setOperation(null);
    }
  }

  async function selectCandidate(candidateId: string) {
    if (busy) return;
    setOperation("selecting");
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/proposal-selection`, {
        body: JSON.stringify({ candidateId }),
        headers: { "Content-Type": "application/json" },
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
      router.refresh();
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
          <span>{message}</span>
          <button disabled={busy} onClick={() => void discover()} type="button">Tentar novamente</button>
        </div>
      ) : null}

      {!discovery && !busy ? (
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
