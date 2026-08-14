"use client";

import { useMemo, useState } from "react";

import { ADVISOR_REVIEW_LABELS, currentAdvisorReview } from "./advisor-review";
import type { AdvisorReview, ResearchWorkflow, ResearchWorkflowContent, ValidatedElement } from "./schema";

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
    </section>
  );
}
