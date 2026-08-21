"use client";

import { useMemo, useState } from "react";

import {
  BUG_REPORT_PRIORITY_LABELS,
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_STATUS_LABELS,
  BUG_REPORT_STATUSES,
  type BugReportPriority,
  type BugReportStatus,
} from "./config";

export type BugReportAdminItem = {
  admin_notes: string | null;
  attachment_name: string | null;
  attachment_url: string | null;
  browser: string | null;
  created_at: string;
  id: string;
  message: string;
  page_url: string | null;
  priority: string;
  project_id: string | null;
  reporter_email: string;
  stage: string | null;
  status: string;
  subject: string;
  user_agent: string | null;
};

function isStatus(value: string): value is BugReportStatus {
  return (BUG_REPORT_STATUSES as readonly string[]).includes(value);
}

function isPriority(value: string): value is BugReportPriority {
  return (BUG_REPORT_PRIORITIES as readonly string[]).includes(value);
}

export function BugReportAdminList({ initialReports }: { initialReports: BugReportAdminItem[] }) {
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<"all" | BugReportStatus>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const visible = useMemo(() => filter === "all" ? reports : reports.filter((report) => report.status === filter), [filter, reports]);

  return (
    <section className="bug-admin-list" aria-labelledby="bug-admin-title">
      <div className="bug-admin-toolbar">
        <div><p className="section-kicker">Triagem privada</p><h1 id="bug-admin-title">Relatos de problemas</h1><p>Somente a equipe autorizada vê este painel. Os anexos continuam privados.</p></div>
        <label><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">Todos</option>{BUG_REPORT_STATUSES.map((status) => <option key={status} value={status}>{BUG_REPORT_STATUS_LABELS[status]}</option>)}</select></label>
      </div>
      {visible.length === 0 ? <p className="bug-admin-empty">Nenhum relato nesta categoria.</p> : <div className="bug-admin-cards">{visible.map((report) => {
        const status = isStatus(report.status) ? report.status : "new";
        const priority = isPriority(report.priority) ? report.priority : "normal";
        return <article className={`bug-admin-card status-${status}`} key={report.id}>
          <header><div><p className="section-kicker">{new Date(report.created_at).toLocaleString("pt-BR")}</p><h2>{report.subject}</h2></div><span className={`bug-admin-badge priority-${priority}`}>{BUG_REPORT_PRIORITY_LABELS[priority]}</span></header>
          <dl><div><dt>Contato</dt><dd><a href={`mailto:${report.reporter_email}`}>{report.reporter_email}</a></dd></div>{report.stage ? <div><dt>Etapa</dt><dd>{report.stage}</dd></div> : null}{report.project_id ? <div><dt>Projeto</dt><dd>{report.project_id}</dd></div> : null}</dl>
          <p className="bug-admin-message">{report.message}</p>
          <details><summary>Contexto técnico</summary><p>Página: {report.page_url || "não informada"}</p><p>Navegador: {report.browser || report.user_agent || "não informado"}</p>{report.attachment_url ? <p><a href={report.attachment_url} rel="noreferrer" target="_blank">Abrir anexo{report.attachment_name ? ` — ${report.attachment_name}` : ""}</a></p> : null}</details>
          <div className="bug-admin-actions"><label><span>Status</span><select id={`status-${report.id}`} defaultValue={status}><option value="new">Novo</option><option value="in_review">Em análise</option><option value="fixed">Corrigido</option><option value="closed">Encerrado</option></select></label><label><span>Prioridade</span><select id={`priority-${report.id}`} defaultValue={priority}>{BUG_REPORT_PRIORITIES.map((option) => <option key={option} value={option}>{BUG_REPORT_PRIORITY_LABELS[option]}</option>)}</select></label><label className="bug-admin-notes"><span>Nota interna</span><textarea defaultValue={report.admin_notes || ""} id={`notes-${report.id}`} maxLength={4_000} placeholder="O que foi verificado ou corrigido?" /></label><button className="primary-button" disabled={saving === report.id} onClick={async () => { setSaving(report.id); const statusValue = (document.getElementById(`status-${report.id}`) as HTMLSelectElement).value; const priorityValue = (document.getElementById(`priority-${report.id}`) as HTMLSelectElement).value; const adminNotes = (document.getElementById(`notes-${report.id}`) as HTMLTextAreaElement).value; const response = await fetch(`/api/bug-reports/${report.id}`, { body: JSON.stringify({ adminNotes, priority: priorityValue, status: statusValue }), headers: { "Content-Type": "application/json" }, method: "PATCH" }); if (response.ok) setReports((current) => current.map((item) => item.id === report.id ? { ...item, admin_notes: adminNotes || null, priority: priorityValue, status: statusValue } : item)); setSaving(null); }} type="button">{saving === report.id ? "Salvando…" : "Salvar triagem"}</button></div>
        </article>;
      })}</div>}
    </section>
  );
}
