"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { ResearchActivityIcon } from "@/modules/generation/research-activity-icon";
import type { ChapterTopicInput } from "./chapter-validation";
import type { MethodologyPlanInput } from "./methodology-validation";
import type { ResearchWorkflow } from "./schema";

type Props = { initialWorkflow: ResearchWorkflow; projectId: string };
type Operation = "back" | "initialize" | "regenerate" | "save" | "validate" | null;
type ClassificationDraft = MethodologyPlanInput["classification"];
type MethodologyRowDraft = MethodologyPlanInput["rows"][number];
type WorkflowReference = NonNullable<ResearchWorkflow["content"]["discovery"]>["references"][number];
type MethodologyHelpTopic = "approach" | "nature" | "objectives";

const METHODOLOGY_HELP: Record<MethodologyHelpTopic, { body: string; title: string }> = {
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
  analysisTechniques: ["Análise temática"],
  approach: "Qualitativa",
  ethicsWarnings: [],
  instruments: ["Documentos e literatura verificável"],
  nature: "Aplicada",
  objectives: ["Exploratória", "Descritiva"],
  procedures: ["Pesquisa documental"],
  rationale: "Classificação metodológica inicial a ser confirmada conforme o desenho da pesquisa.",
};

function findTitle(workflow: ResearchWorkflow) {
  return workflow.content.elements.find((element) => element.type === "research_title")?.proposedContent ?? "";
}

function specificObjectives(workflow: ResearchWorkflow) {
  return workflow.content.elements.filter((element) => element.type === "specific_objective" && element.status === "validated");
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
  return workflow.content.methodologyRows.map((row) => ({
    analysisTreatment: row.analysisTreatment,
    associatedTopicIds: row.associatedTopicIds,
    dataCollection: row.dataCollection,
    expectedResult: row.expectedResult,
    id: row.id,
    objectiveId: row.objectiveId,
    warnings: row.warnings,
  }));
}

function textToList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

