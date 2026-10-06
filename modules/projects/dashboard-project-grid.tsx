"use client";
import { useAiProgress } from "@/modules/ai/use-ai-progress";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { ProjectCardModal, type DashboardProject } from "./project-card-modal";
import { profileMutationHeaders, useActiveProfile } from "@/modules/profile/active-profile-context";
import { setAnalyticsContext, trackAnalyticsEvent } from "@/modules/analytics/analytics";

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
  const aiProgress = useAiProgress();
  const router = useRouter();
  const { activeRole, roleVersion } = useActiveProfile();
  const sectionTitleId = useId();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [integrating, setIntegrating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
    setAnalyticsContext({ app_auth_state: "authenticated", app_role: activeRole, app_surface: "dashboard" });
    trackAnalyticsEvent("project_integration_started", { app_role: activeRole, app_surface: "dashboard", app_result: "started" });
    setIntegrating(true);
    setMessage(null);
    try {
      const response = await aiProgress.request("/api/projects/integrate", {
        body: JSON.stringify({ projectIds: selectedIds }),
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; projectId?: string; sourceTitles?: string[] };
      if (!response.ok || !payload.projectId) throw new Error(payload.error ?? "Não foi possível integrar.");
      trackAnalyticsEvent("project_integration_completed", { app_role: activeRole, app_surface: "dashboard", app_result: "success", app_reference_count_bucket: "unknown" });
      router.push(`/dashboard/projects/${payload.projectId}?integrated=1`);
    } catch (error) {
      trackAnalyticsEvent("project_integration_failed", { app_role: activeRole, app_surface: "dashboard", app_result: "failed", app_reason_code: "unknown" });
      setMessage(error instanceof Error ? error.message : "Não foi possível integrar os projetos.");
      setIntegrating(false);
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
          <strong>{aiProgress.label}</strong>
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
