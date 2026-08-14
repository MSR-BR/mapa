"use client";

import { useMemo, useState } from "react";

import { ADVISOR_REVIEW_LABELS, currentAdvisorReview } from "./advisor-review";
import { buildFinalMap, type FinalMap, type FinalMapTopic } from "./final-map";
import { buildReferenceCodeMap, withCitationMarkers } from "./reference-citations";
import type { AdvisorReview, DiscoveryReference, ResearchWorkflow, ResearchWorkflowContent, ValidatedElement } from "./schema";

type AdvisorAction = "approve" | "request_changes" | "save_comment";

type Props = {
  initialWorkflow: ResearchWorkflow;
  projectId: string;
  projectTitle: string;
};

function element(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.find((item) => item.type === type);
}

function elements(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.filter((item) => item.type === type);
}

function readable(item: ValidatedElement | null | undefined) {
  return item?.approvedContent?.trim() || item?.proposedContent?.trim() || "";
}

function uniqueReferences(references: DiscoveryReference[]) {
  return references.filter((reference, index, all) => (
    all.findIndex((item) => item.referenceId === reference.referenceId) === index
  ));
}

function allWorkflowReferences(content: ResearchWorkflowContent) {
  return uniqueReferences([...(content.discovery?.references ?? []), ...content.referenceArchive]);
}

function referenceText(reference: DiscoveryReference, code?: string) {
  const authors = reference.authors.slice(0, 2).join(", ") || "Fonte";
  const year = reference.year ? ` (${reference.year})` : "";
  return `${code ? `[${code}] ` : ""}${authors}${year}. ${reference.title ?? reference.referenceId}`;
}

function referenceBadges(references: DiscoveryReference[], referenceIds: string[], referenceCodes: Map<string, string>) {
  const wanted = new Set(referenceIds);
  const selected = references.filter((reference) => wanted.has(reference.referenceId));
  if (selected.length === 0) return null;
  return (
    <div className="advisor-readonly-references-inline">
      <span>Referências associadas</span>
      {selected.map((reference) => (
        reference.url ? (
          <a href={reference.url} key={reference.referenceId} rel="noreferrer" target="_blank">
            {referenceText(reference, referenceCodes.get(reference.referenceId))}
          </a>
        ) : (
          <b key={reference.referenceId}>{referenceText(reference, referenceCodes.get(reference.referenceId))}</b>
        )
      ))}
    </div>
  );
}

function studentJustification(value: string | null | undefined, label = "Justificativa do estudante") {
  return value?.trim() ? (
    <p className="advisor-readonly-note">
      <span>{label}</span>
      {value.trim()}
    </p>
  ) : null;
}

function topicDetail(content: ResearchWorkflowContent, topic: FinalMapTopic) {
  return content.chapterTopicDetails.find((detail) => detail.topicId === topic.id);
}

function objectiveLabel(finalMap: FinalMap, objectiveId: string, fallbackIndex: number) {
  if (finalMap.generalObjective?.id === objectiveId) return "OEG";
  const specificIndex = finalMap.specificObjectives.findIndex((objective) => objective.id === objectiveId);
  return specificIndex >= 0 ? `OE${specificIndex + 1}` : `Linha ${fallbackIndex + 1}`;
}

function objectiveText(finalMap: FinalMap, objectiveId: string) {
  if (finalMap.generalObjective?.id === objectiveId) return readable(finalMap.generalObjective);
  return readable(finalMap.specificObjectives.find((objective) => objective.id === objectiveId));
}

function chapterTopics(content: ResearchWorkflowContent, chapter: "development" | "literature") {
  const type = chapter === "literature" ? "literature_topic" : "development_topic";
  const byId = new Map(elements(content, type).map((item) => [item.id, item]));
  return content.chapterTopicDetails
    .filter((detail) => detail.chapter === chapter)
    .toSorted((left, right) => left.order - right.order)
    .flatMap((detail) => {
      const topic = byId.get(detail.topicId);
      return topic ? [{ label: chapter === "literature" ? `2.${detail.order}` : `4.${detail.order}`, text: readable(topic) }] : [];
    });
}

