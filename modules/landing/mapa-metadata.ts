import type { Metadata } from "next";

export const mapaMetadata: Metadata = {
  title: "Criar mapa de pesquisa — Rápido ou Avançado",
  description: "Comece seu projeto de pesquisa com cinco perguntas guiadas ou escreva sua ideia no modo Rápido. Prepare sua ideia sem login e salve com Google.",
  alternates: { canonical: "/mapa" },
  robots: { index: true, follow: true },
  openGraph: { title: "Crie seu Mapa da Pesquisa", description: "Escolha o modo Rápido ou Avançado para organizar sua pesquisa.", url: "/mapa",
    siteName: "Mapa da Pesquisa", locale: "pt_BR", type: "website",
    images: [{ url: "/brand/mapa-da-pesquisa-social-card.png", width: 1200, height: 630, alt: "Mapa da Pesquisa — crie seu projeto no modo Rápido ou Avançado" }],
  },
  twitter: {
    card: "summary_large_image", title: "Crie seu Mapa da Pesquisa",
    description: "Escolha o modo Rápido ou Avançado para organizar sua pesquisa.",
    images: ["/brand/mapa-da-pesquisa-social-card.png"],
  },
};
