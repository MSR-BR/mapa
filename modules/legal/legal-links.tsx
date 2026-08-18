"use client";

import { useEffect, useRef, useState } from "react";

import { LEGAL_CONTENT, LEGAL_TERMS_VERSION } from "./legal-content";

type LegalPanel = keyof typeof LEGAL_CONTENT;

export function LegalLinks() {
  const [panel, setPanel] = useState<LegalPanel | null>(null);
  const [supportStatus, setSupportStatus] = useState<string | null>(null);
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
      <span>Desenvolvimento: Sergio França e Mario Reis · v{LEGAL_TERMS_VERSION}</span>
    </nav>
    {content ? <div className="legal-dialog-backdrop" ref={dialogRef} role="presentation"><section aria-modal="true" className="legal-dialog" role="dialog"><button aria-label="Fechar" className="dialog-close" onClick={() => setPanel(null)} type="button">×</button><p className="section-kicker">Mapa da Pesquisa</p><h2>{content.title}</h2>{content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{panel === "support" ? <><form className="support-form" onSubmit={async (event) => { event.preventDefault(); setSupportStatus(null); const form = new FormData(event.currentTarget); const response = await fetch("/api/support", { body: JSON.stringify(Object.fromEntries(form)), headers: { "Content-Type": "application/json" }, method: "POST" }); setSupportStatus(response.ok ? "Mensagem enviada. Responderemos por e-mail." : "Não foi possível enviar agora."); if (response.ok) event.currentTarget.reset(); }}><input name="subject" placeholder="Assunto" required /><input name="email" placeholder="Seu e-mail" required type="email" /><textarea name="message" placeholder="Como podemos ajudar?" required /><button className="primary-button" type="submit">Enviar suporte</button></form><a href="mailto:suporte@mapadapesquisa.com.br">suporte@mapadapesquisa.com.br</a>{supportStatus ? <p role="status">{supportStatus}</p> : null}</> : null}</section></div> : null}
  </>;
}
