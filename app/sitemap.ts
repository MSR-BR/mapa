import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-10-08T00:00:00-03:00");
  return [
    { url: "https://mapadapesquisa.com.br/", lastModified, changeFrequency: "monthly", priority: 1 },
    { url: "https://mapadapesquisa.com.br/mapa", lastModified, changeFrequency: "monthly", priority: 0.9 },
  ];
}
