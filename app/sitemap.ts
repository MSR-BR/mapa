import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const homepageLastModified = new Date("2026-10-29T00:00:00-03:00");
  const mapaLastModified = new Date("2026-10-08T00:00:00-03:00");
  return [
    { url: "https://mapadapesquisa.com.br/", lastModified: homepageLastModified, changeFrequency: "monthly", priority: 1 },
    { url: "https://mapadapesquisa.com.br/mapa", lastModified: mapaLastModified, changeFrequency: "monthly", priority: 0.9 },
  ];
}
