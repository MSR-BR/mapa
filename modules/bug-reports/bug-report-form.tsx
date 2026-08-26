"use client";

import { useState } from "react";
import { trackAnalyticsEvent } from "@/modules/analytics/analytics";

type Props = {
  defaultEmail?: string;
};

export function BugReportForm({ defaultEmail = "" }: Props) {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  return (
    <form
      className="bug-report-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        setSending(true);
        setStatus(null);
        const form = new FormData(formElement);
        form.set("pageUrl", window.location.href);
        form.set("userAgent", navigator.userAgent);
        form.set("browser", navigator.userAgent);
        try {
          const response = await fetch("/api/bug-reports", { body: form, method: "POST" });
          const payload = await response.json().catch(() => null);
          if (!response.ok) {
            setStatus({ kind: "error", text: payload?.error || "Não foi possível registrar agora." });
            return;
          }
          formElement.reset();
          trackAnalyticsEvent("bug_report_submitted", { source: "home", result: "success" });
          setStatus({ kind: "success", text: "Relato registrado. A equipe recebeu a solicitação e poderá responder por e-mail." });
        } catch {
          setStatus({ kind: "error", text: "Não foi possível registrar agora. Tente novamente." });
        } finally {
          setSending(false);
        }
      }}
    >
      <p className="bug-report-intro">Descreva o que aconteceu, em qual etapa e, se possível, informe o horário. Não envie senhas, chaves ou dados sensíveis.</p>
      <label><span>Assunto</span><input maxLength={180} name="subject" placeholder="Ex.: botão de salvar não responde" required /></label>
      <label><span>Seu e-mail</span><input defaultValue={defaultEmail} maxLength={320} name="email" placeholder="voce@instituicao.edu" required type="email" /></label>
      <label><span>Etapa ou página (opcional)</span><input maxLength={160} name="stage" placeholder="Ex.: Etapa 4 — revisão da literatura" /></label>
      <label><span>Descrição</span><textarea maxLength={4_000} minLength={10} name="message" placeholder="O que você esperava e o que aconteceu?" required /></label>
      <label><span>Imagem da tela (opcional, até 5 MB)</span><input accept="image/png,image/jpeg,image/webp" name="attachment" type="file" /></label>
      <label className="bug-report-honeypot" aria-hidden="true"><span>Website</span><input autoComplete="off" name="website" tabIndex={-1} /></label>
      {status ? <p className={`bug-report-status ${status.kind}`} role={status.kind === "error" ? "alert" : "status"}>{status.text}</p> : null}
      <button className="primary-button legal-support-button" disabled={sending} type="submit">{sending ? "Registrando…" : "Registrar relato"}</button>
    </form>
  );
}
