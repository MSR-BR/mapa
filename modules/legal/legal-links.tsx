"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { APP_VERSION } from "@/lib/app-version";
import { BugReportForm } from "@/modules/bug-reports/bug-report-form";

import { LEGAL_CONTENT } from "./legal-content";

type LegalPanel = keyof typeof LEGAL_CONTENT | "bug";

export function LegalLinks({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [panel, setPanel] = useState<LegalPanel | null>(null);
  const [supportStatus, setSupportStatus] = useState<string | null>(null);
  const [supportSending, setSupportSending] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (dialogRef.current && event.target === dialogRef.current) setPanel(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const content = panel && panel !== "bug" ? LEGAL_CONTENT[panel] : null;
  const renderParagraph = (paragraph: string) => {
    const parts = paragraph.split(/(suporte@mapadapesquisa\.com\.br|sfranca@id\.uff\.br|marioreis@id\.uff\.br|doutoradosg\.uff\.br\/docente\/sergio-luiz-braga-frança|profmarioreis\.wordpress\.com)/g);
    return parts.map((part, index) => {
      if (part.includes("@")) return <a href={`mailto:${part}`} key={`${part}-${index}`}>{part}</a>;
      if (part.includes("doutoradosg") || part.includes("wordpress")) return <a href={`https://${part.replace(/^https?:\/\//, "")}`} key={`${part}-${index}`} rel="noreferrer" target="_blank">Página pessoal</a>;
      return <span key={`${part}-${index}`}>{part}</span>;
    });
  };

  return <>
    <nav aria-label="Informações legais" className="legal-links">
      <button onClick={() => setPanel("terms")} type="button">Termos de uso</button>
      <button onClick={() => setPanel("privacy")} type="button">Privacidade</button>
      <button onClick={() => setPanel("support")} type="button">Suporte</button>
      <button onClick={() => setPanel("bug")} type="button">Relatar problema</button>
      <button onClick={() => setPanel("credits")} type="button">Créditos</button>
      <span>{APP_VERSION}</span>
    </nav>

    {panel ? <div className="legal-dialog-backdrop" ref={dialogRef} role="presentation">
      <section aria-labelledby="legal-dialog-title" aria-modal="true" className="legal-dialog" role="dialog">
        <button aria-label="Fechar" className="dialog-close" onClick={() => setPanel(null)} type="button">×</button>
        <p className="section-kicker">Mapa da Pesquisa</p>
        <h2 id="legal-dialog-title">{panel === "bug" ? "Relatar um problema" : content?.title}</h2>

        {panel === "bug" ? <BugReportForm defaultEmail={defaultEmail} /> : null}
        {content && panel === "credits" ? <>
          <div className="credits-institution"><Image alt="Universidade Federal Fluminense" className="credits-uff-logo" height={20} src="/brand/uff-logo.png" width={275} /></div>
          <div className="credits-people">
            <article><h3>Sérgio França</h3><p>Departamento de Engenharia Civil<br />Escola de Engenharia<br />Universidade Federal Fluminense</p><div className="credits-links"><a href="mailto:sfranca@id.uff.br">E-mail</a><a href="https://doutoradosg.uff.br/docente/sergio-luiz-braga-frança" rel="noreferrer" target="_blank">Página pessoal</a></div></article>
            <article><h3>Mario Reis</h3><p>Instituto de Física<br />Universidade Federal Fluminense</p><div className="credits-links"><a href="mailto:marioreis@id.uff.br">E-mail</a><a href="https://profmarioreis.wordpress.com" rel="noreferrer" target="_blank">Página pessoal</a></div></article>
          </div>
        </> : null}
        {content && panel !== "credits" ? content.paragraphs.map((paragraph) => <p key={paragraph}>{renderParagraph(paragraph)}</p>) : null}
        {panel === "support" ? <>
          <form className="support-form" onSubmit={async (event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            setSupportStatus(null);
            setSupportSending(true);
            try {
              const form = new FormData(formElement);
              const response = await fetch("/api/support", { body: JSON.stringify(Object.fromEntries(form)), headers: { "Content-Type": "application/json" }, method: "POST" });
              const payload = await response.json().catch(() => null);
              setSupportStatus(response.ok ? "Mensagem enviada. Responderemos por e-mail." : (payload?.error || "Não foi possível enviar agora."));
              if (response.ok) formElement.reset();
            } catch {
              setSupportStatus("Não foi possível enviar agora.");
            } finally {
              setSupportSending(false);
            }
          }}>
            <input name="subject" placeholder="Assunto" required />
            <input name="email" placeholder="Seu e-mail" required type="email" />
            <textarea name="message" minLength={10} placeholder="Como podemos ajudar? (mínimo de 10 caracteres)" required />
            <button className="primary-button legal-support-button" disabled={supportSending} type="submit">{supportSending ? "Enviando…" : "Enviar suporte"}</button>
          </form>
          <a className="support-email" href="mailto:suporte@mapadapesquisa.com.br">suporte@mapadapesquisa.com.br</a>
          {supportStatus ? <p role="status">{supportStatus}</p> : null}
        </> : null}
      </section>
    </div> : null}
  </>;
}
