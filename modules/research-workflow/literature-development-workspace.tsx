"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ResearchActivityIcon } from "@/modules/generation/research-activity-icon";
import { objectiveCoverageStatus, type ChapterTopicInput } from "./chapter-validation";
import { normalizeLiteratureSearchTerms } from "./literature-optimization";
import type { ResearchWorkflow } from "./schema";

type Props = { initialWorkflow: ResearchWorkflow; projectId: string };
type Chapter = "literature" | "development";
type Operation = "back" | "concept" | "initialize" | "optimize" | "regenerate" | "save" | "validate" | null;
type WorkflowReference = NonNullable<ResearchWorkflow["content"]["discovery"]>["references"][number];

const COVERAGE_DEGREE_LABELS = {
  full: "Atende bem",
  partial: "Ajuda em parte",
} as const;

function referenceText(reference: WorkflowReference) {
  const authors = reference.authors.slice(0, 2).join(", ");
  const title = reference.title ?? reference.referenceId;
  return `${authors || "Fonte"}${reference.year ? ` (${reference.year})` : ""}. ${title}`;
}

function readTopics(workflow: ResearchWorkflow, chapter: Chapter): ChapterTopicInput[] {
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
        title: topic.proposedContent,
      }] : [];
    });
}

export function LiteratureDevelopmentWorkspace({ initialWorkflow, projectId }: Props) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const chapter: Chapter = workflow.content.activeStep === "development_topics" ? "development" : "literature";
  const [topics, setTopics] = useState<ChapterTopicInput[]>(() => readTopics(initialWorkflow, chapter));
  const [operation, setOperation] = useState<Operation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showOptimize, setShowOptimize] = useState(false);
  const [keywords, setKeywords] = useState(() => initialWorkflow.content.discovery?.interpreted.keywords.join(", ") ?? "");
  const initialized = useRef(false);
  const discovery = workflow.content.discovery;
  const specifics = workflow.content.elements.filter((element) => element.type === "specific_objective" && element.status === "validated");
  const literatureTopics = chapter === "literature" ? topics : readTopics(workflow, "literature");
  const developmentTopics = chapter === "development" ? topics : readTopics(workflow, "development");
  const references = [...(discovery?.references ?? []), ...workflow.content.referenceArchive]
    .filter((reference, index, all) => all.findIndex((item) => item.referenceId === reference.referenceId) === index);
  const associatedReferenceIds = new Set([...literatureTopics, ...developmentTopics].flatMap((topic) => topic.referenceIds));
  const savedTopics = readTopics(workflow, chapter);
  const changed = JSON.stringify(topics) !== JSON.stringify(savedTopics);
  const busy = operation !== null;

  function applyWorkflow(next: ResearchWorkflow) {
    setWorkflow(next);
    const nextChapter: Chapter = next.content.activeStep === "development_topics" ? "development" : "literature";
    setTopics(readTopics(next, nextChapter));
    setKeywords(next.content.discovery?.interpreted.keywords.join(", ") ?? "");
  }

  async function submit(action: Exclude<Operation, null>, extra: Record<string, unknown> = {}) {
    if (busy) return;
    if (action === "regenerate" && changed && !window.confirm("A nova sugestão substituirá suas edições atuais. Deseja continuar?")) return;
    if (action === "optimize" && changed && !window.confirm("A otimização buscará nova literatura e substituirá os tópicos atuais após sucesso. Deseja continuar?")) return;
    setOperation(action);
    setMessage(null);
    setErrors([]);
    try {
      const requestBody: Record<string, unknown> = { action, revision: workflow.revision, step: chapter, ...extra };
      if (action === "save" || action === "validate") requestBody.topics = topics;
      const response = await fetch(`/api/projects/${projectId}/chapters`, {
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; errors?: string[]; message?: string; workflow?: ResearchWorkflow };
      if (response.status === 422) {
        setErrors(payload.errors ?? [payload.error ?? "Revise esta etapa."]);
        return;
      }
      if (!response.ok || !payload.workflow) throw new Error(payload.error || "Não foi possível atualizar o capítulo.");
      applyWorkflow(payload.workflow);
      if (action === "optimize") setShowOptimize(false);
      setMessage(payload.message ?? null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o capítulo.");
    } finally {
      setOperation(null);
    }
  }

  useEffect(() => {
    if (initialized.current || initialWorkflow.state !== "validating_literature" || readTopics(initialWorkflow, "literature").length >= 3) return;
    initialized.current = true;
    void submit("initialize");
    // Inicialização única ao entrar na Etapa 4.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateTopic(id: string, update: Partial<ChapterTopicInput>) {
    setTopics((current) => current.map((topic) => topic.id === id ? { ...topic, ...update } : topic));
  }

  function moveTopic(index: number, direction: -1 | 1) {
    setTopics((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function toggleObjective(topic: ChapterTopicInput, objectiveId: string) {
    const exists = topic.objectiveCoverage.some((coverage) => coverage.objectiveId === objectiveId);
    if (exists && topic.objectiveCoverage.length === 1) {
      setErrors(["Cada tópico precisa permanecer ligado a pelo menos um objetivo específico."]);
      return;
    }
    updateTopic(topic.id, {
      objectiveCoverage: exists
        ? topic.objectiveCoverage.filter((coverage) => coverage.objectiveId !== objectiveId)
        : [...topic.objectiveCoverage, { degree: chapter === "literature" ? "partial" : "full", objectiveId }],
    });
  }

  function toggleReference(topic: ChapterTopicInput, referenceId: string) {
    const exists = topic.referenceIds.includes(referenceId);
    updateTopic(topic.id, { referenceIds: exists ? topic.referenceIds.filter((id) => id !== referenceId) : [...topic.referenceIds, referenceId] });
  }

  function optimizeLiterature() {
    const searchTerms = normalizeLiteratureSearchTerms(keywords);
    if (searchTerms.length === 0) {
      setErrors(["Informe uma frase, tema ou palavra-chave para buscar nova literatura."]);
      return;
    }
    void submit("optimize", { keywords: searchTerms });
  }

  function associatedTopicTitles(referenceId: string) {
    return [...literatureTopics, ...developmentTopics]
      .filter((topic) => topic.referenceIds.includes(referenceId))
      .map((topic) => topic.title)
      .slice(0, 3);
  }

  if (workflow.state === "validating_methodology" && workflow.content.activeStep === null) {
    return (
      <section className="definition-complete">
        <p className="section-kicker">Etapas 4–5 validadas</p>
        <h2>Capítulos 2 e 4 consolidados</h2>
        <div className="chapter-complete-grid">
          <div><span>Capítulo 2 · Revisão da Literatura</span><ol>{readTopics(workflow, "literature").map((topic) => <li key={topic.id}>{topic.title}</li>)}</ol></div>
          <div><span>Capítulo 4 · Desenvolvimento</span><ol>{readTopics(workflow, "development").map((topic) => <li key={topic.id}>{topic.title}</li>)}</ol></div>
        </div>
        <p className="proposal-next-step">Próxima etapa: metodologia e resultados esperados na Change 013.</p>
      </section>
    );
  }

  const chapterNumber = chapter === "literature" ? 2 : 4;
  const stageNumber = chapter === "literature" ? 4 : 5;
  return (
    <section className="chapter-planning" aria-labelledby="chapter-planning-title">
      {busy ? (
        <div className="generation-overlay" role="status" aria-live="polite">
          <div className="generation-overlay-card"><ResearchActivityIcon /><p className="section-kicker">Etapa {stageNumber}</p><h2>{operation === "optimize" ? "Buscando nova literatura verificável…" : "Organizando tópicos e cobertura…"}</h2></div>
        </div>
      ) : null}

      <div className="definition-heading">
        <div><p className="section-kicker">Etapa {stageNumber} · Capítulo {chapterNumber}</p><h2 id="chapter-planning-title">{chapter === "literature" ? "Revisão da Literatura" : "Desenvolvimento / Estudo de Caso"}</h2><p>{chapter === "literature" ? "Organize a fundamentação teórica e indique quais objetivos cada tópico sustenta." : "Organize os tópicos que operacionalizam os objetivos e completam a cobertura da pesquisa."}</p></div>
        <span className={`definition-origin ${changed ? "user" : "ai"}`}>{changed ? "Editado por você" : "Sugestão da IA"}</span>
      </div>

      <aside className="coverage-panel" aria-label="Cobertura dos objetivos específicos">
        <strong>Cobertura dos objetivos</strong>
        {specifics.map((objective, index) => (
          <div key={objective.id}><span>OE{index + 1}</span><p>{objective.approvedContent}</p><b>{objectiveCoverageStatus(objective.id, literatureTopics, developmentTopics)}</b></div>
        ))}
      </aside>

      {workflow.content.knowledgeSuggestions.some((suggestion) => suggestion.status === "suggested") && chapter === "literature" ? (
        <aside className="knowledge-suggestions">
          <strong>Conceitos relacionados — aceite somente se forem úteis</strong>
          {workflow.content.knowledgeSuggestions.filter((suggestion) => suggestion.status === "suggested").map((suggestion) => (
            <div key={suggestion.id}><span>{suggestion.term}</span><p>{suggestion.rationale}</p><button onClick={() => void submit("concept", { conceptId: suggestion.id, conceptStatus: "accepted" })} type="button">Aceitar vocabulário</button><button onClick={() => void submit("concept", { conceptId: suggestion.id, conceptStatus: "rejected" })} type="button">Ignorar</button></div>
          ))}
        </aside>
      ) : null}
      {chapter === "literature" && workflow.content.knowledgeSuggestions.some((suggestion) => suggestion.status === "accepted") ? (
        <p className="accepted-knowledge">Vocabulário aceito: {workflow.content.knowledgeSuggestions.filter((suggestion) => suggestion.status === "accepted").map((suggestion) => suggestion.term).join(", ")}.</p>
      ) : null}

      <div className="chapter-topic-list">
        {topics.map((topic, index) => (
          <article className="chapter-topic-editor" key={topic.id}>
            <div className="chapter-topic-order"><span>{chapterNumber}.{index + 1}</span><button aria-label={`Mover ${topic.title} para cima`} disabled={index === 0} onClick={() => moveTopic(index, -1)} type="button">↑</button><button aria-label={`Mover ${topic.title} para baixo`} disabled={index === topics.length - 1} onClick={() => moveTopic(index, 1)} type="button">↓</button></div>
            <label>Título do tópico<input maxLength={180} onChange={(event) => updateTopic(topic.id, { title: event.target.value })} value={topic.title} /></label>
            <fieldset><legend>Objetivos relacionados</legend><p className="objective-coverage-help">OE = objetivo específico. Use “Atende bem” quando o tópico cobre o objetivo de modo central; use “Ajuda em parte” quando ele apenas contribui e precisa ser complementado por outros tópicos.</p>{specifics.map((objective, objectiveIndex) => {
              const coverage = topic.objectiveCoverage.find((item) => item.objectiveId === objective.id);
              return <div key={objective.id}><label><input checked={Boolean(coverage)} onChange={() => toggleObjective(topic, objective.id)} type="checkbox" /> OE{objectiveIndex + 1}</label>{coverage && chapter === "literature" ? <select aria-label={`Cobertura do objetivo ${objectiveIndex + 1}`} onChange={(event) => updateTopic(topic.id, { objectiveCoverage: topic.objectiveCoverage.map((item) => item.objectiveId === objective.id ? { ...item, degree: event.target.value as "partial" | "full" } : item) })} value={coverage.degree}><option value="partial">{COVERAGE_DEGREE_LABELS.partial}</option><option value="full">{COVERAGE_DEGREE_LABELS.full}</option></select> : null}</div>;
            })}</fieldset>
            <details className="topic-reference-picker"><summary>{topic.referenceIds.length} referências associadas</summary>{references.map((reference) => <label key={reference.referenceId}><input checked={topic.referenceIds.includes(reference.referenceId)} onChange={() => toggleReference(topic, reference.referenceId)} type="checkbox" />{reference.title || reference.referenceId}{reference.year ? ` (${reference.year})` : ""}</label>)}</details>
            {chapter === "development" && index === topics.length - 1 ? <div className="general-alignment"><label><input checked={topic.generalObjectiveAligned} onChange={(event) => updateTopic(topic.id, { generalObjectiveAligned: event.target.checked })} type="checkbox" /> Relaciona-se diretamente ao objetivo geral</label>{!topic.generalObjectiveAligned ? <input onChange={(event) => updateTopic(topic.id, { exceptionJustification: event.target.value || null })} placeholder="Justificativa metodológica para a exceção" value={topic.exceptionJustification ?? ""} /> : null}</div> : null}
            <button className="remove-topic" disabled={topics.length <= 3} onClick={() => setTopics((current) => current.filter((item) => item.id !== topic.id))} type="button">Remover tópico</button>
          </article>
        ))}
        <button className="add-specific-objective" disabled={topics.length >= 6 || specifics.length === 0} onClick={() => setTopics((current) => [...current, { exceptionJustification: null, generalObjectiveAligned: false, id: crypto.randomUUID(), objectiveCoverage: [{ degree: chapter === "literature" ? "partial" : "full", objectiveId: specifics[0].id }], referenceIds: [], title: "Novo tópico" }])} type="button">+ Adicionar tópico</button>
      </div>

      {errors.length > 0 ? <div className="definition-findings" role="alert"><strong>Revise antes de avançar</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div> : null}
      {message ? <p className="definition-message" role="status">{message}</p> : null}

      {chapter === "literature" ? (
        <div className="literature-optimizer">
          <article className="literature-optimizer-card">
            <div>
              <p className="section-kicker">Research Starter</p>
              <h3>Otimizar literatura</h3>
              <p className="literature-optimizer-guidance"><strong>Quando otimizar:</strong> use esta opção se as referências estiverem genéricas, se faltarem autores ou estudos importantes, se o recorte do tema mudou ou se os tópicos não estiverem bem conectados aos objetivos. Se tudo estiver bom, você pode apenas validar e avançar.</p>
            </div>
            {showOptimize ? <form onSubmit={(event) => { event.preventDefault(); optimizeLiterature(); }}><label>Nova busca de literatura<input onChange={(event) => setKeywords(event.target.value)} placeholder="Ex.: efeito barocalorico; materiais magnetocalóricos" value={keywords} /></label><button disabled={busy || normalizeLiteratureSearchTerms(keywords).length === 0} type="submit">Buscar no Research Starter e regenerar</button></form> : <button onClick={() => setShowOptimize(true)} type="button">Otimizar literatura</button>}
          </article>
        </div>
      ) : null}

      {chapter === "literature" && references.length > 0 ? (
        <aside className="workflow-references-panel" aria-label="Referências encontradas pelo Research Starter">
          <div>
            <p className="section-kicker">Research Starter</p>
            <h3>Referências encontradas e associadas</h3>
            <span>{associatedReferenceIds.size} associada(s) aos tópicos · {references.length} fonte(s) verificável(is)</span>
          </div>
          <ol>
            {references.map((reference) => {
              const titles = associatedTopicTitles(reference.referenceId);
              const associated = titles.length > 0;
              return (
                <li className={associated ? "associated" : ""} key={reference.referenceId}>
                  <b>{associated ? "Associada" : "Encontrada"}</b>
                  {reference.url ? <a href={reference.url} rel="noreferrer" target="_blank">{referenceText(reference)}</a> : <strong>{referenceText(reference)}</strong>}
                  <span>{associated ? `Tópicos: ${titles.join("; ")}` : "Ainda não associada a um tópico."}</span>
                </li>
              );
            })}
          </ol>
        </aside>
      ) : null}

      <div className="definition-actions">
        <button className="definition-button secondary" disabled={busy} onClick={() => void submit("back")} type="button">Voltar</button>
        <button className="definition-button secondary" disabled={busy} onClick={() => void submit("regenerate")} type="button">Regenerar sugestão</button>
        <button className="definition-button secondary" disabled={busy || !changed} onClick={() => void submit("save")} type="button">Salvar rascunho</button>
        <button className="definition-button primary" disabled={busy} onClick={() => void submit("validate")} type="button">Validar e avançar</button>
      </div>
    </section>
  );
}
