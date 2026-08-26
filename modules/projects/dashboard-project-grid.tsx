"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { ProjectCardModal, type DashboardProject } from "./project-card-modal";
import { setAnalyticsContext, trackAnalyticsEvent } from "@/modules/analytics/analytics";

const INTEGRATION_STEPS = [
  "Preparando os projetos selecionados",
  "Lendo mapas salvos e referências",
  "Combinando conteúdos com IA",
  "Salvando o projeto integrado",
] as const;

type IntegrationProgress = {
  percent: number;
  step: string;
};

type DashboardProjectGridProps = {
  allowIntegration?: boolean;
  description?: string;
  emptyMessage?: string;
  projects: DashboardProject[];
  title: string;
  variant: "active" | "advisor" | "completed" | "integrated";
};

export function DashboardProjectGrid({
  allowIntegration = false,
  description,
  emptyMessage = "Nenhum projeto nesta seção.",
  projects,
  title,
  variant,
}: DashboardProjectGridProps) {
  const router = useRouter();
  const sectionTitleId = useId();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [integrating, setIntegrating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<IntegrationProgress>({ percent: 0, step: INTEGRATION_STEPS[0] });
  const canSelectForIntegration = allowIntegration && projects.length > 0;
  const selectedProjects = selectedIds
    .map((id) => projects.find((project) => project.projectId === id))
    .filter((project): project is DashboardProject => Boolean(project));
  const selectionLabel = selectedIds.length === 0
    ? "Selecione projetos concluídos para integrar"
    : `${selectedIds.length} projeto(s) selecionado(s): ${selectedProjects.map((project) => project.title).join(", ")}`;

  function updateSelection(projectId: string, selected: boolean) {
    if (!canSelectForIntegration) return;
    setSelectedIds((current) => selected
      ? current.includes(projectId) ? current : [...current, projectId]
      : current.filter((id) => id !== projectId));
    setMessage(null);
  }

  async function integrate() {
    if (selectedIds.length < 2 || selectedIds.length > 4) return;
    setAnalyticsContext({ auth_state: "authenticated", source: "dashboard" });
    trackAnalyticsEvent("project_integration_started", { source: "dashboard", result: "started" });
    setIntegrating(true);
    setMessage(null);
    setProgress({ percent: 12, step: INTEGRATION_STEPS[0] });
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      setProgress((current) => {
        const stepIndex = Math.min(INTEGRATION_STEPS.length - 1, Math.floor(tick / 4));
        return {
          percent: Math.min(88, Math.max(current.percent + 6, 16 + tick * 5)),
          step: INTEGRATION_STEPS[stepIndex],
        };
      });
    }, 900);
    try {
      const response = await fetch("/api/projects/integrate", {
        body: JSON.stringify({ projectIds: selectedIds }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; projectId?: string; sourceTitles?: string[] };
      if (!response.ok || !payload.projectId) throw new Error(payload.error ?? "Não foi possível integrar.");
      const sourceTitles = payload.sourceTitles?.length ? payload.sourceTitles : selectedProjects.map((project) => project.title);
      setProgress({
        percent: 100,
        step: `Integração concluída: ${sourceTitles.join(", ")}`,
      });
      trackAnalyticsEvent("project_integration_completed", { source: "dashboard", result: "success", reference_count_bucket: "unknown" });
      window.setTimeout(() => {
        router.push(`/dashboard/projects/${payload.projectId}?integrated=1`);
      }, 700);
    } catch (error) {
      trackAnalyticsEvent("project_integration_failed", { source: "dashboard", result: "failed", reason_code: "unknown" });
      setMessage(error instanceof Error ? error.message : "Não foi possível integrar os projetos.");
      setIntegrating(false);
      setProgress({ percent: 0, step: INTEGRATION_STEPS[0] });
    } finally {
      window.clearInterval(timer);
    }
  }

  return (
    <section className={`project-library-section project-library-section-${variant}`} aria-labelledby={sectionTitleId}>
      <div className="project-library-section-heading">
        <div>
          <h3 id={sectionTitleId}>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        <span>{projects.length} projeto(s)</span>
      </div>
      {canSelectForIntegration ? (
        <div className="project-selection-toolbar">
          <span>{selectionLabel}</span>
          <button
            className="secondary-button"
            disabled={selectedIds.length < 2 || selectedIds.length > 4 || integrating}
            onClick={() => void integrate()}
            type="button"
          >
            {integrating ? "Integrando com IA…" : "Integrar"}
          </button>
        </div>
      ) : null}
      {integrating ? (
        <div className="integration-progress-panel" role="status" aria-live="polite">
          <div>
            <strong>{progress.step}</strong>
            <span>{progress.percent}%</span>
          </div>
          <div className="integration-progress-bar" aria-hidden="true">
            <span style={{ width: `${progress.percent}%` }} />
          </div>
          <ol>
            {INTEGRATION_STEPS.map((step, index) => (
              <li
                className={progress.percent >= 100 || INTEGRATION_STEPS.indexOf(progress.step as typeof INTEGRATION_STEPS[number]) > index ? "done" : progress.step === step ? "current" : ""}
                key={step}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {message ? <p className="integration-message" role="alert">{message}</p> : null}
      {projects.length === 0 ? (
        <div className="inline-state empty-projects compact-empty-projects">
          <span>{emptyMessage}</span>
        </div>
      ) : (
        <div className="project-grid" aria-label={title}>
          {projects.map((project) => (
            <ProjectCardModal
              {...project}
              key={project.projectId}
              onSelectionChange={updateSelection}
              selectable={canSelectForIntegration}
              selected={selectedIds.includes(project.projectId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
