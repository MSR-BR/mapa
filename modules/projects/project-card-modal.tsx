"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import { deleteProject } from "./actions";

export type DashboardProject = {
  academicArea: string;
  integrationSource: string | null;
  isIntegration: boolean;
  progress: number | null;
  projectId: string;
  referenceCount: number;
  referencePreview: Array<{ label: string; title: string | null }>;
  stageLabel: string;
  statusLabel: string;
  title: string;
  updatedAt: string;
  workflowVersion: number;
};

type Props = DashboardProject & {
  onSelectionChange?: (projectId: string, selected: boolean) => void;
  selectable?: boolean;
  selected?: boolean;
};

export function ProjectCardModal({
  academicArea,
  integrationSource,
  isIntegration,
  onSelectionChange,
  progress,
  projectId,
  referenceCount,
  referencePreview,
  selectable = true,
  selected,
  stageLabel,
  statusLabel,
  title,
  updatedAt,
  workflowVersion,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const isSelected = selectable && Boolean(selected);

  function toggleMenu() {
    if (menuPosition) {
      setMenuPosition(null);
      return;
    }
    const rect = dotsRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPosition({
      left: Math.max(12, Math.min(window.innerWidth - 292, rect.right - 280)),
      top: Math.min(window.innerHeight - 190, rect.bottom + 8),
    });
  }

  useEffect(() => {
    if (!menuPosition) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !dotsRef.current?.contains(event.target as Node)) {
        setMenuPosition(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPosition(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuPosition]);

  return (
    <article className={`project-card ${selectable ? "project-card-selectable" : ""} ${isSelected ? "project-card-selected" : ""}`}>
      <div className="project-card-controls">
        {selectable ? (
          <label className="project-selector">
            <input
              aria-label={`Selecionar ${title} para integração`}
              checked={isSelected}
              onChange={(event) => onSelectionChange?.(projectId, event.target.checked)}
              type="checkbox"
            />
          </label>
        ) : null}
        <button aria-label={`Abrir opções de ${title}`} className="project-menu-trigger" onClick={toggleMenu} ref={dotsRef} type="button">
          •••
        </button>
      </div>
      <span className="project-status">{statusLabel}</span>
      {isIntegration ? <span className="project-origin-badge">Integração de projetos</span> : null}
      <strong>{title}</strong>
      <span className="project-card-area">{academicArea}</span>
      {integrationSource ? <p className="project-card-origin">Integração dos projetos: {integrationSource}</p> : null}
      <div className="project-card-references" aria-label={`${referenceCount} referências associadas`}>
        <span>{referenceCount > 0 ? `${referenceCount} referência(s)` : "Sem referências associadas"}</span>
        {referencePreview.length > 0 ? (
          <ul>
            {referencePreview.map((reference) => (
              <li key={`${reference.label}-${reference.title ?? ""}`}>
                {reference.label}{reference.title ? ` — ${reference.title}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="project-card-progress" aria-label={progress === null ? stageLabel : `${stageLabel}, ${progress}% concluído`}>
        <span>{stageLabel}</span>
        {progress !== null ? (
          <>
            <div aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
            <b>{progress}%</b>
          </>
        ) : <b>v{workflowVersion}</b>}
      </div>
      <time dateTime={updatedAt}>
        Atualizado em {new Intl.DateTimeFormat("pt-BR").format(new Date(updatedAt))}
      </time>

      {menuPosition && typeof document !== "undefined" ? createPortal(
        <div
          aria-label={`Ações de ${title}`}
          className="project-popover"
          ref={menuRef}
          role="dialog"
          style={{ left: menuPosition.left, top: menuPosition.top }}
        >
          <strong>{title}</strong>
          <span>{academicArea} · {statusLabel}{referenceCount > 0 ? ` · ${referenceCount} ref.` : ""}</span>
          <div className="project-popover-actions">
            <Link className="primary-link" href={`/dashboard/projects/${projectId}`}>Abrir</Link>
            <form
              action={deleteProject}
              onSubmit={(event) => {
                if (!window.confirm("Excluir este projeto e todo o conteúdo gerado?")) event.preventDefault();
              }}
            >
              <input name="projectId" type="hidden" value={projectId} />
              <input name="confirmDelete" type="hidden" value="yes" />
              <button className="danger-button" type="submit">Excluir</button>
            </form>
          </div>
        </div>,
        document.body,
      ) : null}
    </article>
  );
}
