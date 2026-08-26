import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { BrandLogo } from "@/modules/branding/brand-logo";
import { LegalLinks } from "@/modules/legal/legal-links";

export const metadata: Metadata = {
  title: "Mapa da Pesquisa | Organize seu projeto acadêmico",
  description: "Formule a situação-problema em cinco perguntas, escolha o produto acadêmico e transforme a ideia em um roteiro revisável com referências e orientação.",
  keywords: ["situação-problema", "TCC", "monografia", "dissertação", "tese", "artigo científico", "metodologia de pesquisa", "Research Starter"],
  alternates: { canonical: "/home.html" },
  openGraph: {
    title: "Mapa da Pesquisa",
    description: "Da situação-problema ao roteiro de pesquisa, com seis níveis de produto, referências verificáveis e validação acadêmica.",
    locale: "pt_BR",
    siteName: "Mapa da Pesquisa",
    type: "website",
    url: "/home.html",
  },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Research planning and academic writing",
      featureList: ["Entrada estruturada em cinco perguntas", "Seleção de seis produtos acadêmicos", "Referências do Research Starter", "Validação entre estudante e orientador"],
      inLanguage: "pt-BR",
      name: "Mapa da Pesquisa",
      operatingSystem: "Web",
      description: "Ferramenta web para formular a situação-problema e organizar projetos de pesquisa acadêmica com profundidade adequada ao produto escolhido.",
      url: "https://mapadapesquisa.com.br/home.html",
      provider: { "@id": "https://mapadapesquisa.com.br/#organization" },
    },
    {
      "@id": "https://mapadapesquisa.com.br/#organization",
      "@type": "Organization",
      name: "Mapa da Pesquisa",
      url: "https://mapadapesquisa.com.br",
      logo: "https://mapadapesquisa.com.br/brand/mapa-da-pesquisa-app-icon.png",
    },
    {
      "@type": "WebSite",
      name: "Mapa da Pesquisa",
      url: "https://mapadapesquisa.com.br",
      inLanguage: "pt-BR",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Como o Mapa da Pesquisa começa um projeto?", acceptedAnswer: { "@type": "Answer", text: "O pesquisador responde cinco perguntas sobre contexto, situação observada, discrepância, lacuna e delimitação da pergunta de pesquisa." } },
        { "@type": "Question", name: "Quais produtos acadêmicos são contemplados?", acceptedAnswer: { "@type": "Answer", text: "TCC, monografia, dissertação, tese, artigo de evento acadêmico e artigo de periódico de alto impacto." } },
        { "@type": "Question", name: "As referências são verificáveis?", acceptedAnswer: { "@type": "Answer", text: "A descoberta bibliográfica usa o Research Starter e mantém as referências associadas ao mapa para revisão do pesquisador." } },
      ],
    },
  ],
};

export default async function PublicLandingPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <main className="landing-page">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} nonce={nonce} type="application/ld+json" />
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="Mapa da Pesquisa">
          <BrandLogo variant="wordmark" priority />
        </Link>
        <Link className="landing-login" href="/login">Entrar</Link>
      </header>
      <section className="landing-hero" aria-labelledby="landing-title">
        <p className="eyebrow">Mapa da Pesquisa</p>
        <h1 id="landing-title">Da situação-problema ao produto acadêmico.</h1>
        <p className="landing-lede">Responda cinco perguntas, escolha entre TCC, monografia, dissertação, tese ou artigo e construa uma proposta com IA, referências do Research Starter e revisão humana em cada etapa.</p>
        <div className="landing-actions"><Link className="landing-primary" href="/">Começar um mapa</Link><Link className="landing-secondary" href="#como-funciona">Como funciona</Link></div>
      </section>
      <section className="landing-section" id="como-funciona" aria-labelledby="how-title">
        <p className="eyebrow">Um processo guiado</p>
        <h2 id="how-title">Clareza para decidir o próximo passo.</h2>
        <div className="landing-steps">
          <article><span>01</span><h3>Formule o problema</h3><p>Responda cinco perguntas guiadas para transformar uma inquietação em situação-problema e pergunta de pesquisa.</p></article>
          <article><span>02</span><h3>Escolha o produto</h3><p>Selecione TCC, monografia, dissertação, tese ou artigo. A escolha ajusta o rigor, a literatura e a contribuição esperada.</p></article>
          <article><span>03</span><h3>Construa e valide</h3><p>Compare seis caminhos, use referências verificáveis e avance com revisão do estudante e do orientador.</p></article>
        </div>
      </section>
      <section className="landing-section landing-products" aria-labelledby="products-title">
        <p className="eyebrow">Níveis de pesquisa</p><h2 id="products-title">Um mapa na medida do seu produto.</h2>
        <div className="landing-product-grid">
          <article><strong>TCC / Graduação</strong><span>Recorte viável e fundamentos essenciais.</span></article>
          <article><strong>Monografia / Especialização</strong><span>Aprofundamento aplicado e análise consistente.</span></article>
          <article><strong>Dissertação / Mestrado</strong><span>Lacuna delimitada e contribuição original.</span></article>
          <article><strong>Tese / Doutorado</strong><span>Avanço robusto para uma agenda científica.</span></article>
          <article><strong>Artigo de evento</strong><span>Contribuição concisa e comunicável.</span></article>
          <article><strong>Artigo de periódico</strong><span>Rigor, transparência e relevância internacional.</span></article>
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
      <section className="landing-cta" aria-labelledby="cta-title"><h2 id="cta-title">Comece com cinco respostas.</h2><p>O próximo passo é organizar a ideia que você já tem e escolher o produto que deseja entregar.</p><Link className="landing-primary" href="/">Criar meu mapa</Link></section>
      <LegalLinks />
    </main>
  );
}
