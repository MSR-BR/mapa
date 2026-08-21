import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, getRequestClientKey } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  BUG_REPORT_BUCKET,
  BUG_REPORT_RECIPIENTS,
} from "@/modules/bug-reports/config";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const bugReportSchema = z.object({
  browser: z.string().trim().max(500).optional(),
  email: z.string().email().max(320),
  message: z.string().trim().min(10).max(4_000),
  pageUrl: z.string().trim().max(2_048).optional(),
  projectId: z.string().uuid().optional(),
  stage: z.string().trim().max(160).optional(),
  subject: z.string().trim().min(3).max(180),
  userAgent: z.string().trim().max(1_000).optional(),
  website: z.string().max(200).optional(),
});

function formValue(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : undefined;
}

function safeFileName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "anexo";
}

async function notifyTeam(input: {
  attachmentName?: string | null;
  attachmentPath?: string | null;
  browser?: string;
  email: string;
  id: string;
  message: string;
  pageUrl?: string;
  stage?: string;
  subject: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;
  const attachmentLine = input.attachmentName
    ? `Anexo: ${input.attachmentName} (armazenado com acesso privado${input.attachmentPath ? `; ID ${input.attachmentPath}` : ""})`
    : "Anexo: nenhum";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Mapa da Pesquisa <notificacao@mapadapesquisa.com.br>",
      reply_to: input.email,
      subject: `[Bug Mapa] ${input.subject}`,
      text: [
        `Novo relato de problema (${input.id})`,
        `Contato: ${input.email}`,
        `Etapa: ${input.stage || "não informada"}`,
        `Página: ${input.pageUrl || "não informada"}`,
        `Navegador: ${input.browser || "não informado"}`,
        attachmentLine,
        "",
        input.message,
      ].join("\n"),
      to: BUG_REPORT_RECIPIENTS,
    }),
  });
  return response.ok;
}

export async function POST(request: Request) {
  const rate = checkRateLimit(getRequestClientKey(request, "bug-report"), 5, 60 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Muitos relatos enviados. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Não foi possível ler o formulário." }, { status: 400 });

  const attachment = form.get("attachment");
  const attachmentFile = attachment instanceof File && attachment.size > 0 ? attachment : null;
  if (attachmentFile && (!ALLOWED_ATTACHMENT_TYPES.has(attachmentFile.type) || attachmentFile.size > MAX_ATTACHMENT_BYTES)) {
    return NextResponse.json({ error: "O anexo deve ser PNG, JPG ou WEBP com no máximo 5 MB." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  const authenticatedEmail = typeof claims?.claims?.email === "string" ? claims.claims.email : null;
  const parsed = bugReportSchema.safeParse({
    browser: formValue(form, "browser"),
    email: authenticatedEmail || formValue(form, "email"),
    message: formValue(form, "message"),
    pageUrl: formValue(form, "pageUrl"),
    projectId: formValue(form, "projectId") || undefined,
    stage: formValue(form, "stage"),
    subject: formValue(form, "subject"),
    userAgent: formValue(form, "userAgent"),
    website: formValue(form, "website") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe assunto, e-mail e uma descrição com pelo menos 10 caracteres." }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ ok: true });

  if (parsed.data.projectId && !userId) {
    return NextResponse.json({ error: "Entre na conta para associar o relato a um projeto." }, { status: 401 });
  }
  if (parsed.data.projectId && userId) {
    const { data: project } = await supabase.from("projects").select("id").eq("id", parsed.data.projectId).maybeSingle();
    if (!project) return NextResponse.json({ error: "Projeto não encontrado ou sem acesso." }, { status: 404 });
  }

  const reportId = crypto.randomUUID();
  let attachmentPath: string | null = null;
  if (attachmentFile) {
    attachmentPath = `${userId || "anonymous"}/${reportId}-${safeFileName(attachmentFile.name)}`;
    const upload = await supabase.storage.from(BUG_REPORT_BUCKET).upload(attachmentPath, await attachmentFile.arrayBuffer(), {
      cacheControl: "3600",
      contentType: attachmentFile.type,
      upsert: false,
    });
    if (upload.error) {
      console.error("bug_report_attachment_upload_failed", upload.error);
      return NextResponse.json({ error: "Não foi possível armazenar o anexo." }, { status: 502 });
    }
  }

  const { error: insertError } = await supabase.from("bug_reports").insert({
    attachment_name: attachmentFile?.name || null,
    attachment_path: attachmentPath,
    attachment_size: attachmentFile?.size || null,
    attachment_type: attachmentFile?.type || null,
    browser: parsed.data.browser || null,
    id: reportId,
    message: parsed.data.message,
    page_url: parsed.data.pageUrl || null,
    project_id: parsed.data.projectId || null,
    reporter_email: parsed.data.email,
    reporter_id: userId,
    stage: parsed.data.stage || null,
    subject: parsed.data.subject,
    user_agent: parsed.data.userAgent || null,
  });
  if (insertError) {
    console.error("bug_report_insert_failed", insertError);
    return NextResponse.json({ error: "Não foi possível registrar o relato agora." }, { status: 502 });
  }

  let emailSent = false;
  try {
    emailSent = await notifyTeam({
      attachmentName: attachmentFile?.name,
      attachmentPath,
      browser: parsed.data.browser,
      email: parsed.data.email,
      id: reportId,
      message: parsed.data.message,
      pageUrl: parsed.data.pageUrl,
      stage: parsed.data.stage,
      subject: parsed.data.subject,
    });
  } catch (error) {
    console.error("bug_report_notification_failed", error);
  }

  return NextResponse.json({ emailSent, id: reportId, ok: true });
}
