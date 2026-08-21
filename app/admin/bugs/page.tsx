import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { BUG_REPORT_BUCKET, isBugReportAdminEmail } from "@/modules/bug-reports/config";
import { BugReportAdminList, type BugReportAdminItem } from "@/modules/bug-reports/admin-list";

export const metadata: Metadata = {
  title: "Relatos de problemas",
  robots: { index: false, follow: false },
};

export default async function BugReportsAdminPage() {
  const { claims, supabase } = await requireAuthenticatedUser();
  const email = typeof claims.email === "string" ? claims.email : null;
  if (!isBugReportAdminEmail(email)) notFound();

  const { data, error } = await supabase
    .from("bug_reports")
    .select("id, reporter_email, subject, message, stage, page_url, browser, user_agent, project_id, attachment_path, attachment_name, status, priority, admin_notes, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Não foi possível carregar os relatos.");

  const reports: BugReportAdminItem[] = await Promise.all((data ?? []).map(async (report) => {
    let attachmentUrl: string | null = null;
    if (report.attachment_path) {
      const signed = await supabase.storage.from(BUG_REPORT_BUCKET).createSignedUrl(report.attachment_path, 60 * 60);
      attachmentUrl = signed.data?.signedUrl ?? null;
    }
    return {
      admin_notes: report.admin_notes,
      attachment_name: report.attachment_name,
      attachment_url: attachmentUrl,
      browser: report.browser,
      created_at: report.created_at,
      id: report.id,
      message: report.message,
      page_url: report.page_url,
      priority: report.priority,
      project_id: report.project_id,
      reporter_email: report.reporter_email,
      stage: report.stage,
      status: report.status,
      subject: report.subject,
      user_agent: report.user_agent,
    };
  }));

  return <main className="workspace-shell"><BugReportAdminList initialReports={reports} /></main>;
}
