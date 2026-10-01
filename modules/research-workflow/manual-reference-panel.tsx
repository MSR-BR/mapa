"use client";

import { useEffect, useRef, useState } from "react";

import { profileMutationHeaders, useActiveProfile } from "@/modules/profile/active-profile-context";

import type { ResearchWorkflow } from "./schema";
import {
  doiLookupResultSchema,
  EMPTY_REFERENCE_DRAFT,
  fillReferenceBlanks,
  normalizeDoi,
  sameReferenceDoi,
  type DoiLookupResult,
  type ReferenceDraft as Draft,
} from "./doi-reference";

type Props = {
  onWorkflow: (workflow: ResearchWorkflow) => void;
  projectId: string;
  workflow: ResearchWorkflow;
};

function manualReferences(workflow: ResearchWorkflow) {
  return workflow.content.referenceArchive.filter((reference) => reference.source === "manual");
}

export function ManualReferencePanel({ onWorkflow, projectId, workflow }: Props) {
  const { roleVersion } = useActiveProfile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_REFERENCE_DRAFT);
  const draftRef = useRef(draft);
  const autofilled = useRef<Partial<Draft>>({});
  const lookupRequest = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookup, setLookup] = useState<DoiLookupResult | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const references = manualReferences(workflow);

  useEffect(() => {
    const element = dialog.current;
    const trigger = addButton.current;
    if (open) {
      element?.showModal();
      element?.querySelector("input")?.focus({ preventScroll: true });
    }
    return () => {
      element?.close();
      if (open) trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => () => lookupRequest.current?.abort(), []);

  function replaceDraft(next: Draft) {
    draftRef.current = next;
    setDraft(next);
  }

  function cancelLookup() {
    lookupRequest.current?.abort();
    lookupRequest.current = null;
    setLookingUp(false);
  }

  function close() {
    if (busy) return;
    cancelLookup();
    setOpen(false);
  }

  function update(field: keyof Draft, value: string) {
    const next = { ...draftRef.current, [field]: value };
    if (field === "doi") {
      cancelLookup();
      setLookupMessage(null);
      if (!sameReferenceDoi(value, draftRef.current.doi)) {
        // Remove only untouched autofill values when switching to another work.
        for (const key of Object.keys(autofilled.current) as (keyof Draft)[]) {
          if (key !== "doi" && next[key] === autofilled.current[key]) next[key] = "";
        }
        autofilled.current = {};
        setLookup(null);
      }
    } else {
      delete autofilled.current[field];
    }
    replaceDraft(next);
  }

  async function searchDoi() {
    if (busy || lookingUp) return;
    const doi = normalizeDoi(draftRef.current.doi);
    setLookupMessage(null);
    if (!doi) {
      setLookupMessage("Confira o DOI informado. Você pode continuar preenchendo manualmente.");
      return;
    }
    const duplicate = [...(workflow.content.discovery?.references ?? []), ...workflow.content.referenceArchive]
      .find((reference) => sameReferenceDoi(reference.doi, doi));
    if (duplicate) {
      setLookupMessage(`Este DOI já está no mapa: ${duplicate.title ?? doi}.`);
      return;
    }
    const controller = new AbortController();
    lookupRequest.current = controller;
    setLookingUp(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/references/doi`, {
        body: JSON.stringify({ doi }),
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) },
        method: "POST",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(14_000)]),
      });
      const payload = await response.json();
      if (lookupRequest.current !== controller) return;
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível buscar os dados. Preencha manualmente ou tente novamente.");
      const result = doiLookupResultSchema.parse(payload);
      const current = draftRef.current;
      if (normalizeDoi(current.doi) !== doi) return;
      for (const key of Object.keys(current) as (keyof Draft)[]) {
        if (!current[key].trim() && result.metadata[key]) autofilled.current[key] = result.metadata[key];
      }
      replaceDraft({ ...fillReferenceBlanks(current, result.metadata), doi });
      setLookup(result);
      setLookupMessage("Dados encontrados. Confira os campos e complete à mão o que faltar. Campos já preenchidos foram preservados.");
    } catch (error) {
      if (lookupRequest.current !== controller) return;
      setLookupMessage(error instanceof Error && error.name === "Error" ? error.message : "Não foi possível concluir a busca. Tente novamente ou preencha manualmente.");
    } finally {
      if (lookupRequest.current === controller) {
        lookupRequest.current = null;
        setLookingUp(false);
      }
    }
  }

  async function saveReference() {
    if (busy || lookingUp || draft.title.trim().length < 3) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/references`, {
        body: JSON.stringify({ reference: { ...draft, metadataLookup: lookup?.provenance }, revision: workflow.revision }),
        headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; message?: string; workflow?: ResearchWorkflow };
      if (!response.ok || !payload.workflow) throw new Error(payload.error ?? "Não foi possível salvar a referência.");
      onWorkflow(payload.workflow);
      replaceDraft(EMPTY_REFERENCE_DRAFT);
      autofilled.current = {};
      setLookup(null);
      setLookupMessage(null);
      setOpen(false);
      setMessage(payload.message ?? "Referência externa salva.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a referência.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="manual-reference-panel" aria-label="Referências externas do projeto">
      <div>
        <span>Referências externas</span>
        <p>{references.length > 0 ? `${references.length} referência(s) adicionada(s).` : "Adicione fontes que devem alimentar as próximas etapas."}</p>
      </div>
      <button ref={addButton} aria-expanded={open} aria-label="Adicionar referência externa" className="manual-reference-add" onClick={() => { setMessage(null); setOpen(true); }} type="button">+</button>
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
        <dialog
          aria-label="Adicionar referência externa"
          className="manual-reference-dialog"
          ref={dialog}
          onCancel={(event) => { event.preventDefault(); close(); }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
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
            <div className="manual-reference-lookup">
              <label>DOI (opcional)<input autoFocus disabled={busy} maxLength={300} onChange={(event) => update("doi", event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter") { event.preventDefault(); void searchDoi(); }
              }} placeholder="Cole o DOI ou o link https://doi.org/…" value={draft.doi} /></label>
              <button className="definition-button secondary" disabled={busy || lookingUp || !draft.doi.trim()} onClick={() => void searchDoi()} type="button">{lookingUp ? "Buscando…" : "Buscar dados"}</button>
              <p>Busque pelo DOI ou preencha manualmente. Todos os campos continuam editáveis; apenas o título é obrigatório.</p>
              <div aria-live="polite" aria-atomic="true">
                {lookingUp ? <p>Consultando os dados da publicação…</p> : null}
                {lookupMessage ? <p>{lookupMessage}</p> : null}
                {lookup ? <p>Fonte consultada: {lookup.provenance.provider}.{!lookup.metadata.abstract ? " Abstract não disponível nesta fonte." : ""}</p> : null}
                {lookup?.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            </div>
            <label>Título<input disabled={busy} maxLength={500} onChange={(event) => update("title", event.target.value)} required value={draft.title} /></label>
            <label>Autores<textarea disabled={busy} maxLength={1200} onChange={(event) => update("authors", event.target.value)} placeholder="Separe autores por ponto e vírgula" value={draft.authors} /></label>
            <label>Revista<input disabled={busy} maxLength={240} onChange={(event) => update("journal", event.target.value)} value={draft.journal} /></label>
            <label>Volume, ano, páginas<input disabled={busy} maxLength={240} onChange={(event) => update("volumeIssuePages", event.target.value)} placeholder="Ex.: v. 12, n. 2, 2024, p. 10-25" value={draft.volumeIssuePages} /></label>
            <label className="manual-reference-abstract">Abstract<textarea disabled={busy} maxLength={5000} onChange={(event) => update("abstract", event.target.value)} value={draft.abstract} /></label>
            {message ? <p className="manual-reference-message" role="alert">{message}</p> : null}
            <div className="manual-reference-actions">
              <button className="definition-button secondary" disabled={busy} onClick={close} type="button">Cancelar</button>
              <button className="definition-button primary" disabled={busy || lookingUp || draft.title.trim().length < 3} type="submit">{busy ? "Salvando…" : "Salvar referência"}</button>
            </div>
          </form>
        </dialog>
      ) : null}
    </aside>
  );
}
