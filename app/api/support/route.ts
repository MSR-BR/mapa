import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, getRequestClientKey } from "@/lib/security/rate-limit";

const supportSchema = z.object({
  email: z.string().email().max(320),
  message: z.string().trim().min(10).max(4_000),
  subject: z.string().trim().min(3).max(180),
});

export const SUPPORT_RECIPIENTS = [
  "marioreis@id.uff.br",
  "sfranca@id.uff.br",
] as const;

export async function POST(request: Request) {
  const rate = checkRateLimit(getRequestClientKey(request, "support"), 5, 60 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Muitas mensagens de suporte. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }
  const parsed = supportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe assunto, e-mail e uma descrição com pelo menos 10 caracteres." }, { status: 400 });
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "O suporte por e-mail está temporariamente indisponível." }, { status: 503 });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Mapa da Pesquisa <suporte@mapadapesquisa.com.br>",
      reply_to: parsed.data.email,
      subject: `[Suporte Mapa] ${parsed.data.subject}`,
      text: `Contato: ${parsed.data.email}\n\n${parsed.data.message}`,
      to: SUPPORT_RECIPIENTS,
    }),
  });
  if (!response.ok) return NextResponse.json({ error: "Não foi possível enviar a mensagem agora." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