function reviewItems(content: ResearchWorkflowContent, review: AdvisorReview) {
  if (review.step === "problem_statement") {
    return [{ label: "Problemática da pesquisa", text: readable(element(content, "problem_statement")) }];
  }
  if (review.step === "general_objective") {
    return [{ label: "Objetivo geral", text: readable(element(content, "general_objective")) }];
  }
  if (review.step === "specific_objectives") {
    return elements(content, "specific_objective").map((item, index) => ({ label: `OE${index + 1}`, text: readable(item) }));
  }
  if (review.step === "literature_topics") {
    return chapterTopics(content, "literature").map((topic) => ({ label: topic.label, text: topic.text }));
  }
  if (review.step === "development_topics") {
    return chapterTopics(content, "development").map((topic) => ({ label: topic.label, text: topic.text }));
  }
  if (review.step === "methodology_matrix") {
    const classification = content.methodologyClassification;
    return [
      classification ? {
        label: "Classificação metodológica",
        text: [
          `Natureza: ${classification.nature}`,
          `Abordagem: ${classification.approach}`,
          `Objetivos: ${classification.objectives.join(", ")}`,
        ].join(" · "),
      } : null,
      ...content.methodologyRows.map((row, index) => ({
        label: index === content.methodologyRows.length - 1 && row.objectiveId === "general_objective" ? "OEG" : `Linha ${index + 1}`,
        text: [
          `Levantamento: ${row.dataCollection}`,
          `Análise/tratamento: ${row.analysisTreatment}`,
          `Resultado esperado: ${row.expectedResult}`,
        ].join("\n"),
      })),
    ].filter((item): item is { label: string; text: string } => Boolean(item));
  }
  return [
    { label: "Título final", text: readable(element(content, "research_title")) },
    { label: "Mapa final", text: readable(element(content, "final_map")) || "O mapa final foi consolidado pelo estudante." },
  ];
}

