"use client";

import { useEffect, useRef, useState } from "react";

import { LEGAL_CONTENT } from "./legal-content";
import { APP_VERSION } from "@/lib/app-version";

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
  const renderParagraph = (paragraph: string) => {
    const parts = paragraph.split(/(suporte@mapadapesquisa\.com\.br|sfranca@id\.uff\.br|marioreis@id\.uff\.br|doutoradosg\.uff\.br\/docente\/sergio-luiz-braga-frança|profmarioreis\.wordpress\.com)/g);
    return parts.map((part, index) => {
      if (part.includes("@")) return <a href={`mailto:${part}`} key={`${part}-${index}`}>{part}</a>;
      if (part.startsWith("http") || part.includes("doutoradosg") || part.includes("wordpress")) return <a href={`https://${part.replace(/^https?:\/\//, "")}`} key={`${part}-${index}`} rel="noreferrer" target="_blank">{part.includes("doutoradosg") ? "Página pessoal" : "Página pessoal"}</a>;
      return <span key={`${part}-${index}`}>{part}</span>;
    });
  };
  return <>
    <nav aria-label="Informações legais" className="legal-links">
      <button onClick={() => setPanel("terms")} type="button">Termos de uso</button>
      <button onClick={() => setPanel("privacy")} type="button">Privacidade</button>
      <button onClick={() => setPanel("support")} type="button">Suporte</button>
      <button onClick={() => setPanel("credits")} type="button">Créditos</button>
      <span>{APP_VERSION}</span>
    </nav>
    {content ? <div className="legal-dialog-backdrop" ref={dialogRef} role="presentation"><section aria-modal="true" className="legal-dialog" role="dialog"><button aria-label="Fechar" className="dialog-close" onClick={() => setPanel(null)} type="button">×</button><p className="section-kicker">Mapa da Pesquisa</p><h2>{content.title}</h2>{panel === "credits" ? <div className="credits-people"><article><h3>Sérgio França, D.Sc.</h3><p>Departamento de Engenharia Civil<br />Escola de Engenharia<br />Universidade Federal Fluminense</p><div className="credits-links"><a href="mailto:sfranca@id.uff.br">E-mail</a><a href="https://doutoradosg.uff.br/docente/sergio-luiz-braga-frança" rel="noreferrer" target="_blank">Página pessoal</a></div></article><article><h3>Mario Reis</h3><p>Instituto de Física<br />Universidade Federal Fluminense</p><div className="credits-links"><a href="mailto:marioreis@id.uff.br">E-mail</a><a href="https://profmarioreis.wordpress.com" rel="noreferrer" target="_blank">Página pessoal</a></div></article></div> : null}{panel !== "credits" ? content.paragraphs.map((paragraph) => <p key={paragraph}>{renderParagraph(paragraph)}</p>) : null}{panel === "support" ? <><form className="support-form" onSubmit={async (event) => { event.preventDefault(); const formElement = event.currentTarget; setSupportStatus(null); setSupportSending(true); try { const form = new FormData(formElement); const response = await fetch("/api/support", { body: JSON.stringify(Object.fromEntries(form)), headers: { "Content-Type": "application/json" }, method: "POST" }); const payload = await response.json().catch(() => null); setSupportStatus(response.ok ? "Mensagem enviada. Responderemos por e-mail." : (payload?.error || "Não foi possível enviar agora.")); if (response.ok) formElement.reset(); } catch { setSupportStatus("Não foi possível enviar agora."); } finally { setSupportSending(false); } }}><input name="subject" placeholder="Assunto" required /><input name="email" placeholder="Seu e-mail" required type="email" /><textarea name="message" minLength={10} placeholder="Como podemos ajudar? (mínimo de 10 caracteres)" required /><button className="primary-button legal-support-button" disabled={supportSending} type="submit">{supportSending ? "Enviando…" : "Enviar suporte"}</button></form><a className="support-email" href="mailto:suporte@mapadapesquisa.com.br">suporte@mapadapesquisa.com.br</a>{supportStatus ? <p role="status">{supportStatus}</p> : null}</> : null}</section></div> : null}
  </>;
}
