import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/home.html"], disallow: ["/dashboard/", "/login", "/auth/", "/api/"] },
    sitemap: "https://mapadapesquisa.com.br/sitemap.xml",
    host: "https://mapadapesquisa.com.br",
  };
}
