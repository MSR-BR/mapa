"use client";

import Link from "next/link";
import { useRef } from "react";

import { deleteProject } from "./actions";

type Props = {
  academicArea: string;
  projectId: string;
  statusLabel: string;
  title: string;
  updatedAt: string;
};

export function ProjectCardModal({
  academicArea,
  projectId,
  statusLabel,
  title,
  updatedAt,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="project-card project-card-button"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <span className="project-card-topline">
          <span className="project-status">{statusLabel}</span>
          <span className="card-arrow" aria-hidden="true">•••</span>
        </span>
        <strong>{title}</strong>
        <span className="project-card-area">{academicArea}</span>
        <time dateTime={updatedAt}>
          Atualizado em {new Intl.DateTimeFormat("pt-BR").format(new Date(updatedAt))}
        </time>
      </button>

      <dialog
        className="project-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        ref={dialogRef}
      >
        <button
          aria-label="Fechar"
          className="project-dialog-close"
          onClick={() => dialogRef.current?.close()}
          type="button"
        >
          ×
        </button>
        <p className="section-kicker">Projeto salvo</p>
        <h2>{title}</h2>
        <p>{academicArea} · {statusLabel}</p>
        <div className="project-dialog-actions">
          <Link className="primary-link" href={`/dashboard/projects/${projectId}`}>Continuar</Link>
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
      </dialog>
    </>
  );
}
