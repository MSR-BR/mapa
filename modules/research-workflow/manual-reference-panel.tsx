"use client";

import { useState } from "react";

import type { ResearchWorkflow } from "./schema";

type Props = {
  onWorkflow: (workflow: ResearchWorkflow) => void;
  projectId: string;
  workflow: ResearchWorkflow;
};

type Draft = {
  abstract: string;
  authors: string;
  doi: string;
  journal: string;
  title: string;
  volumeIssuePages: string;
};

const EMPTY_DRAFT: Draft = {
  abstract: "",
  authors: "",
  doi: "",
  journal: "",
  title: "",
  volumeIssuePages: "",
};

function manualReferences(workflow: ResearchWorkflow) {
  return workflow.content.referenceArchive.filter((reference) => reference.source === "manual");
}

export function ManualReferencePanel({ onWorkflow, projectId, workflow }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const references = manualReferences(workflow);

  function update(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveReference() {
    if (busy || draft.title.trim().length < 3) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/references`, {
        body: JSON.stringify({ reference: draft, revision: workflow.revision }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; message?: string; workflow?: ResearchWorkflow };
      if (!response.ok || !payload.workflow) throw new Error(payload.error ?? "Não foi possível salvar a referência.");
      onWorkflow(payload.workflow);
      setDraft(EMPTY_DRAFT);
      setOpen(false);
      setMessage(payload.message ?? "Referência externa salva.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a referência.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="manual-reference-panel" aria-label="Referências externas do aluno">
      <div>
        <span>Referências externas</span>
        <p>{references.length > 0 ? `${references.length} referência(s) adicionada(s).` : "Adicione fontes que devem alimentar as próximas etapas."}</p>
      </div>
      <button aria-expanded={open} className="manual-reference-add" onClick={() => setOpen(true)} type="button">+</button>
      {message ? <p className="manual-reference-message" role="status">{message}</p> : null}
      {references.length > 0 ? (
        <details className="manual-reference-list">
          <summary>Ver referências externas</summary>
          <ul>
            {references.map((reference) => (
              <li key={reference.referenceId}>{reference.title}{reference.year ? ` (${reference.year})` : ""}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {open ? (
        <div
          className="manual-reference-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          role="presentation"
        >
          <form
            aria-label="Adicionar referência externa"
            className="manual-reference-modal"
            onSubmit={(event) => {
              event.preventDefault();
              void saveReference();
            }}
          >
            <div>
              <p className="section-kicker">Nova referência externa</p>
              <h3>Adicionar fonte ao mapa</h3>
              <p>Título e abstract serão usados pela IA nas próximas etapas.</p>
            </div>
            <label>Título<input maxLength={500} onChange={(event) => update("title", event.target.value)} required value={draft.title} /></label>
            <label>Autores<textarea maxLength={1200} onChange={(event) => update("authors", event.target.value)} placeholder="Separe autores por ponto e vírgula" value={draft.authors} /></label>
            <label>Revista<input maxLength={240} onChange={(event) => update("journal", event.target.value)} value={draft.journal} /></label>
            <label>Volume, ano, páginas<input maxLength={240} onChange={(event) => update("volumeIssuePages", event.target.value)} placeholder="Ex.: v. 12, n. 2, 2024, p. 10-25" value={draft.volumeIssuePages} /></label>
            <label>Abstract<textarea maxLength={5000} onChange={(event) => update("abstract", event.target.value)} value={draft.abstract} /></label>
            <label>DOI<input maxLength={240} onChange={(event) => update("doi", event.target.value)} placeholder="10.xxxx/xxxxx" value={draft.doi} /></label>
            {message ? <p className="manual-reference-message" role="alert">{message}</p> : null}
            <div className="manual-reference-actions">
              <button className="definition-button secondary" disabled={busy} onClick={() => setOpen(false)} type="button">Cancelar</button>
              <button className="definition-button primary" disabled={busy || draft.title.trim().length < 3} type="submit">{busy ? "Salvando…" : "Salvar referência"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </aside>
  );
}
