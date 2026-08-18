"use client";

import { useActionState } from "react";

import { acceptLegalTerms } from "./legal-consent-actions";
import { LEGAL_CONTENT, LEGAL_TERMS_VERSION } from "./legal-content";

export function LegalConsentGate({ activeRole }: { activeRole: "student" | "advisor" }) {
  const [state, action, pending] = useActionState(acceptLegalTerms, null);
  return (
    <div className="profile-mode-backdrop legal-consent-backdrop" role="presentation">
      <section aria-labelledby="legal-consent-title" aria-modal="true" className="legal-consent-card" role="dialog">
        <p className="section-kicker">Primeiro acesso</p>
        <h2 id="legal-consent-title">Antes de começar</h2>
        <p>Leia os termos e confirme que entendeu como o Mapa armazena projetos e envia notificações.</p>
        <div className="legal-consent-scroll">
          <h3>{LEGAL_CONTENT.terms.title}</h3>
          {LEGAL_CONTENT.terms.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <h3>{LEGAL_CONTENT.privacy.title}</h3>
          {LEGAL_CONTENT.privacy.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p className="legal-version">Versão {LEGAL_TERMS_VERSION}</p>
        </div>
        <form action={action}>
          <input name="profileRole" type="hidden" value={activeRole} />
          <label className="legal-checkbox"><input name="accepted" required type="checkbox" /> Li e aceito os Termos de uso e a Política de privacidade.</label>
          <button className="primary-button legal-accept-button" disabled={pending} type="submit">{pending ? "Registrando…" : "Aceitar e continuar"}</button>
          {state?.error ? <p className="legal-form-error" role="alert">{state.error}</p> : null}
        </form>
      </section>
    </div>
  );
}
