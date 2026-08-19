import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/modules/branding/brand-logo";
import { LegalLinks } from "@/modules/legal/legal-links";
import { PublicStartForm } from "@/modules/projects/public-start-form";

export const metadata = {
  title: "Comece seu mapa de pesquisa",
  description: "Responda cinco perguntas para formular a situação-problema, escolha TCC, monografia, dissertação, tese ou artigo e comece um mapa de pesquisa.",
  alternates: { canonical: "/" },
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

  return (
    <main className="public-home">
      <section className="quick-start public-hero" aria-labelledby="page-title">
        <BrandLogo variant="mark" className="public-hero-logo" decorative priority />
        <p className="eyebrow">Mapa da Pesquisa</p>
        <h1 id="page-title">O que você quer desenvolver?</h1>
        <PublicStartForm />
      </section>
      <LegalLinks />
    </main>
  );
}