function AdvisorReadOnlyProject({ workflow }: { workflow: ResearchWorkflow }) {
  const content = workflow.content;
  const finalMap = useMemo(() => buildFinalMap(workflow), [workflow]);
  const references = useMemo(() => allWorkflowReferences(content), [content]);
  const referenceCodes = useMemo(() => buildReferenceCodeMap(references), [references]);
  const problem = element(content, "problem_statement");
  const general = element(content, "general_objective");
  const specificObjectives = elements(content, "specific_objective");
  const researchTitle = element(content, "research_title");
  const finalSummary = element(content, "final_map");
  const selectedCandidate = content.discovery?.candidates.find((candidate) => candidate.id === content.discovery?.selectedCandidateId);

  return (
    <section className="advisor-readonly-map" aria-labelledby="advisor-readonly-title">
      <div className="advisor-readonly-heading">
        <div>
          <p className="eyebrow">Modo leitura</p>
          <h3 id="advisor-readonly-title">Tudo que o estudante construiu</h3>
          <span>
            Conteúdo bloqueado para edição nesta área. Use comentários e validação para orientar a próxima versão.
          </span>
        </div>
        <b>{workflow.state === "completed" ? "Projeto concluído" : "Projeto em andamento"}</b>
      </div>

      <div className="advisor-readonly-grid">
        <article className="advisor-readonly-card advisor-readonly-card-wide">
          <span>Entrada e proposta escolhida</span>
          <h4>Briefing inicial</h4>
          <p>{content.discovery?.originalPrompt || "Briefing inicial ainda não registrado."}</p>
          {selectedCandidate ? (
            <div className="advisor-readonly-subcard">
              <strong>{selectedCandidate.title}</strong>
              <p>{selectedCandidate.problemQuestion}</p>
              <small>{selectedCandidate.context}</small>
            </div>
          ) : null}
        </article>

        <article className="advisor-readonly-card">
          <span>Etapa 1</span>
          <h4>Problemática da pesquisa</h4>
          <p>{withCitationMarkers(readable(problem), problem?.referenceIds ?? [], referenceCodes) || "Ainda não validada."}</p>
          {studentJustification(problem?.studentJustification, "Justificativa da grande pergunta")}
          {referenceBadges(references, problem?.referenceIds ?? [], referenceCodes)}
        </article>

        <article className="advisor-readonly-card">
          <span>Etapa 2</span>
          <h4>Objetivo geral</h4>
          <p>{withCitationMarkers(readable(general), general?.referenceIds ?? [], referenceCodes) || "Ainda não validado."}</p>
          {studentJustification(general?.studentJustification, "Justificativa do objetivo geral")}
          {referenceBadges(references, general?.referenceIds ?? [], referenceCodes)}
        </article>

        <article className="advisor-readonly-card advisor-readonly-card-wide">
          <span>Etapa 3</span>
          <h4>Objetivos específicos</h4>
          {specificObjectives.length > 0 ? (
            <ol className="advisor-readonly-list">
              {specificObjectives.map((objective, index) => (
                <li key={objective.id}>
                  <strong>OE{index + 1}</strong>
                  <p>{withCitationMarkers(readable(objective), objective.referenceIds, referenceCodes)}</p>
                  {studentJustification(objective.studentJustification)}
                  {referenceBadges(references, objective.referenceIds, referenceCodes)}
                </li>
              ))}
            </ol>
          ) : <p>Objetivos específicos ainda não registrados.</p>}
        </article>

        <article className="advisor-readonly-card advisor-readonly-card-wide">
          <span>Etapa 4 · Capítulo 2</span>
          <h4>Revisão da literatura</h4>
          {finalMap.literatureTopics.length > 0 ? (
            <ol className="advisor-readonly-list">
              {finalMap.literatureTopics.map((topic) => {
                const detail = topicDetail(content, topic);
                return (
                  <li key={topic.id}>
                    <strong>{topic.label}</strong>
                    <p>{withCitationMarkers(topic.title, topic.referenceIds, referenceCodes)}</p>
                    {studentJustification(detail?.studentJustification, "Justificativa do tópico")}
                    {referenceBadges(references, topic.referenceIds, referenceCodes)}
                  </li>
                );
              })}
            </ol>
          ) : <p>Tópicos de literatura ainda não registrados.</p>}
        </article>

        <article className="advisor-readonly-card advisor-readonly-card-wide">
          <span>Etapa 5 · Capítulo 4</span>
          <h4>Desenvolvimento / estudo de caso</h4>
          {finalMap.developmentTopics.length > 0 ? (
            <ol className="advisor-readonly-list">
              {finalMap.developmentTopics.map((topic) => {
                const detail = topicDetail(content, topic);
                return (
                  <li key={topic.id}>
                    <strong>{topic.label}</strong>
                    <p>{withCitationMarkers(topic.title, topic.referenceIds, referenceCodes)}</p>
                    {studentJustification(detail?.studentJustification, "Justificativa do tópico")}
                    {detail?.exceptionJustification ? studentJustification(detail.exceptionJustification, "Observação sobre exceção") : null}
                    {referenceBadges(references, topic.referenceIds, referenceCodes)}
                  </li>
                );
              })}
            </ol>
          ) : <p>Tópicos do capítulo 4 ainda não registrados.</p>}
        </article>

        <article className="advisor-readonly-card advisor-readonly-card-wide">
          <span>Etapa 6</span>
          <h4>Metodologia e resultados esperados</h4>
          {content.methodologyClassification ? (
            <div className="advisor-readonly-subcard">
              <strong>Classificação metodológica</strong>
              <p>
                {content.methodologyClassification.nature} · {content.methodologyClassification.approach} · {content.methodologyClassification.objectives.join(", ")}
              </p>
              <small>
                Procedimentos: {content.methodologyClassification.procedures.join(", ")} · Instrumentos: {content.methodologyClassification.instruments.join(", ")}
              </small>
            </div>
          ) : <p>Classificação metodológica ainda não registrada.</p>}
          {content.methodologyRows.length > 0 ? (
            <ol className="advisor-readonly-list advisor-readonly-methodology">
              {content.methodologyRows.map((row, index) => (
                <li key={row.id}>
                  <strong>{objectiveLabel(finalMap, row.objectiveId, index)}</strong>
                  <p><b>Objetivo:</b> {objectiveText(finalMap, row.objectiveId) || "Objetivo não localizado."}</p>
                  <p><b>Levantamento:</b> {row.dataCollection}</p>
                  <p><b>Análise/tratamento:</b> {row.analysisTreatment}</p>
                  <p><b>Resultado esperado:</b> {row.expectedResult}</p>
                  {studentJustification(row.studentJustification, "Justificativa da linha")}
                </li>
              ))}
            </ol>
          ) : null}
        </article>

        <article className="advisor-readonly-card">
          <span>Título final</span>
          <h4>{readable(researchTitle) || "Título ainda não consolidado"}</h4>
        </article>

        <article className="advisor-readonly-card">
          <span>Mapa final</span>
          <h4>Status</h4>
          <p>{readable(finalSummary) || "Mapa final ainda não concluído."}</p>
        </article>

        <article className="advisor-readonly-card advisor-readonly-card-wide">
          <span>Referências</span>
          <h4>Fontes disponíveis no projeto</h4>
          {references.length > 0 ? (
            <ol className="advisor-readonly-reference-list">
              {references.map((reference) => (
                <li key={reference.referenceId}>
                  {reference.url ? (
                    <a href={reference.url} rel="noreferrer" target="_blank">
                      {referenceText(reference, referenceCodes.get(reference.referenceId))}
                    </a>
                  ) : (
                    <strong>{referenceText(reference, referenceCodes.get(reference.referenceId))}</strong>
                  )}
                  {reference.doi ? <small>DOI: {reference.doi}</small> : null}
                  {reference.source === "manual" ? <em>Referência externa adicionada pelo usuário</em> : null}
                </li>
              ))}
            </ol>
          ) : <p>Nenhuma referência disponível no projeto.</p>}
        </article>
      </div>
    </section>
  );
}

