import { DATA_RETRY_AFTER_SECONDS } from "@/lib/supabase/data-api";

// Server Components cannot set an arbitrary status. Their transient data errors
// redirect here instead of rendering a false empty project/not-found page.
export function GET() {
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Consulta temporariamente indisponível | Mapa da Pesquisa</title></head><body><main><h1>Não foi possível consultar seu mapa agora</h1><p>A consulta falhou temporariamente. Nenhum texto foi alterado por esta consulta.</p><p>Aguarde alguns instantes e <a href="/dashboard">volte à sua biblioteca</a> para abrir o mapa novamente.</p></main></body></html>`, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "Retry-After": String(DATA_RETRY_AFTER_SECONDS), "X-Robots-Tag": "noindex" },
  });
}
