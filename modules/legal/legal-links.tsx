"use client";

import { useEffect, useRef, useState } from "react";

import { LEGAL_CONTENT, LEGAL_TERMS_VERSION } from "./legal-content";

type LegalPanel = keyof typeof LEGAL_CONTENT;

export function LegalLinks() {
  const [panel, setPanel] = useState<LegalPanel | null>(null);
  const [supportStatus, setSupportStatus] = useState<string | null>(null);
  const [supportSending, setSupportSending] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (dialogRef.current && event.target === dialogRef.current) setPanel(null); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const content = panel ? LEGAL_CONTENT[panel] : null;
  return <>
    <nav aria-label="Informações legais" className="legal-links">
      <button onClick={() => setPanel("terms")} type="button">Termos de uso</button>
      <button onClick={() => setPanel("privacy")} type="button">Privacidade</button>
      <button onClick={() => setPanel("support")} type="button">Suporte</button>
      <button onClick={() => setPanel("credits")} type="button">Créditos / Desenvolvedores</button>
      <span>Desenvolvimento: Sergio França e Mario Reis · v{LEGAL_TERMS_VERSION}</span>
    </nav>
    {content ? <div className="legal-dialog-backdrop" ref={dialogRef} role="presentation"><section aria-modal="true" className="legal-dialog" role="dialog"><button aria-label="Fechar" className="dialog-close" onClick={() => setPanel(null)} type="button">×</button><p className="section-kicker">Mapa da Pesquisa</p><h2>{content.title}</h2>{content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{panel === "support" ? <><form className="support-form" onSubmit={async (event) => { event.preventDefault(); const formElement = event.currentTarget; setSupportStatus(null); setSupportSending(true); try { const form = new FormData(formElement); const response = await fetch("/api/support", { body: JSON.stringify(Object.fromEntries(form)), headers: { "Content-Type": "application/json" }, method: "POST" }); setSupportStatus(response.ok ? "Mensagem enviada. Responderemos por e-mail." : "Não foi possível enviar agora."); if (response.ok) formElement.reset(); } catch { setSupportStatus("Não foi possível enviar agora."); } finally { setSupportSending(false); } }}><input name="subject" placeholder="Assunto" required /><input name="email" placeholder="Seu e-mail" required type="email" /><textarea name="message" placeholder="Como podemos ajudar?" required /><button className="primary-button legal-support-button" disabled={supportSending} type="submit">{supportSending ? "Enviando…" : "Enviar suporte"}</button></form><a className="support-email" href="mailto:suporte@mapadapesquisa.com.br">suporte@mapadapesquisa.com.br</a>{supportStatus ? <p role="status">{supportStatus}</p> : null}</> : null}</section></div> : null}
  </>;
}