export function AdvisorReviewWorkspace({ initialWorkflow, projectId, projectTitle }: Props) {
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const review = currentAdvisorReview(workflow.content);
  const [comments, setComments] = useState(review?.advisorComments ?? "");
  const [busyAction, setBusyAction] = useState<AdvisorAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = useMemo(() => review ? reviewItems(workflow.content, review) : [], [review, workflow.content]);
  const canAct = review?.status === "pending";

  async function submit(action: AdvisorAction) {
    if (!review || !canAct) return;
    setBusyAction(action);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/advisor-review`, {
        body: JSON.stringify({
          action,
          comments,
          reviewId: review.id,
          revision: workflow.revision,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; message?: string; workflow?: ResearchWorkflow };
      if (!response.ok || !payload.workflow) throw new Error(payload.error ?? "Não foi possível salvar a validação.");
      setWorkflow(payload.workflow);
      setMessage(payload.message ?? "Validação salva.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a validação.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="advisor-review-workspace" aria-labelledby="advisor-review-title">
      <div className="advisor-review-hero">
        <p className="eyebrow">Área do orientador</p>
        <h2 id="advisor-review-title">{projectTitle}</h2>
        <p>
          Revise a etapa enviada pelo estudante. Ele só poderá avançar quando você validar,
          ou poderá corrigir se você solicitar ajustes.
        </p>
      </div>

      {!review ? (
        <div className="inline-state advisor-review-empty" role="status">
          <strong>Nenhuma etapa aguardando validação.</strong>
          <span>Quando o estudante validar uma etapa, ela aparecerá aqui para sua análise.</span>
        </div>
      ) : (
        <>
          <div className={`advisor-review-status advisor-review-status-${review.status}`}>
            <span>{review.status === "pending" ? "Aguardando sua validação" : "Correção solicitada"}</span>
            <strong>{ADVISOR_REVIEW_LABELS[review.step]}</strong>
          </div>

          <div className="advisor-review-summary">
            {items.map((item) => (
              <article key={`${item.label}-${item.text.slice(0, 24)}`}>
                <span>{item.label}</span>
                <p>{item.text}</p>
              </article>
            ))}
          </div>

          <label className="advisor-review-comments">
            <span>Comentários do orientador</span>
            <textarea
              disabled={!canAct || busyAction !== null}
              maxLength={2_000}
              onChange={(event) => setComments(event.target.value)}
              placeholder="Escreva observações objetivas para orientar a próxima versão do estudante."
              value={comments}
            />
          </label>

          {message ? <p className="definition-save-state saved" role="status">{message}</p> : null}
          {error ? <p className="definition-save-state error" role="alert">{error}</p> : null}

          <div className="advisor-review-actions">
            <button className="definition-button secondary" disabled={!canAct || busyAction !== null} onClick={() => void submit("save_comment")} type="button">
              {busyAction === "save_comment" ? "Salvando…" : "Salvar comentário"}
            </button>
            <button className="definition-button secondary advisor-request-button" disabled={!canAct || busyAction !== null} onClick={() => void submit("request_changes")} type="button">
              {busyAction === "request_changes" ? "Salvando…" : "Solicitar correção"}
            </button>
            <button className="definition-button primary" disabled={!canAct || busyAction !== null} onClick={() => void submit("approve")} type="button">
              {busyAction === "approve" ? "Validando…" : "Validar etapa"}
            </button>
          </div>
        </>
      )}
      <AdvisorReadOnlyProject workflow={workflow} />
    </section>
  );
}
