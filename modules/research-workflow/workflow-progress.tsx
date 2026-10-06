"use client";

import { useRouter } from "next/navigation";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";


import {
  workflowTargetUrl,
  type WorkflowNavigationPosition,
  type WorkflowNavigationTarget,
} from "./workflow-navigation";
import type { ResearchWorkflow } from "./schema";

export type WorkflowProgressHandle = { navigate: (target: WorkflowNavigationTarget) => void };

type WorkflowProgressProps = {
  ref?: Ref<WorkflowProgressHandle>;
  current: 1 | 2 | 3 | 4;
  currentStep: WorkflowNavigationPosition | null;
  disabled?: boolean;
  hasUnsavedChanges?: boolean;
  onWorkflow?: (workflow: ResearchWorkflow) => void;
  projectId: string;
  revision: number;
  availableSteps?: WorkflowNavigationTarget[];
  onSave?: () => Promise<boolean | undefined>;
};

type ProgressItem = {
  label: string;
  target: WorkflowNavigationTarget;
};

const MACRO_STEPS: readonly ProgressItem[] = [
  { label: "Problemática", target: "problem_statement" },
  { label: "Objetivos", target: "general_objective" },
  { label: "Capítulos", target: "literature_topics" },
  { label: "Metodologia e encerramento", target: "methodology_matrix" },
];

const DETAIL_STEPS: Record<WorkflowProgressProps["current"], readonly (ProgressItem | {
  label: string;
  target: null;
})[]> = {
  1: [{ label: "Problemática", target: "problem_statement" }],
  2: [
    { label: "Objetivo geral", target: "general_objective" },
    { label: "Objetivos específicos", target: "specific_objectives" },
  ],
  3: [
    { label: "Revisão da literatura", target: "literature_topics" },
    { label: "Desenvolvimento / estudo de caso", target: "development_topics" },
  ],
  4: [
    { label: "Matriz metodológica", target: "methodology_matrix" },
    { label: "Encerramento e mapa final", target: "final_map" },
  ],
};

export const WORKFLOW_PROGRESS_TOTAL = MACRO_STEPS.length;

export function WorkflowProgress({
  ref,
  current,
  currentStep,
  disabled = false,
  hasUnsavedChanges = false,
  onSave,
  availableSteps,
  projectId,
}: WorkflowProgressProps) {
  const router = useRouter();
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    function preventLoss(event: BeforeUnloadEvent) { event.preventDefault(); }
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [hasUnsavedChanges]);
  const [pendingTarget, setPendingTarget] = useState<WorkflowNavigationTarget | null>(null);
  const [leaving, setLeaving] = useState<WorkflowNavigationTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (leaving) dialogRef.current?.focus(); }, [leaving]);
  const detailSteps = DETAIL_STEPS[current];
  const detailIndex = detailSteps.findIndex((item) => item.target === currentStep || (!item.target && currentStep === "final_map"));
  const currentDetail = detailIndex >= 0 ? detailIndex + 1 : 1;
  const busy = disabled || pendingTarget !== null;

  function navigate(target: WorkflowNavigationTarget, discard = false) {
    if (busy) return;
    if (hasUnsavedChanges && !discard) { setLeaving(target); return; }
    setLeaving(null);
    router.push(workflowTargetUrl(projectId, target), { scroll: false });
  }

  useImperativeHandle(ref, () => ({ navigate }));

  async function saveAndNavigate() {
    if (!leaving || !onSave) return;
    const target = leaving;
    setPendingTarget(target);
    setError(null);
    try {
      const saved = await onSave();
      if (!saved) { setError("Não foi possível salvar. Suas edições continuam nesta tela."); return; }
      setLeaving(null);
      router.push(workflowTargetUrl(projectId, target), { scroll: false });
    } finally { setPendingTarget(null); }
  }

  return (
    <nav aria-label={`Progresso do mapa: etapa ${current} de ${WORKFLOW_PROGRESS_TOTAL}`} className="workflow-progress">
      <div className="workflow-progress-summary">
        <span>Etapas principais do mapa</span>
        <strong>Etapa {current}/{WORKFLOW_PROGRESS_TOTAL}</strong>
      </div>
      <ol className="workflow-progress-macro">
        {MACRO_STEPS.map((item, index) => {
          const step = index + 1;
          const state = step === current ? "current" : step < current ? "done" : "";
          const content = <><b>{step}</b><span>{item.label}</span></>;
          return (
            <li aria-current={step === current ? "step" : undefined} className={state} key={item.label}>
              {step !== current ? (
                <button
                  aria-label={`Abrir ${item.label}`}
                  disabled={busy || (availableSteps !== undefined && !availableSteps.includes(item.target!))}
                  onClick={() => void navigate(item.target)}
                  type="button"
                >{content}</button>
              ) : <span className="workflow-progress-item">{content}</span>}
            </li>
          );
        })}
      </ol>
      {detailSteps.length > 1 ? (
        <div className="workflow-progress-detail">
          <div className="workflow-progress-detail-summary">
            <span>Passos desta etapa</span>
            <strong>Passo {currentDetail}/{detailSteps.length}</strong>
          </div>
          <ol>
            {detailSteps.map((item, index) => {
              const step = index + 1;
              const isCurrent = index === detailIndex;
              const isDone = detailIndex >= 0 && index < detailIndex;
              const content = <><b>{step}</b><span>{item.label}</span></>;
              return (
                <li aria-current={isCurrent ? "step" : undefined} className={isCurrent ? "current" : isDone ? "done" : ""} key={item.label}>
                  {!isCurrent && item.target ? (
                    <button
                      aria-label={`Abrir ${item.label}`}
                      disabled={busy || (availableSteps !== undefined && !availableSteps.includes(item.target!))}
                      onClick={() => void navigate(item.target)}
                      type="button"
                    >{content}</button>
                  ) : <span className="workflow-progress-item">{content}</span>}
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
      {leaving ? <div className="workflow-leave-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-labelledby="leave-title">
        <h3 id="leave-title">Salvar alterações antes de sair?</h3>
        <p>Escolha o que fazer com as edições desta etapa.</p>
        <button type="button" disabled={busy || !onSave} onClick={() => void saveAndNavigate()}>Salvar e abrir etapa</button>
        <button type="button" disabled={busy} onClick={() => navigate(leaving, true)}>Descartar edições e abrir</button>
        <button type="button" disabled={busy} onClick={() => setLeaving(null)}>Permanecer nesta etapa</button>
      </div> : null}
      {error ? <p className="workflow-progress-error" role="alert">{error}</p> : null}
    </nav>
  );
}
