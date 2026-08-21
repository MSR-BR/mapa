import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORT_ADDRESS = "suporte@mapadapesquisa.com.br";
const SUPPORT_RECIPIENTS = ["marioreis@id.uff.br", "sfranca@id.uff.br"] as const;
const MAX_FORWARD_ATTACHMENT_BYTES = 30 * 1024 * 1024;

type ReceivedEvent = {
  type: "email.received";
  data: {
    email_id: string;
    message_id?: string | null;
    to?: string[] | null;
  };
};

function isReceivedEvent(value: unknown): value is ReceivedEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as { type?: unknown; data?: { email_id?: unknown } };
  return event.type === "email.received" && typeof event.data?.email_id === "string";
}

function extractEmail(value: string | null | undefined) {
  const match = value?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0]?.toLowerCase() ?? null;
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function isSupportRecipient(values: string[] | null | undefined) {
  return values?.some((value) => extractEmail(value) === SUPPORT_ADDRESS) ?? false;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!apiKey || !webhookSecret) {
    return NextResponse.json({ error: "Recebimento de suporte não configurado." }, { status: 503 });
  }

  const rawBody = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 401 });
  }

  let event: unknown;
  try {
    const resend = new Resend(apiKey);
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  if (!isReceivedEvent(event)) return NextResponse.json({ ok: true });
  if (!isSupportRecipient(event.data.to)) return NextResponse.json({ ok: true, ignored: true });

  const resend = new Resend(apiKey);
  const received = await resend.emails.receiving.get(event.data.email_id);
  if (received.error || !received.data) {
    console.error("support_inbound_receive_failed", {
      emailId: event.data.email_id,
      status: received.error?.statusCode ?? "unknown",
    });
    return NextResponse.json({ error: "Não foi possível recuperar a mensagem recebida." }, { status: 502 });
  }

  const email = received.data;
  const sender = extractEmail(email.from) ?? extractEmail(email.headers?.from);
  const subject = email.subject?.trim() || "(sem assunto)";
  const text = email.text?.trim() || stripHtml(email.html ?? "") || "(mensagem sem texto)";
  const originalMessageId = event.data.message_id || email.message_id || undefined;
  const skippedAttachments: string[] = [];
  let attachmentBytes = 0;
  const attachments: Array<{
    content: Buffer;
    contentId?: string;
    contentType?: string;
    filename?: string;
  }> = [];

  const attachmentList = await resend.emails.receiving.attachments.list({ emailId: email.id });
  if (attachmentList.data?.data) {
    for (const attachment of attachmentList.data.data) {
      if (!attachment.download_url) {
        skippedAttachments.push(attachment.filename || "anexo");
        continue;
      }
      try {
        const response = await fetch(attachment.download_url);
        if (!response.ok) throw new Error(`download-${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        if (attachmentBytes + buffer.byteLength > MAX_FORWARD_ATTACHMENT_BYTES) {
          skippedAttachments.push(attachment.filename || "anexo");
          continue;
        }
        attachmentBytes += buffer.byteLength;
        attachments.push({
          content: buffer,
          contentId: attachment.content_id?.replace(/^<|>$/g, "") || undefined,
          contentType: attachment.content_type || undefined,
          filename: attachment.filename || undefined,
        });
      } catch {
        skippedAttachments.push(attachment.filename || "anexo");
      }
    }
  }

  const note = skippedAttachments.length > 0
    ? `\n\nObservação: não foi possível incluir estes anexos no encaminhamento: ${skippedAttachments.join(", ")}.`
    : "";
  const htmlBody = email.html?.trim() || `<pre style="white-space:pre-wrap">${escapeHtml(text)}</pre>`;
  const resendResponse = await resend.emails.send(
    {
      from: "Mapa da Pesquisa <suporte@mapadapesquisa.com.br>",
      to: [...SUPPORT_RECIPIENTS],
      replyTo: sender ?? undefined,
      subject: `[Suporte direto] ${subject}`.slice(0, 180),
      text: `${text}${note}`,
      html: htmlBody,
      headers: originalMessageId
        ? { "In-Reply-To": originalMessageId, References: originalMessageId }
        : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    },
    { idempotencyKey: `support-inbound-${email.id}` },
  );

  if (resendResponse.error) {
    console.error("support_inbound_forward_failed", {
      emailId: email.id,
      status: resendResponse.error.statusCode ?? "unknown",
    });
    return NextResponse.json({ error: "Não foi possível encaminhar a mensagem." }, { status: 502 });
  }

  console.info("support_inbound_forwarded", {
    emailId: email.id,
    attachmentCount: attachments.length,
  });
  return NextResponse.json({ ok: true, emailId: email.id });
}
