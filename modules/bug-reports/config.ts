export const BUG_REPORT_BUCKET = "bug-report-attachments";
export const BUG_REPORT_RECIPIENTS = [
  "marioreis@id.uff.br",
  "sfranca@id.uff.br",
] as const;

/**
 * Small, explicit allow-list for the private triage area.  The database RLS
 * policy mirrors these addresses so the UI and the data boundary agree.
 */
export const BUG_REPORT_ADMIN_EMAILS = [
  "marioreis@id.uff.br",
  "sfranca@id.uff.br",
] as const;

export function isBugReportAdminEmail(email: string | null | undefined) {
  return BUG_REPORT_ADMIN_EMAILS.includes((email ?? "").trim().toLocaleLowerCase("pt-BR") as (typeof BUG_REPORT_ADMIN_EMAILS)[number]);
}

export const BUG_REPORT_STATUSES = ["new", "in_review", "fixed", "closed"] as const;
export const BUG_REPORT_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type BugReportStatus = (typeof BUG_REPORT_STATUSES)[number];
export type BugReportPriority = (typeof BUG_REPORT_PRIORITIES)[number];

export const BUG_REPORT_STATUS_LABELS: Record<BugReportStatus, string> = {
  new: "Novo",
  in_review: "Em análise",
  fixed: "Corrigido",
  closed: "Encerrado",
};

export const BUG_REPORT_PRIORITY_LABELS: Record<BugReportPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};