function listToText(items: string[]) {
  return items.join(", ");
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

export function MethodologyWorkspace({ initialWorkflow, projectId }: Props) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [title, setTitle] = useState(() => findTitle(initialWorkflow));
  const [classification, setClassification] = useState<ClassificationDraft>(() => classificationDraft(initialWorkflow));
  const [proceduresText, setProceduresText] = useState(() => listToText(classificationDraft(initialWorkflow).procedures));
  const [instrumentsText, setInstrumentsText] = useState(() => listToText(classificationDraft(initialWorkflow).instruments));
  const [analysisText, setAnalysisText] = useState(() => listToText(classificationDraft(initialWorkflow).analysisTechniques));
  const [ethicsText, setEthicsText] = useState(() => listToText(classificationDraft(initialWorkflow).ethicsWarnings));
  const [rows, setRows] = useState<MethodologyRowDraft[]>(() => rowsDraft(initialWorkflow));
  const [operation, setOperation] = useState<Operation>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [openHelp, setOpenHelp] = useState<MethodologyHelpTopic | null>(null);
  const initialized = useRef(false);
  const busy = operation !== null;
  const specifics = specificObjectives(workflow);
  const literatureTopics = readTopics(workflow, "literature");
  const developmentTopics = readTopics(workflow, "development");
  const topics = [...literatureTopics.map((topic) => ({ ...topic, chapterLabel: "Cap. 2" })), ...developmentTopics.map((topic) => ({ ...topic, chapterLabel: "Cap. 4" }))];
  const references = [...(workflow.content.discovery?.references ?? []), ...workflow.content.referenceArchive]
    .filter((reference, index, all) => all.findIndex((item) => item.referenceId === reference.referenceId) === index);
  const referenceById = new Map(references.map((reference) => [reference.referenceId, reference]));
  const currentClassification: ClassificationDraft = {
    ...classification,
    analysisTechniques: textToList(analysisText),
    ethicsWarnings: textToList(ethicsText),
    instruments: textToList(instrumentsText),
    procedures: textToList(proceduresText),
  };
  const savedPlan = JSON.stringify({ classification: classificationDraft(workflow), rows: rowsDraft(workflow), title: findTitle(workflow) });
  const currentPlan = JSON.stringify({ classification: currentClassification, rows, title });
  const changed = savedPlan !== currentPlan;
  const findings = workflow.content.coherenceFindings.filter((finding) => finding.rule.includes("Change 013") || finding.rule.includes("metodológica"));

  function applyWorkflow(next: ResearchWorkflow) {
    setWorkflow(next);
    const nextClassification = classificationDraft(next);
    setTitle(findTitle(next));
    setClassification(nextClassification);
    setProceduresText(listToText(nextClassification.procedures));
    setInstrumentsText(listToText(nextClassification.instruments));
    setAnalysisText(listToText(nextClassification.analysisTechniques));
    setEthicsText(listToText(nextClassification.ethicsWarnings));
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

  async function submit(action: Exclude<Operation, null>) {
    if (busy) return;
    if (action === "regenerate" && changed && !window.confirm("A nova sugestão substituirá suas edições atuais. Deseja continuar?")) return;
    setOperation(action);
    setMessage(null);
    setErrors([]);
    try {
      const includePlan = action === "save" || action === "validate";
      const response = await fetch(`/api/projects/${projectId}/methodology`, {
        body: JSON.stringify({
          action,
          classification: includePlan ? currentClassification : undefined,
          revision: workflow.revision,
          rows: includePlan ? rows : undefined,
          title: includePlan ? title : undefined,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; errors?: string[]; message?: string; workflow?: ResearchWorkflow };
      if (payload.workflow) applyWorkflow(payload.workflow);
      if (response.status === 422) {
        setErrors(payload.errors ?? [payload.error ?? "Revise a matriz metodológica."]);
        return;
      }
      if (!response.ok || !payload.workflow) throw new Error(payload.error || "Não foi possível atualizar a metodologia.");
      setMessage(payload.message ?? null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a metodologia.");
    } finally {
      setOperation(null);
    }
  }

  useEffect(() => {
    if (initialized.current || initialWorkflow.state !== "validating_methodology" || initialWorkflow.content.methodologyRows.length > 0) return;
    initialized.current = true;
    void submit("initialize");
    // Inicialização única ao entrar na Etapa 6.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <p className="section-kicker">Etapa 6 validada</p>
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
    <section className="methodology-workspace" aria-labelledby="methodology-title">
      {busy ? (
        <div className="generation-overlay" role="status" aria-live="polite">
          <div className="generation-overlay-card">
            <ResearchActivityIcon />
            <p className="section-kicker">Etapa 6</p>
            <h2>{operation === "initialize" || operation === "regenerate" ? "Construindo a matriz metodológica…" : "Salvando sua metodologia…"}</h2>
          </div>
        </div>
      ) : null}

      <nav className="definition-progress methodology-progress" aria-label="Progresso da construção">
        {["Problemática", "Objetivos", "Capítulos", "Metodologia"].map((label, index) => (
          <span className={index === 3 ? "current" : "done"} key={label}><b>{index + 1}</b>{label}</span>
        ))}
      </nav>

      <div className="definition-heading">
        <div>
          <p className="section-kicker">Etapa 6 · Metodologia</p>
          <h2 id="methodology-title">Matriz metodológica e resultados esperados</h2>
          <p>Confirme como cada objetivo será atendido, quais dados serão levantados, como serão tratados e que contribuição se espera produzir.</p>
        </div>
        <span className={`definition-origin ${changed ? "user" : "ai"}`}>{changed ? "Editado por você" : "Sugestão da IA"}</span>
      </div>

      <div className="methodology-title-editor">
        <label>Título final sugerido<input maxLength={120} onChange={(event) => setTitle(event.target.value)} value={title} /></label>
      </div>

      <aside className="methodology-classification" aria-label="Classificação metodológica">
        <div>
          <label><span className="methodology-field-heading">Natureza {helpButton("nature")}</span><select onChange={(event) => setClassification((current) => ({ ...current, nature: event.target.value as ClassificationDraft["nature"] }))} value={classification.nature}><option>Aplicada</option><option>Básica</option></select></label>
          <label><span className="methodology-field-heading">Abordagem {helpButton("approach")}</span><select onChange={(event) => setClassification((current) => ({ ...current, approach: event.target.value as ClassificationDraft["approach"] }))} value={classification.approach}><option>Qualitativa</option><option>Quantitativa</option><option>Mista</option></select></label>
        </div>
        <fieldset>
          <legend><span className="methodology-field-heading">Objetivos metodológicos {helpButton("objectives")}</span></legend>
          {(["Exploratória", "Descritiva", "Explicativa"] as const).map((value) => (
            <label key={value}><input checked={classification.objectives.includes(value)} onChange={() => toggleClassificationObjective(value)} type="checkbox" />{value}</label>
          ))}
        </fieldset>
        <label>Procedimentos<input onChange={(event) => setProceduresText(event.target.value)} value={proceduresText} /></label>
        <label>Instrumentos<input onChange={(event) => setInstrumentsText(event.target.value)} value={instrumentsText} /></label>
        <label>Técnicas de análise<input onChange={(event) => setAnalysisText(event.target.value)} value={analysisText} /></label>
        <label>Justificativa<textarea maxLength={800} onChange={(event) => setClassification((current) => ({ ...current, rationale: event.target.value }))} value={classification.rationale} /></label>
        <label>Avisos éticos ou de acesso<input onChange={(event) => setEthicsText(event.target.value)} value={ethicsText} /></label>
      </aside>

      <div className="methodology-matrix" role="table" aria-label="Matriz metodológica por objetivo específico">
        <div className="methodology-matrix-head" role="row">
          <span role="columnheader">Objetivo específico</span>
          <span role="columnheader">Levantamento</span>
          <span role="columnheader">Análise/tratamento</span>
          <span role="columnheader">Resultado esperado</span>
        </div>
        {rows.map((row, index) => {
          const objective = specifics.find((item) => item.id === row.objectiveId);
          return (
            <article className="methodology-row" key={row.id} role="row">
              <div className="methodology-objective" role="cell"><span>OE{index + 1}</span><p>{objective?.approvedContent}</p></div>
              <label role="cell">Levantamento<textarea maxLength={1200} onChange={(event) => updateRow(row.id, { dataCollection: event.target.value })} value={row.dataCollection} /></label>
              <label role="cell">Análise/tratamento<textarea maxLength={1200} onChange={(event) => updateRow(row.id, { analysisTreatment: event.target.value })} value={row.analysisTreatment} /></label>
              <label role="cell">Resultado esperado<textarea maxLength={1000} onChange={(event) => updateRow(row.id, { expectedResult: event.target.value })} value={row.expectedResult} /></label>
              <details className="methodology-topic-links">
                <summary>{row.associatedTopicIds.length} tópicos associados</summary>
                {topics.map((topic) => (
                  <label key={topic.id}>
                    <input checked={row.associatedTopicIds.includes(topic.id)} onChange={() => toggleTopic(row, topic.id)} type="checkbox" />
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
      </div>

      {errors.length > 0 ? <div className="definition-findings" role="alert"><strong>Revise antes de avançar</strong><ul>{errors.map((error) => <li key={error}>{methodologyMessageText(error)}</li>)}</ul></div> : null}
      {findings.length > 0 ? (
        <div className="methodology-findings" role="status">
          <strong>Avisos de coerência</strong>
          <ul>{findings.map((finding) => <li className={finding.severity} key={finding.id}>{methodologyMessageText(finding.message)}</li>)}</ul>
        </div>
      ) : null}
      {message ? <p className="definition-message" role="status">{message}</p> : null}

      <div className="definition-actions">
        <button className="definition-button secondary" disabled={busy} onClick={() => void submit("back")} type="button">Voltar</button>
        <button className="definition-button secondary" disabled={busy} onClick={() => void submit("regenerate")} type="button">Regenerar sugestão</button>
        <button className="definition-button secondary" disabled={busy || !changed || rows.length === 0} onClick={() => void submit("save")} type="button">Salvar rascunho</button>
        <button className="definition-button primary" disabled={busy || rows.length === 0} onClick={() => void submit("validate")} type="button">Validar e avançar</button>
      </div>
    </section>
  );
}
