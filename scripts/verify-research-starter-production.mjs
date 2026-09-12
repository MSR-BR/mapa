import { createClient } from "@supabase/supabase-js";

const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PROJECT_REF",
  "MAPA_E2E_STUDENT_EMAIL",
  "MAPA_E2E_PASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Variável obrigatória ausente: ${variable}`);
  }
}

const baseUrl = new URL(
  process.env.MAPA_E2E_BASE_URL || "https://mapadapesquisa.com.br",
);
if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost") {
  throw new Error("MAPA_E2E_BASE_URL deve usar HTTPS ou localhost.");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const signIn = await supabase.auth.signInWithPassword({
  email: process.env.MAPA_E2E_STUDENT_EMAIL,
  password: process.env.MAPA_E2E_PASSWORD,
});
if (signIn.error || !signIn.data.session) {
  throw new Error("Não foi possível autenticar a conta de teste.");
}

const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}-auth-token`;
const encodedSession = "base64-" + Buffer
  .from(JSON.stringify(signIn.data.session))
  .toString("base64url");
const chunks = [];
for (let offset = 0; offset < encodedSession.length; offset += 3180) {
  chunks.push(encodedSession.slice(offset, offset + 3180));
}
const cookie = chunks.length === 1
  ? `${cookieName}=${chunks[0]}`
  : chunks.map((chunk, index) => `${cookieName}.${index}=${chunk}`).join("; ");

const endpoint = new URL("/api/research-starter/reports", baseUrl);
let response;
try {
  response = await fetch(endpoint, {
    body: JSON.stringify({
      interval: "last-5-years",
      maxReferences: 3,
      maxTopPapers: 3,
      topic: "graphene batteries",
    }),
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      Origin: baseUrl.origin,
      Referer: baseUrl.href,
    },
    method: "POST",
    signal: AbortSignal.timeout(90_000),
  });
} catch {
  throw new Error("Research Starter publicado excedeu 90 segundos ou ficou inacessível.");
}
const payload = await response.json().catch(() => null);
if (!response.ok || payload?.ok !== true) {
  throw new Error(`Research Starter publicado falhou: HTTP ${response.status}.`);
}
if (!Array.isArray(payload.references) || payload.references.length === 0) {
  throw new Error("Research Starter publicado não retornou referências.");
}

console.log(JSON.stringify({
  httpStatus: response.status,
  references: payload.references.length,
  reportStatus: payload.status,
  status: "ok",
}));
