import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/modules/branding/brand-logo";
import { LegalLinks } from "@/modules/legal/legal-links";
import { PublicStartForm } from "@/modules/projects/public-start-form";

const canonicalUrl = "https://mapadapesquisa.com.br/";
const socialCardUrl = "/brand/mapa-da-pesquisa-social-card.png";

export const metadata: Metadata = {
  title: { absolute: "Mapa da Pesquisa | Da situação-problema ao projeto" },
  description: "Formule a situação-problema em cinco perguntas, escolha TCC, monografia, dissertação, tese ou artigo e construa um mapa de pesquisa revisável.",
  keywords: ["mapa da pesquisa", "situação-problema", "projeto de pesquisa", "TCC", "monografia", "dissertação", "tese", "artigo científico", "metodologia de pesquisa", "Research Starter"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Mapa da Pesquisa | Da situação-problema ao projeto",
    description: "Cinco perguntas, seis produtos acadêmicos e um mapa de pesquisa com IA, referências verificáveis e revisão humana.",
    locale: "pt_BR",
    siteName: "Mapa da Pesquisa",
    type: "website",
    url: "/",
    images: [{ url: socialCardUrl, width: 1200, height: 630, alt: "Mapa da Pesquisa — da situação-problema ao projeto de pesquisa" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mapa da Pesquisa | Da situação-problema ao projeto",
    description: "Formule, escolha o nível e construa seu projeto de pesquisa.",
    images: [socialCardUrl],
  },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": `${canonicalUrl}#application`,
      "@type": "WebApplication",
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Research planning and academic writing",
      browserRequirements: "Requires JavaScript",
      description: "Ferramenta web para formular a situação-problema e organizar projetos de pesquisa acadêmica com profundidade adequada ao produto escolhido.",
      featureList: [
        "Entrada estruturada em cinco perguntas",
        "Seleção de seis produtos acadêmicos",
        "Referências do Research Starter",
        "Projetos próprios para estudantes e orientadores",
        "Validação entre estudante e orientador",
      ],
      inLanguage: "pt-BR",
      name: "Mapa da Pesquisa",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/OnlineOnly",
        price: 0,
        priceCurrency: "BRL",
      },
      operatingSystem: "Web browser",
      provider: { "@id": `${canonicalUrl}#organization` },
      url: canonicalUrl,
    },
    {
      "@id": `${canonicalUrl}#organization`,
      "@type": "Organization",
      logo: `${canonicalUrl}brand/mapa-da-pesquisa-app-icon.png`,
      name: "Mapa da Pesquisa",
      url: canonicalUrl,
    },
    {
      "@id": `${canonicalUrl}#website`,
      "@type": "WebSite",
      inLanguage: "pt-BR",
      name: "Mapa da Pesquisa",
      url: canonicalUrl,
    },
  ],
};

function safeOAuthDestination(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard?resume=1";
}

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string; next?: string }> }) {
  const { code, next } = await searchParams;
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(safeOAuthDestination(next))}`);
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/dashboard?continue=1");

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
        <h1 id="landing-title">Da situação-problema ao projeto de pesquisa.</h1>
        <p className="landing-lede">
          Responda cinco perguntas, escolha entre TCC, monografia, dissertação, tese ou artigo e construa uma proposta com IA, referências verificáveis e revisão humana.
        </p>
        <div className="landing-actions">
          <Link className="landing-primary" href="#criar-mapa">Começar um mapa</Link>
          <Link className="landing-secondary" href="#apresentacao">Assistir ao vídeo</Link>
        </div>
        <ul className="landing-proof-points" aria-label="Características principais">
          <li>Acesso gratuito</li>
          <li>Mapa Rápido ou Avançado</li>
          <li>Aluno ou Orientador</li>
        </ul>
      </section>

      <section className="landing-start" id="criar-mapa" aria-labelledby="start-title">
        <div className="landing-start-copy">
          <BrandLogo variant="mark" className="landing-start-logo" decorative />
          <p className="eyebrow">Comece agora</p>
          <h2 id="start-title">Vamos construir o mapa da sua pesquisa?</h2>
          <p>Escolha o modo que combina com o estágio da sua ideia. O rascunho fica preservado ao entrar com o Google.</p>
        </div>
        <div className="landing-start-form">
          <PublicStartForm />
        </div>
      </section>

      <section className="landing-video" id="apresentacao" aria-labelledby="landing-video-title">
        <div className="landing-video-copy">
          <p className="eyebrow">Veja em ação</p>
          <h2 id="landing-video-title">Conheça o Mapa da Pesquisa.</h2>
          <p className="landing-video-lede" id="landing-video-description">Em pouco mais de um minuto, veja como uma ideia ganha estrutura, como a IA apoia cada decisão e como estudante e orientador avançam juntos.</p>
          <ul className="landing-video-points" aria-label="Destaques da apresentação">
            <li>Mapa Rápido ou Mapa Avançado</li>
            <li>Problemática, objetivos, capítulos e metodologia</li>
            <li>Sugestões da IA com revisão humana</li>
          </ul>
        </div>
        <figure className="landing-video-figure">
          <div className="landing-video-shell">
            <video
              aria-describedby="landing-video-description"
              aria-label="Vídeo de apresentação do Mapa da Pesquisa"
              controls
              height={976}
              playsInline
              poster="/media/mapa-da-pesquisa-apresentacao-poster.webp"
              preload="none"
              width={576}
            >
              <source src="/media/mapa-da-pesquisa-apresentacao.mp4" type="video/mp4" />
              Seu navegador não oferece suporte à reprodução deste vídeo.
            </video>
          </div>
          <figcaption>Apresentação do Mapa da Pesquisa · 1 min 17 s</figcaption>
        </figure>
      </section>

      <section className="landing-section" id="como-funciona" aria-labelledby="how-title">
        <p className="eyebrow">Um processo guiado</p>
        <h2 id="how-title">Clareza para decidir o próximo passo.</h2>
        <div className="landing-steps">
          <article><span>01</span><h3>Formule o problema</h3><p>Responda cinco perguntas guiadas para transformar uma inquietação em situação-problema e pergunta de pesquisa.</p></article>
          <article><span>02</span><h3>Escolha o produto</h3><p>Selecione TCC, monografia, dissertação, tese ou artigo. A escolha ajusta o rigor, a literatura e a contribuição esperada.</p></article>
          <article><span>03</span><h3>Construa e valide</h3><p>Compare caminhos, use referências verificáveis e avance com revisão humana adequada ao perfil escolhido.</p></article>
        </div>
      </section>

      <section className="landing-section landing-products" aria-labelledby="products-title">
        <p className="eyebrow">Níveis de pesquisa</p>
        <h2 id="products-title">Um mapa na medida do seu produto.</h2>
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
        <p className="eyebrow">Para cada papel</p>
        <h2 id="audience-title">Autoria própria e orientação quando necessária.</h2>
        <div className="landing-audience-grid">
          <article><h3>Aluno</h3><p>Construa seus projetos, salve o progresso e vincule um orientador para revisar e aprovar cada avanço.</p></article>
          <article><h3>Orientador</h3><p>Crie projetos próprios sem supervisor externo e acompanhe, comente ou valide os projetos de alunos vinculados.</p></article>
        </div>
      </section>

      <section className="landing-cta" aria-labelledby="cta-title">
        <h2 id="cta-title">Comece com cinco respostas.</h2>
        <p>O próximo passo é organizar a ideia que você já tem e escolher o produto que deseja entregar.</p>
        <Link className="landing-primary" href="#criar-mapa">Criar meu mapa</Link>
      </section>
      <LegalLinks />
    </main>
  );
}
