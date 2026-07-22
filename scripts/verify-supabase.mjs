const expectedProjectRef = "aeaweherkrqmlqnxsmib";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;

if (!url || !publishableKey || !projectRef) {
  throw new Error("Variáveis públicas do Supabase não configuradas.");
}

const parsedUrl = new URL(url);
if (
  projectRef !== expectedProjectRef ||
  parsedUrl.hostname !== `${expectedProjectRef}.supabase.co`
) {
  throw new Error("Configuração aponta para um projeto Supabase inesperado.");
}

if (!publishableKey.startsWith("sb_publishable_")) {
  throw new Error("A verificação exige uma chave pública moderna.");
}

const response = await fetch(new URL("/auth/v1/settings", parsedUrl), {
  headers: { apikey: publishableKey },
});

if (!response.ok) {
  throw new Error(`Supabase respondeu com HTTP ${response.status}.`);
}

console.log(`Supabase verificado para o projeto ${projectRef}.`);
