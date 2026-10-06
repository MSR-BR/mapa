"use client";

import { providerLabel, type CollaborativeReview } from "@/modules/ai/contract";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { profileMutationHeaders, useActiveProfile } from "@/modules/profile/active-profile-context";
import { ADVISOR_REVIEW_LABELS, pendingAdvisorReview } from "./advisor-review";
import { advisorReviewStepSchema, type AdvisorReviewStep, type ResearchWorkflow, type WorkflowUnit } from "./schema";
import { workflowUnit } from "./versioned-context";

type Version = { id: string; step: string; kind: string; revision: number; source_revision: number; actor_id: string | null; created_at: string; reason: string };
function UnitPreview({ unit }: { unit: WorkflowUnit }) {
  return <div className="workflow-version-preview">
    {unit.elements.map((item) => <p key={item.id}>{item.proposedContent}</p>)}
    {unit.methodologyClassification ? <p>{unit.methodologyClassification.approach} · {unit.methodologyClassification.nature}<br />{unit.methodologyClassification.rationale}</p> : null}
    {unit.methodologyRows.map((row) => <p key={row.id}>{row.dataCollection}<br />{row.analysisTreatment}<br />{row.expectedResult}</p>)}
    <details><summary>Notas e associações desta versão</summary>
      {unit.elements.filter((item) => item.studentJustification).map((item) => <p key={item.id}><strong>Orientações:</strong> {item.studentJustification}</p>)}
      {unit.chapterTopicDetails.map((detail) => <p key={detail.topicId}>Tópico {detail.order}: {detail.objectiveCoverage.length} objetivo(s) associado(s). {detail.studentJustification} {detail.exceptionJustification}</p>)}
      {unit.methodologyRows.filter((row) => row.studentJustification).map((row) => <p key={row.id}><strong>Orientações metodológicas:</strong> {row.studentJustification}</p>)}
      <p>{new Set(unit.elements.flatMap((item) => item.referenceIds)).size} referência(s) e {unit.traceLinks.length} relação(ões) preservadas.</p>
    </details>
  </div>;
}

function ReviewFindings({ review }: { review: CollaborativeReview | undefined }) {
  if (!review) return null;
  const name = providerLabel(review.provider);
  return <section aria-label="Revisão complementar da proposta">
    <p><strong>{review.status === "completed" ? `Revisão complementar por ${name}` : review.status === "disabled" ? "Revisão complementar desativada" : `Revisão complementar por ${name} indisponível`}</strong> · contexto {review.baseRevision}</p>
    {review.status === "completed" && !review.findings.length ? <p>Não foram identificados novos ajustes nesta revisão. Confira a proposta e as fontes antes de confirmar.</p> : null}
    {review.findings.map((finding, index) => <div key={index}><p>{finding.reason}</p><p><strong>Sugestão:</strong> {finding.suggestion}</p></div>)}
    <p>Esta análise orienta a edição e não substitui a validação do autor ou do orientador.</p>
  </section>;
}

