import type { Metadata } from "next";
import Link from "next/link";

import { LegalLinks } from "@/modules/legal/legal-links";

export const metadata: Metadata = {
  title: "Mapa da Pesquisa | Organize seu projeto acadêmico",
  description: "Transforme um tema de pesquisa em um roteiro acadêmico revisável, com referências e validação entre estudante e orientador.",
  alternates: { canonical: "/home.html" },
  openGraph: {
    title: "Mapa da Pesquisa",
    description: "Do tema ao roteiro de pesquisa, com referências e validação acadêmica.",
    locale: "pt_BR",
    siteName: "Mapa da Pesquisa",
    type: "website",
    url: "/home.html",
  },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  applicationCategory: "EducationalApplication",
  inLanguage: "pt-BR",
  name: "Mapa da Pesquisa",
  operatingSystem: "Web",
  description: "Ferramenta web para organizar projetos de pesquisa acadêmica com referências e validação orientador–estudante.",
  url: "https://mapadapesquisa.com.br/home.html",
  provider: { "@type": "Organization", name: "Mapa da Pesquisa", url: "https://mapadapesquisa.com.br" },
};

export default function PublicLandingPage() {
  return (
    <main className="landing-page">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} type="application/ld+json" />
      <header className="landing-header">
        <Link className="landing-brand" href="/"><span className="brand-mark" aria-hidden="true">MP</span><span>Mapa da Pesquisa</span></Link>
        <Link className="landing-login" href="/login">Entrar</Link>
      </header>
      <section className="landing-hero" aria-labelledby="landing-title">
        <p className="eyebrow">Mapa da Pesquisa</p>
        <h1 id="landing-title">Do tema ao roteiro de pesquisa.</h1>
        <p className="landing-lede">Organize uma proposta acadêmica com apoio de IA, referências do Research Starter e revisão humana em cada etapa.</p>
        <div className="landing-actions"><Link className="landing-primary" data-analytics-event="cta_start_map" href="/">Começar um mapa</Link><Link className="landing-secondary" href="#como-funciona">Como funciona</Link></div>
      </section>
      <section className="landing-section" id="como-funciona" aria-labelledby="how-title">
        <p className="eyebrow">Um processo guiado</p>
        <h2 id="how-title">Clareza para decidir o próximo passo.</h2>
        <div className="landing-steps">
          <article><span>01</span><h3>Parta do tema</h3><p>Escreva o que você quer investigar. O Mapa propõe problemas e caminhos de pesquisa para você comparar.</p></article>
          <article><span>02</span><h3>Revise e justifique</h3><p>Edite as etapas, registre suas justificativas e aprofunde a literatura com referências verificáveis.</p></article>
          <article><span>03</span><h3>Valide com orientação</h3><p>Estudante e orientador acompanham o mesmo projeto e avançam somente quando a etapa está pronta.</p></article>
        </div>
      </section>
      <section className="landing-feature" aria-labelledby="references-title">
        <div><p className="eyebrow">Pesquisa com rastreabilidade</p><h2 id="references-title">Ideias apoiadas por literatura.</h2><p>O Research Starter ajuda a localizar fontes relacionadas ao tema. As referências entram no mapa para que tópicos, objetivos e metodologia possam ser revisados com mais contexto.</p></div>
        <div className="landing-feature-note"><strong>Você decide.</strong><span>A IA sugere; você revisa, justifica e valida.</span></div>
      </section>
      <section className="landing-section landing-audience" aria-labelledby="audience-title">
        <p className="eyebrow">Para cada papel</p><h2 id="audience-title">Um espaço compartilhado.</h2>
        <div className="landing-audience-grid"><article><h3>Estudante</h3><p>Construa seu mapa por etapas, salve o progresso e envie cada parte para revisão.</p></article><article><h3>Orientador</h3><p>Leia o projeto, comente e valide as etapas dos estudantes vinculados à sua orientação.</p></article></div>
      </section>
      <section className="landing-cta" aria-labelledby="cta-title"><h2 id="cta-title">Comece com uma pergunta.</h2><p>O próximo passo pode ser organizar a ideia que você já tem.</p><Link className="landing-primary" data-analytics-event="cta_start_map" href="/">Criar meu mapa</Link></section>
      <LegalLinks />
    </main>
  );
}
