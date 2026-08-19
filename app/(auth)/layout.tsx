import Link from "next/link";

import { BrandLogo } from "@/modules/branding/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      <section className="auth-stage">
        <div className="auth-intro">
          <Link className="auth-wordmark" href="/">
            <BrandLogo variant="app-icon" decorative priority />
            <span>Mapa da Pesquisa</span>
          </Link>
          <div className="auth-intro-copy">
            <p>Estruture ideias. Encontre caminhos.</p>
            <h2>Da primeira pergunta ao seu mapa de pesquisa.</h2>
          </div>
          <p className="auth-intro-note">Um espaço claro para projetos acadêmicos complexos.</p>
        </div>
        <div className="auth-card-wrap">
          <section className="auth-card">
            <Link className="auth-brand" href="/" aria-label="Voltar ao início">
              <BrandLogo variant="app-icon" decorative priority />
            </Link>
            {children}
          </section>
        </div>
      </section>
    </main>
  );
}
