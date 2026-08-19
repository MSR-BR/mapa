import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AnalyticsConsent } from "@/modules/analytics/analytics-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mapadapesquisa.com.br"),
  title: { default: "Mapa da Pesquisa", template: "%s | Mapa da Pesquisa" },
  description: "Formule a situação-problema em cinco perguntas, escolha o produto acadêmico e construa um mapa de pesquisa com IA, Research Starter e validação humana.",
  keywords: ["mapa da pesquisa", "situação-problema", "projeto de pesquisa", "TCC", "monografia", "dissertação", "tese", "revisão da literatura", "Research Starter"],
  alternates: { canonical: "/" },
  openGraph: { title: "Mapa da Pesquisa | Da situação-problema ao projeto", description: "Cinco perguntas, seis produtos acadêmicos e um mapa de pesquisa revisável com referências verificáveis.", locale: "pt_BR", siteName: "Mapa da Pesquisa", type: "website", images: [{ url: "/brand/mapa-da-pesquisa-wordmark.png", alt: "Mapa da Pesquisa" }] },
  twitter: { card: "summary", title: "Mapa da Pesquisa", description: "Formule, escolha o nível e construa seu projeto de pesquisa." },
  icons: {
    icon: "/brand/mapa-da-pesquisa-app-icon.png",
    shortcut: "/brand/mapa-da-pesquisa-app-icon.png",
    apple: "/brand/mapa-da-pesquisa-app-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">{children}<AnalyticsConsent measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""} nonce={nonce} /></body>
    </html>
  );
}
