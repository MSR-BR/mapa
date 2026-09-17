"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { profileMutationHeaders, useActiveProfile } from "@/modules/profile/active-profile-context";

import {
  workflowNavigationUrl,
  type WorkflowNavigationPosition,
  type WorkflowNavigationTarget,
} from "./workflow-navigation";
import type { ResearchWorkflow } from "./schema";

type WorkflowProgressProps = {
  current: 1 | 2 | 3 | 4;
  currentStep: WorkflowNavigationPosition | null;
  disabled?: boolean;
  hasUnsavedChanges?: boolean;
  onWorkflow?: (workflow: ResearchWorkflow) => void;
  projectId: string;
  revision: number;
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
    { label: "Encerramento e mapa final", target: null },
  ],
};

export const WORKFLOW_PROGRESS_TOTAL = MACRO_STEPS.length;

export function WorkflowProgress({
  current,
  currentStep,
  disabled = false,
  hasUnsavedChanges = false,
  onWorkflow,
  projectId,
  revision,
}: WorkflowProgressProps) {
  const router = useRouter();
  const { roleVersion } = useActiveProfile();
  const [pendingTarget, setPendingTarget] = useState<WorkflowNavigationTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const detailSteps = DETAIL_STEPS[current];
  const detailIndex = detailSteps.findIndex((item) => item.target === currentStep || (!item.target && currentStep === "final_map"));
  const currentDetail = detailIndex >= 0 ? detailIndex + 1 : 1;
  const busy = disabled || pendingTarget !== null;

  async function navigate(target: WorkflowNavigationTarget) {
    if (busy) return;
    if (hasUnsavedChanges && !window.confirm("Você tem alterações ainda não salvas nesta tela. Deseja sair sem salvá-las?")) return;
    setPendingTarget(target);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/navigation`, {
        body: JSON.stringify({ revision, target }),
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; workflow?: ResearchWorkflow };
      if (!response.ok || !payload.workflow) throw new Error(payload.error || "Não foi possível abrir a etapa anterior.");
      onWorkflow?.(payload.workflow);
      router.replace(workflowNavigationUrl(projectId, payload.workflow), { scroll: false });
      setPendingTarget(null);
    } catch (navigationError) {
      setError(navigationError instanceof Error ? navigationError.message : "Não foi possível abrir a etapa anterior.");
      setPendingTarget(null);
    }
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
              {step < current ? (
                <button
                  aria-label={`Voltar para ${item.label}`}
                  disabled={busy}
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
                  {isDone && item.target ? (
                    <button
                      aria-label={`Voltar para ${item.label}`}
                      disabled={busy}
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
      {error ? <p className="workflow-progress-error" role="alert">{error}</p> : null}
    </nav>
  );
}
