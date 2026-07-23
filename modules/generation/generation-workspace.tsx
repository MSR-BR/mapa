"use client";

import { useEffect, useRef, useState } from "react";

import type { ResearchStructure } from "./schema";
import type { GenerationSnapshot } from "./types";

type Props = {
  autoGenerate?: boolean;
  initialSnapshot: GenerationSnapshot;
  projectId: string;
};

const STATUS_LABELS = {
  completed: "Estrutura pronta",
  failed: "A geração encontrou um problema",
  generating: "Organizando capítulos com Gemini…",
  queued: "Preparando geração…",
  researching: "Buscando referências no Research Starter…",
} as const;

export function GenerationWorkspace({ autoGenerate = false, initialSnapshot, projectId }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState<ResearchStructure | null>(initialSnapshot.structure);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const saving = useRef(false);
  const autoTriggered = useRef(false);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || saving.current) return;
      event.preventDefault();
    };
    const confirmNavigation = (event: MouseEvent) => {
      if (!dirty || saving.current || event.defaultPrevented) return;
      const link = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (link?.origin === window.location.origin && !window.confirm("Descartar alterações não salvas na estrutura?")) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", confirmNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", confirmNavigation, true);
    };
  }, [dirty]);

  async function refresh() {
    const response = await fetch(`/api/projects/${projectId}/generation`, { cache: "no-store" });
    if (!response.ok) return;
    const next = await response.json() as GenerationSnapshot;
    setSnapshot(next);
  }

  async function generate() {
    if (dirty && !window.confirm("Regenerar substituirá a versão salva. Deseja continuar?")) return;
    setBusy(true);
    setMessage(null);
    const idempotencyKey = crypto.randomUUID();
    const poll = window.setInterval(() => { void refresh(); }, 1_500);
    try {
      const response = await fetch(`/api/projects/${projectId}/generate`, {
        body: JSON.stringify({ idempotencyKey }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível gerar a estrutura.");
      const next = payload as GenerationSnapshot;
      setSnapshot(next);
      setDraft(next.structure);
      setDirty(false);
      setMessage("Estrutura gerada e validada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível gerar a estrutura.");
      await refresh();
    } finally {
      window.clearInterval(poll);
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoGenerate || autoTriggered.current || initialSnapshot.structure) return;
    autoTriggered.current = true;
    void generate();
    // A geração automática deve ocorrer uma única vez ao entrar pela execução central.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate]);

  async function save() {
    if (!draft) return;
    saving.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/generation`, {
        body: JSON.stringify(draft),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível salvar.");
      setDirty(false);
      setSnapshot((current) => ({ ...current, revision: payload.revision, structure: draft }));
      setMessage(`Versão ${payload.revision} salva.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  function updateSection(chapterIndex: number, sectionIndex: number, field: "title" | "content", value: string) {
    if (!draft) return;
    const chapters = draft.chapters.map((chapter, currentChapter) => currentChapter !== chapterIndex ? chapter : {
      ...chapter,
      sections: chapter.sections.map((section, currentSection) => currentSection !== sectionIndex ? section : { ...section, [field]: value }),
    });
    setDraft({ ...draft, chapters });
    setDirty(true);
  }

  const status = snapshot.job?.status;
  const activeStatus = status && status !== "completed" && status !== "failed" ? status : "queued";

  return (
    <section className="generation-workspace" aria-labelledby="generation-title">
      {busy ? (
        <div className="generation-overlay" role="status" aria-live="polite">
          <div className="generation-overlay-card">
            <span className="generation-orbit" aria-hidden="true">✦</span>
            <p className="section-kicker">Mapa em construção</p>
            <h2>{STATUS_LABELS[activeStatus]}</h2>
            <ol className="generation-progress">
              <li className={activeStatus === "queued" ? "current" : "done"}>Interpretando tema, recorte e nível acadêmico do prompt</li>
              <li className={activeStatus === "researching" ? "current" : activeStatus === "generating" ? "done" : ""}>
                Buscando literatura no <a href="https://research-starter-six.vercel.app" rel="noreferrer" target="_blank">Research Starter ↗</a>
              </li>
              <li className={activeStatus === "generating" ? "current" : ""}>Organizando capítulos e evidências com Gemini</li>
            </ol>
            <p className="generation-overlay-note">Você pode manter esta tela aberta; o resultado aparecerá automaticamente.</p>
          </div>
        </div>
      ) : null}
      <div className="generation-heading">
        <div>
          <p className="section-kicker">Change 004 · geração e editor</p>
          <h2 id="generation-title">Estrutura da pesquisa</h2>
          <p>Referências do Research Starter, organização pelo Gemini e edição persistente.</p>
        </div>
        <div className="generation-actions">
          {draft ? <button className="secondary-button" disabled={busy} onClick={() => void generate()} type="button">Regenerar</button> : null}
          {draft ? <button className="primary-action" disabled={busy || !dirty} onClick={() => void save()} type="button">{busy ? "Processando…" : "Salvar estrutura"}</button> : null}
        </div>
      </div>

      {status && (busy || status === "failed") ? (
        <div className={`generation-status ${status === "failed" ? "generation-error" : ""}`} role="status">
          <span className="status-pulse" />
          <strong>{STATUS_LABELS[status]}</strong>
          {status === "failed" ? <button className="text-button" disabled={busy} onClick={() => void generate()} type="button">Tentar novamente</button> : null}
        </div>
      ) : null}
      {message ? <p className="generation-message" role="status">{message}</p> : null}

      {!draft ? (
        <div className="generation-empty">
          <span aria-hidden="true">✦</span>
          <h3>Transforme o briefing em uma estrutura acadêmica</h3>
          <p>A geração acontece somente quando você pedir e usa no máximo 20 referências por execução.</p>
          <button className="primary-action" disabled={busy} onClick={() => void generate()} type="button">{busy ? "Gerando…" : "Gerar estrutura"}</button>
        </div>
      ) : (
        <div className="research-editor">
          <div className="editor-meta">
            <span>Schema {draft.schemaVersion}</span>
            <span>Versão {snapshot.revision ?? 1}</span>
            {dirty ? <span className="dirty-chip">Alterações não salvas</span> : <span>Salvo</span>}
          </div>
          <div className="export-panel" aria-label="Exportar última versão salva">
            <div>
              <strong>Exportar versão {snapshot.revision ?? 1}</strong>
              <span>{dirty ? "Salve as alterações antes de exportar." : "DOCX editável ou PDF pronto para leitura."}</span>
            </div>
            <div className="export-actions">
              {dirty ? (
                <>
                  <button disabled type="button">Exportar DOCX</button>
                  <button disabled type="button">Exportar PDF</button>
                </>
              ) : (
                <>
                  <a href={`/api/projects/${projectId}/exports/docx`}>Exportar DOCX</a>
                  <a href={`/api/projects/${projectId}/exports/pdf`}>Exportar PDF</a>
                </>
              )}
            </div>
          </div>
          {draft.chapters.map((chapter, chapterIndex) => (
            <article className="chapter-card" key={chapter.id}>
              <div className="chapter-number">{String(chapter.number).padStart(2, "0")}</div>
              <div className="chapter-content">
                <h3>{chapter.title}</h3>
                {chapter.sections.map((section, sectionIndex) => (
                  <div className="section-editor" key={section.id}>
                    <label>
                      Título da seção
                      <input maxLength={160} onChange={(event) => updateSection(chapterIndex, sectionIndex, "title", event.target.value)} value={section.title} />
                    </label>
                    <label>
                      Conteúdo
                      <textarea maxLength={12_000} onChange={(event) => updateSection(chapterIndex, sectionIndex, "content", event.target.value)} rows={7} value={section.content} />
                    </label>
                    {section.referenceIds.length > 0 ? <p className="reference-ids">Evidências: {section.referenceIds.join(", ")}</p> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
          {snapshot.references.length > 0 ? (
            <aside className="references-panel">
              <h3>Referências verificadas</h3>
              <ol>
                {snapshot.references.map((reference) => (
                  <li key={reference.referenceId}>
                    <strong>{reference.title ?? "Título indisponível"}</strong>
                    <span>{[reference.authors.slice(0, 3).join(", "), reference.year].filter(Boolean).join(" · ")}</span>
                    {reference.url ? <a href={reference.url} rel="noreferrer" target="_blank">Abrir fonte ↗</a> : null}
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}
        </div>
      )}
    </section>
  );
}
