import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/modules/branding/brand-logo";
import { LegalLinks } from "@/modules/legal/legal-links";
import { PublicStartForm } from "@/modules/projects/public-start-form";

export const metadata: Metadata = {
  title: "Criar mapa de pesquisa — Rápido ou Avançado",
  description: "Comece seu projeto de pesquisa com cinco perguntas guiadas ou escreva sua ideia no modo Rápido. Prepare sua ideia sem login e salve com Google.",
  alternates: { canonical: "/mapa" },
  robots: { index: true, follow: true },
  openGraph: { title: "Crie seu Mapa da Pesquisa", description: "Escolha o modo Rápido ou Avançado para organizar sua pesquisa.", url: "/mapa" },
};

export default async function MapaPage({ searchParams }: { searchParams: Promise<{ modo?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const authenticated = Boolean(data?.claims?.sub);
  return <main className="landing-page mapa-entry-page">
    <header className="landing-header">
      <Link className="landing-brand" href="/" aria-label="Mapa da Pesquisa — apresentação"><BrandLogo variant="wordmark" priority /></Link>
      <Link className="landing-login" href={authenticated ? "/dashboard" : "/login"}>{authenticated ? "Meus projetos" : "Entrar"}</Link>
    </header>
    <section className="mapa-entry-heading"><p className="eyebrow">Comece pela sua ideia</p><h1>Crie seu mapa de pesquisa.</h1><p>Escolha Rápido ou Avançado. Você pode preparar sua ideia sem login; a conta Google permite gerar e guardar o projeto.</p></section>
    <section className="mapa-entry-form" aria-label="Escolha o modo e descreva sua pesquisa"><PublicStartForm authenticated={authenticated} initialMode={params.modo === "rapido" ? "quick" : "advanced"} explicitMode={Boolean(params.modo)} /></section>
    <LegalLinks />
  </main>;
}
