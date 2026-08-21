import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_STATUSES,
  isBugReportAdminEmail,
} from "@/modules/bug-reports/config";

const updateSchema = z.object({
  adminNotes: z.string().trim().max(4_000).nullable().optional(),
  priority: z.enum(BUG_REPORT_PRIORITIES).optional(),
  status: z.enum(BUG_REPORT_STATUSES).optional(),
});

async function requireBugReportAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (error || !isBugReportAdminEmail(email)) return null;
  return { supabase };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBugReportAdmin();
  if (!auth) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Relato inválido." }, { status: 400 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Atualização inválida." }, { status: 400 });

  const status = parsed.data.status;
  const { data, error } = await auth.supabase.from("bug_reports").update({
    admin_notes: parsed.data.adminNotes,
    priority: parsed.data.priority,
    resolved_at: status === "fixed" || status === "closed" ? new Date().toISOString() : null,
    status,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select("id, status, priority, admin_notes, resolved_at, updated_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Não foi possível salvar a atualização." }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Relato não encontrado." }, { status: 404 });
  return NextResponse.json({ bugReport: data, ok: true });
}
