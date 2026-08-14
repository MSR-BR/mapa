"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ResearchActivityIcon } from "@/modules/generation/research-activity-icon";
import { ManualReferencePanel } from "./manual-reference-panel";
import type { ResearchWorkflow, ValidatedElement } from "./schema";

type Props = {
  initialWorkflow: ResearchWorkflow;
  projectId: string;
};

type ObjectiveDraft = { id: string; content: string; studentJustification: string };
type Operation = "back" | "regenerate" | "save" | "validate" | null;

function findElement(workflow: ResearchWorkflow, type: ValidatedElement["type"]) {
  return workflow.content.elements.find((element) => element.type === type);
}

function specificDrafts(workflow: ResearchWorkflow): ObjectiveDraft[] {
  return workflow.content.elements
    .filter((element) => element.type === "specific_objective")
    .map((element) => ({ content: element.proposedContent, id: element.id, studentJustification: element.studentJustification ?? "" }));
}

export function ResearchDefinitionWorkspace({ initialWorkflow, projectId }: Props) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [problem, setProblem] = useState(() => findElement(initialWorkflow, "problem_statement")?.proposedContent ?? "");
  const [general, setGeneral] = useState(() => findElement(initialWorkflow, "general_objective")?.proposedContent ?? "");
  const [problemJustification, setProblemJustification] = useState(() => findElement(initialWorkflow, "problem_statement")?.studentJustification ?? "");
  const [generalJustification, setGeneralJustification] = useState(() => findElement(initialWorkflow, "general_objective")?.studentJustification ?? "");
  const [specifics, setSpecifics] = useState<ObjectiveDraft[]>(() => specificDrafts(initialWorkflow));
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
      : JSON.stringify(specifics) !== JSON.stringify(specificDrafts(workflow));
  const busy = operation !== null;

  function applyWorkflow(nextWorkflow: ResearchWorkflow) {
    setWorkflow(nextWorkflow);
    setProblem(findElement(nextWorkflow, "problem_statement")?.proposedContent ?? "");
    setGeneral(findElement(nextWorkflow, "general_objective")?.proposedContent ?? "");
    setProblemJustification(findElement(nextWorkflow, "problem_statement")?.studentJustification ?? "");
    setGeneralJustification(findElement(nextWorkflow, "general_objective")?.studentJustification ?? "");
    setSpecifics(specificDrafts(nextWorkflow));
  }

  async function submit(action: Exclude<Operation, null>) {
    if (!step || busy) return;
    if (action === "regenerate" && currentValueChanged && !window.confirm("A nova sugestão substituirá sua edição atual. Deseja continuar?")) return;
    setOperation(action);
    setMessage(null);
    setErrors([]);
    try {
      const response = await fetch(`/api/projects/${projectId}/definition`, {
        body: JSON.stringify({
          action,
          content: step === "problem_statement" ? problem : step === "general_objective" ? general : undefined,
          objectives: step === "specific_objectives" ? specifics : undefined,
          revision: workflow.revision,
          studentJustification: step === "problem_statement" ? problemJustification : step === "general_objective" ? generalJustification : undefined,
          step,
        }),
        headers: { "Content-Type": "application/json" },
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
        setErrors(payload.errors ?? ["Revise o conteúdo antes de validar."]);
        return;
      }
      if (!response.ok || !payload.workflow) throw new Error(payload.error || "Não foi possível atualizar esta etapa.");
      setMessage(payload.message ?? null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar esta etapa.");
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

  if (!step) {
    return (
      <section className="definition-complete" aria-labelledby="definition-complete-title">
        <p className="section-kicker">Etapas 1–3 validadas</p>
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

  const stepNumber = step === "problem_statement" ? 1 : step === "general_objective" ? 2 : 3;
  const title = step === "problem_statement" ? "Problemática da pesquisa" : step === "general_objective" ? "Objetivo geral" : "Objetivos específicos";
  const explanation = step === "problem_statement"
    ? "A grande pergunta representa a razão central da pesquisa e orientará todas as etapas seguintes."
    : step === "general_objective"
      ? "O objetivo geral responde diretamente à problemática e expressa o principal resultado intelectual pretendido."
      : "Os objetivos específicos formam uma progressão lógica de três a seis etapas necessárias para atender o objetivo geral.";

  return (
    <section className="research-definition" aria-labelledby="definition-title">
      {busy ? (
        <div className="generation-overlay" role="status" aria-live="polite">
          <div className="generation-overlay-card">
            <ResearchActivityIcon />
            <p className="section-kicker">Etapa {stepNumber}</p>
            <h2>{operation === "regenerate" || operation === "validate" ? "Analisando coerência e evidências…" : "Salvando sua pesquisa…"}</h2>
          </div>
        </div>
      ) : null}

      <nav className="definition-progress" aria-label="Progresso da construção">
        {["Problemática", "Objetivo geral", "Objetivos específicos"].map((label, index) => (
          <span className={index + 1 === stepNumber ? "current" : index + 1 < stepNumber ? "done" : ""} key={label}>
            <b>{index + 1}</b>{label}
          </span>
        ))}
      </nav>

      <div className="definition-heading">
        <div>
          <p className="section-kicker">Etapa {stepNumber}</p>
          <h2 id="definition-title">{title}</h2>
          <p>{explanation}</p>
        </div>
        <span className={`definition-origin ${currentElement?.updatedBy === "user" || currentValueChanged ? "user" : "ai"}`}>
          {currentElement?.updatedBy === "user" || currentValueChanged ? "Editado por você" : "Sugestão da IA"}
        </span>
      </div>

      <div className="definition-source">
        <span>Origem desta etapa</span>
        {sourceValues.filter(Boolean).map((value) => <p key={value}>{value}</p>)}
      </div>

      <ManualReferencePanel onWorkflow={applyWorkflow} projectId={projectId} workflow={workflow} />

      <div className="definition-editor">
        {step === "problem_statement" ? (
          <div className="definition-editor-with-note">
            <label>
              Grande pergunta da pesquisa
              <textarea maxLength={500} onChange={(event) => setProblem(event.target.value)} value={problem} />
              <small>{problem.length}/500 · Comece com “Como” ou “De que forma” e formule uma única pergunta.</small>
            </label>
            <label className="student-justification">
              Por que esta grande pergunta vale ser investigada? *
              <textarea maxLength={1000} onChange={(event) => setProblemJustification(event.target.value)} placeholder="Escreva uma justificativa breve. Ela orientará as próximas sugestões, mas continua sendo uma reflexão sua." value={problemJustification} />
            </label>
          </div>
        ) : step === "general_objective" ? (
          <div className="definition-editor-with-note">
            <label>
              Objetivo geral
              <textarea maxLength={700} onChange={(event) => setGeneral(event.target.value)} value={general} />
              <small>{general.length}/700 · Comece com verbo no infinitivo e mantenha o escopo da problemática.</small>
            </label>
            <label className="student-justification">
              Por que este objetivo responde à problemática? *
              <textarea maxLength={1000} onChange={(event) => setGeneralJustification(event.target.value)} placeholder="Registre sua justificativa para não aceitar a IA automaticamente." value={generalJustification} />
            </label>
          </div>
        ) : (
          <div className="specific-objective-list">
            {specifics.map((objective, index) => (
              <div className="specific-objective-row" key={objective.id}>
                <label>
                  Objetivo específico {index + 1}
                  <textarea maxLength={700} onChange={(event) => updateSpecific(objective.id, event.target.value)} value={objective.content} />
                </label>
                <label className="student-justification">
                  Justificativa do OE{index + 1} *
                  <textarea maxLength={1000} onChange={(event) => updateSpecificJustification(objective.id, event.target.value)} placeholder="Por que este objetivo é necessário para atender o objetivo geral?" value={objective.studentJustification} />
                </label>
                <button
                  aria-label={`Remover objetivo específico ${index + 1}`}
                  disabled={specifics.length <= 3}
                  onClick={() => setSpecifics((current) => current.filter((item) => item.id !== objective.id))}
                  type="button"
                >Remover</button>
              </div>
            ))}
            <button
              className="add-specific-objective"
              disabled={specifics.length >= 6}
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
        <button className="definition-button secondary" disabled={busy} onClick={() => void submit("back")} type="button">Voltar</button>
        <button className="definition-button secondary" disabled={busy} onClick={() => void submit("regenerate")} type="button">Regenerar sugestão</button>
        <button className="definition-button secondary" disabled={busy || !currentValueChanged} onClick={() => void submit("save")} type="button">Salvar rascunho</button>
        <button className="definition-button primary" disabled={busy} onClick={() => void submit("validate")} type="button">Validar e avançar</button>
      </div>
    </section>
  );
}
