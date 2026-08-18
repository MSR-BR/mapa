import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://mapadapesquisa.com.br/", changeFrequency: "monthly", priority: 0.8 },
    { url: "https://mapadapesquisa.com.br/home.html", changeFrequency: "monthly", priority: 1 },
  ];
}
