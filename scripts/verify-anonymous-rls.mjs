const expectedProjectRef = "aeaweherkrqmlqnxsmib";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;

if (!url || !publishableKey || projectRef !== expectedProjectRef) {
  throw new Error("Configuração do Supabase ausente ou inesperada.");
}

for (const table of ["projects", "research_workflows"]) {
  const endpoint = new URL(`/rest/v1/${table}?select=*&limit=1`, url);
  const response = await fetch(endpoint, {
    headers: { apikey: publishableKey },
  });
  const body = await response.json();

  if (response.ok || body?.code !== "42501") {
    throw new Error(`O papel anon obteve acesso inesperado a public.${table}.`);
  }
}

console.log("Acesso anônimo a projects e research_workflows negado como esperado.");