export function WorkflowHistory({ workflow, step, onWorkflow, hasUnsavedChanges = false, readOnly = false }: {
  workflow: ResearchWorkflow; step: AdvisorReviewStep; onWorkflow: (value: ResearchWorkflow) => void;
  hasUnsavedChanges?: boolean; readOnly?: boolean;
}) {
  const router = useRouter();
  const { roleVersion } = useActiveProfile();
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ version: Version; unit: WorkflowUnit | null; legacyText?: string; current: WorkflowUnit | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const frozen = Boolean(pendingAdvisorReview(workflow.content));
  const draft = workflow.content.stepDrafts[step];
  const proposal = workflow.content.stepProposals[step];
  const stale = workflowUnit(workflow.content, step).elements.some((item) => item.status === "stale")
    || (step === "methodology_matrix" && workflow.content.methodologyRows.some((row) => row.status === "stale"));

  async function load(more = false) {
    setOpen(true); setBusy(true); setMessage(null);
    try {
      const query = new URLSearchParams(more && cursor ? { cursor } : {});
      const response = await fetch(`/api/projects/${workflow.projectId}/history?${query}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setVersions(more ? [...versions, ...data.versions] : data.versions); setCursor(data.nextCursor);
    } catch { setMessage("Não foi possível carregar o histórico. Tente novamente."); }
    finally { setBusy(false); }
  }
  async function select(version: Version) {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/projects/${workflow.projectId}/history?version=${version.id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSelected({ version, current: data.current, unit: version.kind === "legacy" ? null : data.version.unit, legacyText: version.kind === "legacy" ? data.version.unit.proposedContent : undefined });
    } catch { setMessage("Não foi possível abrir esta versão."); }
    finally { setBusy(false); }
  }
  async function mutate(action: "restore" | "accept_proposal" | "discard_proposal" | "discard_draft" | "rebase_draft") {
    if (hasUnsavedChanges) { setMessage("Salve suas edições nesta tela antes de recuperar ou descartar uma versão."); return; }
    const target = action === "restore" && selected ? advisorReviewStepSchema.safeParse(selected.version.step) : null;
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/projects/${workflow.projectId}/history`, {
        method: "POST", headers: { "Content-Type": "application/json", ...profileMutationHeaders(roleVersion) },
        body: JSON.stringify({ action, revision: workflow.revision, step: target?.success ? target.data : step, versionId: selected?.version.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
      onWorkflow(data.workflow); setSelected(null); setMessage(data.message);
      router.replace(`/dashboard/projects/${workflow.projectId}?workflowStep=${target?.success ? target.data : step}`, { scroll: false });
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }
  return <aside className="workflow-history" aria-label="Versões e contexto do projeto">
    <div className="workflow-history-heading">
      <p><strong>{draft ? "Rascunho salvo · ainda não incorporado ao contexto" : "Conteúdo registrado desta etapa"}</strong><br />Contexto do projeto: revisão {workflow.sourceRevision}</p>
      <button type="button" disabled={busy} onClick={() => open ? setOpen(false) : void load()}>{open ? "Fechar histórico" : "Histórico e recuperação"}</button>
    </div>
    {draft && draft.baseRevision !== workflow.sourceRevision ? <div role="status"><p>O contexto mudou depois deste rascunho. Consulte as etapas alteradas e confira se o texto ainda está coerente.</p><button type="button" disabled={busy || frozen || readOnly} onClick={() => void mutate("rebase_draft")}>Revisei o contexto atual; manter este rascunho</button></div> : null}
    {stale ? <p role="status">Uma etapa anterior mudou. O conteúdo foi preservado; revise sua coerência antes de confirmar. Você pode manter o texto ou solicitar uma nova sugestão.</p> : null}
    {draft?.aiReview ? <ReviewFindings review={draft.aiReview} /> : null}
    {draft && !readOnly ? <button disabled={busy || frozen} onClick={() => void mutate("discard_draft")} type="button">Descartar rascunho e voltar à versão vigente</button> : null}
    {proposal ? <details open className="workflow-proposal"><summary>Nova proposta da IA — aguardando sua decisão</summary>
      <div className="workflow-version-columns"><section><h3>Conteúdo atual</h3><UnitPreview unit={workflowUnit(workflow.content, step)} /></section><section><h3>Proposta</h3><UnitPreview unit={proposal.unit} /></section></div>
      {proposal.baseRevision !== workflow.sourceRevision ? <p role="status">O contexto mudou durante a geração. Esta proposta usa a revisão {proposal.baseRevision}; compare os textos e solicite uma atualização antes de usá-la.</p> : null}
      <ReviewFindings review={proposal.aiReview} />
      <p>Aceitar coloca a proposta no rascunho para você editar e confirmar. O conteúdo vigente só muda após a validação exigida.</p>
      <button disabled={busy || frozen || readOnly || proposal.baseRevision !== workflow.sourceRevision} type="button" onClick={() => void mutate("accept_proposal")}>Usar proposta no rascunho</button>
      <button disabled={busy || frozen || readOnly} type="button" onClick={() => void mutate("discard_proposal")}>Descartar proposta</button>
    </details> : null}
    {open ? <div>
      <p>Versões salvas do projeto. A recuperação cria um rascunho e preserva o histórico posterior.</p>
      <ol className="workflow-version-list">{versions.map((version) => <li key={version.id}>
        <button type="button" disabled={busy} onClick={() => void select(version)}>
          {ADVISOR_REVIEW_LABELS[version.step as AdvisorReviewStep] ?? "Histórico legado"} · revisão {version.revision} · {new Date(version.created_at).toLocaleString("pt-BR")}<br />
          Contexto {version.source_revision} · {version.reason} · {version.actor_id === workflow.ownerId ? "Autor do projeto" : version.actor_id ? "Orientador" : "Registro do sistema"}
        </button>
      </li>)}</ol>
      {!versions.length && !busy ? <p>Nenhuma versão anterior disponível.</p> : null}
      {cursor ? <button type="button" disabled={busy} onClick={() => void load(true)}>Carregar mais versões</button> : null}
      {selected ? <section aria-label="Comparação de versões">
        <h3>Comparar antes de recuperar</h3>
        <div className="workflow-version-columns"><section><h4>Versão vigente</h4>{selected.current ? <UnitPreview unit={selected.current} /> : <p>Comparação completa indisponível para o histórico legado.</p>}</section><section><h4>Versão selecionada</h4>{selected.unit ? <UnitPreview unit={selected.unit} /> : <p>{selected.legacyText}</p>}</section></div>
        {selected.version.kind === "legacy" ? <p>Esta versão antiga só guardava o elemento. A recuperação manterá as relações atuais; revise-as antes de confirmar.</p> : null}
        <button type="button" disabled={busy || frozen || readOnly} onClick={() => void mutate("restore")}>Recuperar como rascunho</button>
        <button type="button" onClick={() => setSelected(null)}>Fechar comparação</button>
      </section> : null}
    </div> : null}
    {message ? <p role="status">{message}</p> : null}
  </aside>;
}
