import assert from "node:assert/strict";
import test from "node:test";

import { sendProjectNotification } from "../lib/email/project-notifications";

test("notificação de envio ao orientador contém ação, link e reply-to do estudante", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.NEXT_PUBLIC_APP_URL = "https://mapadapesquisa.com.br";

  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(JSON.stringify({ id: "email-test-1" }), { status: 200 });
  };

  try {
    const result = await sendProjectNotification({
      actorEmail: "Aluno@exemplo.com",
      idempotencyKey: "student-submitted-review-1",
      kind: "student_submitted",
      projectId: "00000000-0000-0000-0000-000000000001",
      projectTitle: "Projeto de teste",
      recipientEmail: "orientador@exemplo.com",
      stepLabel: "Etapa 2 — Objetivo geral",
    });

    assert.equal(result.status, "sent");
    assert.ok(request);
    const payload = await request!.json() as Record<string, unknown>;
    assert.deepEqual(payload.to, ["orientador@exemplo.com"]);
    assert.equal(payload.reply_to, "aluno@exemplo.com");
    assert.match(String(payload.subject), /Etapa 2/);
    assert.match(String(payload.text), /validá-la ou solicitar ajustes/);
    assert.equal(request!.headers.get("Idempotency-Key"), "student-submitted-review-1");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  }
});

test("sem destinatário ou chave, notificação é ignorada sem chamar o Resend", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = "";
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response(null, { status: 500 });
  };

  try {
    const result = await sendProjectNotification({
      actorEmail: null,
      idempotencyKey: "missing-recipient",
      kind: "advisor_comment",
      projectId: "00000000-0000-0000-0000-000000000001",
      projectTitle: "Projeto de teste",
      recipientEmail: null,
      stepLabel: "Etapa 1",
    });
    assert.equal(result.status, "skipped");
    assert.equal(called, false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
  }
});
