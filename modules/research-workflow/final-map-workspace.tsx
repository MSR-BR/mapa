"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  buildFinalMap,
  canCompleteFinalMap,
  type FinalMap,
  type FinalMapNode,
} from "./final-map";
import {
  buildReferenceCodeMap,
  literatureExpansionText,
  withCitationMarkers,
} from "./reference-citations";
import { pendingAdvisorReview } from "./advisor-review";
import { AdvisorReviewNotice } from "./advisor-review-notice";
import type { ResearchWorkflow } from "./schema";

type Props = { initialWorkflow: ResearchWorkflow; projectId: string };
type Operation = "complete" | "go_to" | "review" | null;

function chapterReferences(finalMap: FinalMap, referenceIds: string[]) {
  const wanted = new Set(referenceIds);
  return finalMap.references.filter((reference) => wanted.has(reference.referenceId));
}

function referenceText(reference: FinalMap["references"][number], code?: string) {
  const authors = reference.authors.slice(0, 2).join(", ");
  const title = reference.title ?? reference.referenceId;
  return `${code ? `[${code}] ` : ""}${authors || "Fonte"}${reference.year ? ` (${reference.year})` : ""}. ${title}`;
}

export function FinalMapWorkspace({ initialWorkflow, projectId }: Props) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [operation, setOperation] = useState<Operation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const finalMap = useMemo(() => buildFinalMap(workflow), [workflow]);
  const referenceCodes = useMemo(() => buildReferenceCodeMap(finalMap.references), [finalMap.references]);
  const selectedNode = finalMap.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdges = selectedNodeId
    ? finalMap.edges.filter((edge) => edge.from === selectedNodeId || edge.to === selectedNodeId)
    : [];
  const blockingFindings = finalMap.findings.filter((finding) => finding.severity === "blocking");
  const warningFindings = finalMap.findings.filter((finding) => finding.severity !== "blocking");
  const busy = operation !== null;
  const waitingForAdvisor = Boolean(pendingAdvisorReview(workflow.content));
  const exportSuffix = workflow.state === "completed" ? "" : "?draft=1";

  function topicReferenceIds(topicIds: string[]) {
    const topics = [...finalMap.literatureTopics, ...finalMap.developmentTopics];
    return topics.filter((topic) => topicIds.includes(topic.id)).flatMap((topic) => topic.referenceIds);
  }

  async function submit(action: Exclude<Operation, null>, targetStep?: NonNullable<FinalMapNode["correctionStep"]>) {
    if (busy) return;
    if (action === "complete" && !window.confirm("Concluir este mapa como versão validada?")) return;
    setOperation(action);
    setMessage(null);
    setErrors([]);
    try {
      const response = await fetch(`/api/projects/${projectId}/final-map`, {
        body: JSON.stringify({ action, revision: workflow.revision, targetStep }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; errors?: string[]; message?: string; workflow?: ResearchWorkflow };
      if (payload.workflow) setWorkflow(payload.workflow);
      if (response.status === 422) {
        setErrors(payload.errors ?? [payload.error ?? "Revise as pendências antes de concluir."]);
        return;
      }
      if (!response.ok || !payload.workflow) throw new Error(payload.error || "Não foi possível atualizar o mapa final.");
      if (action === "complete") {
        router.push("/dashboard");
        return;
      }
      setMessage(payload.message ?? (action === "review" ? "Coerência revisada." : null));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o mapa final.");
    } finally {
      setOperation(null);
    }
  }

  function correctionButton(step: FinalMapNode["correctionStep"], label = "Corrigir origem") {
    return step ? (
      <button disabled={busy} onClick={() => void submit("go_to", step)} type="button">{label}</button>
    ) : null;
  }

  function nodeButton(node: FinalMapNode) {
    const active = selectedNodeId === node.id;
    return (
      <button
        className={active ? "selected" : ""}
        key={node.id}
        onClick={() => setSelectedNodeId(active ? null : node.id)}
        type="button"
      >
        <span>{node.label}</span>
        <strong>{node.title}</strong>
      </button>
    );
  }

  return (
    <section className="final-map-workspace" aria-labelledby="final-map-title">
      <div className="definition-heading">
        <div>
          <p className="section-kicker">Mapa final</p>
          <h2 id="final-map-title">{finalMap.title?.approvedContent ?? finalMap.title?.proposedContent ?? "Mapa da proposta de pesquisa"}</h2>
          <p>A proposta abaixo reúne as etapas validadas e mostra a cadeia lógica entre problema, objetivos, capítulos, metodologia, resultados esperados e evidências.</p>
        </div>
        <span className={`definition-origin ${workflow.state === "completed" ? "" : "user"}`}>{workflow.state === "completed" ? "Versão concluída" : "Em revisão final"}</span>
      </div>

      <div className="final-map-actions">
        <button className="definition-button secondary" disabled={busy} onClick={() => void submit("review")} type="button">Revisar coerência</button>
        <button className="definition-button primary" disabled={busy || waitingForAdvisor || !canCompleteFinalMap(finalMap) || workflow.state === "completed"} onClick={() => void submit("complete")} type="button">Validar pelo estudante</button>
      </div>
      <AdvisorReviewNotice workflow={workflow} />
      <div className="final-export-panel" aria-label="Exportar mapa final">
        <div>
          <strong>{workflow.state === "completed" ? "Exportar versão concluída" : "Exportar rascunho identificado"}</strong>
          <span>{workflow.state === "completed" ? "PDF com referências cruzadas e avisos preservados." : "O PDF indicará que o mapa ainda é rascunho e manterá bloqueios/avisos visíveis."}</span>
        </div>
        <div>
          <a href={`/api/projects/${projectId}/exports/pdf${exportSuffix}`}>Exportar PDF</a>
        </div>
      </div>

      {errors.length > 0 ? <div className="definition-findings" role="alert"><strong>Revise antes de concluir</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div> : null}
      {message ? <p className="definition-message" role="status">{message}</p> : null}

      <div className="final-map-layout">
        <article className="final-map-document">
          <section id="problem-section">
            <p className="section-kicker">Etapa 1</p>
            <h3>Problemática da pesquisa</h3>
            <p>{withCitationMarkers(finalMap.problemStatement?.approvedContent ?? "", finalMap.problemStatement?.referenceIds ?? [], referenceCodes)}</p>
            {correctionButton("problem")}
          </section>

          <section>
            <p className="section-kicker">Etapa 2</p>
            <h3>Objetivo geral</h3>
            <p>{withCitationMarkers(finalMap.generalObjective?.approvedContent ?? "", finalMap.generalObjective?.referenceIds ?? [], referenceCodes)}</p>
            {correctionButton("general")}
          </section>

          <section>
            <p className="section-kicker">Etapa 3</p>
            <h3>Objetivos específicos</h3>
            <ol>{finalMap.specificObjectives.map((objective) => <li key={objective.id}>{withCitationMarkers(objective.approvedContent ?? "", objective.referenceIds, referenceCodes)}</li>)}</ol>
            {correctionButton("specifics")}
          </section>

          <section>
            <p className="section-kicker">Capítulo 3</p>
            <h3>Metodologia e resultados esperados</h3>
            <div className="final-method-table">
              {finalMap.methodologyRows.map((row, index) => {
                const objective = finalMap.specificObjectives.find((item) => item.id === row.objectiveId);
                return (
                  <div key={row.id}>
                    <span>OE{index + 1}</span>
                    <p><strong>Objetivo:</strong> {objective?.approvedContent}</p>
                    <p><strong>Levantamento:</strong> {row.dataCollection}</p>
                    <p><strong>Análise/tratamento:</strong> {row.analysisTreatment}</p>
                    <p><strong>Resultado esperado:</strong> {withCitationMarkers(row.expectedResult, topicReferenceIds(row.associatedTopicIds), referenceCodes)}</p>
                  </div>
                );
              })}
            </div>
            {correctionButton("methodology")}
          </section>

          <section>
            <p className="section-kicker">Etapa 4 · Capítulo 2</p>
            <h3>Revisão da Literatura</h3>
            <ol>{finalMap.literatureTopics.map((topic) => (
              <li key={topic.id}>
                <strong>{topic.label}</strong> {withCitationMarkers(topic.title, topic.referenceIds, referenceCodes)}
                <p className="literature-draft-text">{literatureExpansionText(topic.title, topic.referenceIds, referenceCodes)}</p>
              </li>
            ))}</ol>
            {correctionButton("literature")}
          </section>

          <section>
            <p className="section-kicker">Etapa 5 · Capítulo 4</p>
            <h3>Desenvolvimento / Estudo de Caso / Análise e Discussão</h3>
            <ol>{finalMap.developmentTopics.map((topic) => <li key={topic.id}><strong>{topic.label}</strong> {withCitationMarkers(topic.title, topic.referenceIds, referenceCodes)}</li>)}</ol>
            {correctionButton("development")}
          </section>

          <section>
            <p className="section-kicker">Referências verificáveis</p>
            <h3>Fontes usadas na construção</h3>
            {finalMap.references.length > 0 ? (
              <ol className="final-reference-list">
                {finalMap.references.map((reference) => (
                  <li key={reference.referenceId}>
                    {reference.url ? <a href={reference.url} rel="noreferrer" target="_blank">{referenceText(reference, referenceCodes.get(reference.referenceId))}</a> : referenceText(reference, referenceCodes.get(reference.referenceId))}
                  </li>
                ))}
              </ol>
            ) : <p>Nenhuma referência associada ao mapa final.</p>}
          </section>

          <section>
            <p className="section-kicker">Avisos e pendências</p>
            <h3>Coerência do mapa</h3>
            {finalMap.findings.length === 0 ? <p>Nenhuma inconsistência encontrada.</p> : (
              <ul className="final-finding-list">
                {finalMap.findings.map((finding) => {
                  const step = finalMap.nodes.find((node) => finding.elementIds.includes(node.id))?.correctionStep ?? null;
                  return (
                    <li className={finding.severity} key={finding.id}>
                      <strong>{finding.severity === "blocking" ? "Bloqueio" : finding.severity === "warning" ? "Aviso" : "Sugestão"}</strong>
                      <span>{finding.message}</span>
                      {finding.resolution ? <p>{finding.resolution}</p> : null}
                      {correctionButton(step, "Ir para correção")}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </article>

        <aside className="traceability-panel" aria-label="Rastreabilidade do mapa">
          <h3>Rastreabilidade</h3>
          <p>Selecione um elemento para ver origens e destinos.</p>
          <div className="trace-node-list">
            {finalMap.nodes.filter((item) => item.kind !== "reference").map(nodeButton)}
          </div>
          {selectedNode ? (
            <div className="trace-selection">
              <strong>{selectedNode.label} · {selectedNode.title}</strong>
              <p>{selectedNode.content}</p>
              {correctionButton(selectedNode.correctionStep)}
              <ul>
                {selectedEdges.map((edge) => {
                  const other = finalMap.nodes.find((node) => node.id === (edge.from === selectedNode.id ? edge.to : edge.from));
                  return <li key={`${edge.from}-${edge.to}-${edge.label}`}><span>{edge.from === selectedNode.id ? "Destino" : "Origem"}</span>{edge.label}{other ? ` · ${other.label}: ${other.title}` : ""}</li>;
                })}
              </ul>
              {selectedNode.kind === "literature" || selectedNode.kind === "development" ? (
                <div className="trace-references">
                  <strong>Referências associadas</strong>
                  {chapterReferences(finalMap, [...finalMap.literatureTopics, ...finalMap.developmentTopics].find((topic) => topic.id === selectedNode.id)?.referenceIds ?? []).map((reference) => (
                    <p key={reference.referenceId}>{referenceText(reference, referenceCodes.get(reference.referenceId))}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="final-coherence-summary">
            <span>{blockingFindings.length}</span>
            <p>bloqueios</p>
            <span>{warningFindings.length}</span>
            <p>avisos e sugestões</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
