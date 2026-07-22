const EXPECTED_PROJECT_REF = "aeaweherkrqmlqnxsmib";

export type SupabasePublicConfig = {
  publishableKey: string;
  projectRef: string;
  url: string;
};

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;

  if (!url || !publishableKey || !projectRef) {
    throw new Error("Configuração pública do Supabase incompleta.");
  }

  if (projectRef !== EXPECTED_PROJECT_REF) {
    throw new Error("O Project Ref configurado não pertence ao Mapa da Pesquisa.");
  }

  const parsedUrl = new URL(url);
  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== `${EXPECTED_PROJECT_REF}.supabase.co`
  ) {
    throw new Error("A URL configurada não pertence ao projeto Supabase esperado.");
  }

  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Use somente uma chave pública moderna do Supabase no cliente.");
  }

  return { publishableKey, projectRef, url: parsedUrl.origin };
}
