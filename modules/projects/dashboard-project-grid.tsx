"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProjectCardModal, type DashboardProject } from "./project-card-modal";

export function DashboardProjectGrid({ projects }: { projects: DashboardProject[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [integrating, setIntegrating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateSelection(projectId: string, selected: boolean) {
    setSelectedIds((current) => selected
      ? current.includes(projectId) ? current : [...current, projectId]
      : current.filter((id) => id !== projectId));
    setMessage(null);
  }

  async function integrate() {
    if (selectedIds.length < 2 || selectedIds.length > 4) return;
    setIntegrating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/projects/integrate", {
        body: JSON.stringify({ projectIds: selectedIds }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; projectId?: string };
      if (!response.ok || !payload.projectId) throw new Error(payload.error ?? "Não foi possível integrar.");
      router.push(`/dashboard/projects/${payload.projectId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível integrar os projetos.");
      setIntegrating(false);
    }
  }

  return (
    <>
      <div className="project-selection-toolbar">
        <span>{selectedIds.length === 0 ? "Selecione projetos para integrar" : `${selectedIds.length} projeto(s) selecionado(s)`}</span>
        <button
          className="secondary-button"
          disabled={selectedIds.length < 2 || selectedIds.length > 4 || integrating}
          onClick={() => void integrate()}
          type="button"
        >
          {integrating ? "Integrando com IA…" : "Integrar"}
        </button>
      </div>
      {message ? <p className="integration-message" role="alert">{message}</p> : null}
      <div className="project-grid" aria-label="Projetos">
        {projects.map((project) => (
          <ProjectCardModal
            {...project}
            key={project.projectId}
            onSelectionChange={updateSelection}
            selected={selectedIds.includes(project.projectId)}
          />
        ))}
      </div>
    </>
  );
}
