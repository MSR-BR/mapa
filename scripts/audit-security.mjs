import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => !file.startsWith(".git/") && !file.startsWith("node_modules/") && !file.startsWith(".next/"));

const textFiles = trackedFiles.filter((file) => !/\.(?:png|jpe?g|gif|webp|pdf|woff2?|ttf|ico)$/i.test(file));
const contents = new Map();
for (const file of textFiles) {
  contents.set(file, await readFile(file, "utf8"));
}

const findings = [];
const pass = (check, evidence) => findings.push({ check, evidence, status: "pass" });
const warn = (check, evidence) => findings.push({ check, evidence, status: "warning" });
const fail = (check, evidence) => findings.push({ check, evidence, status: "fail" });

const trackedEnvFiles = trackedFiles.filter((file) => /(^|\/)\.env(?:\.|$)/.test(file) && file !== ".env.example");
if (trackedEnvFiles.length === 0) pass("secrets", "Nenhum .env de ambiente foi rastreado pelo Git.");
else fail("secrets", `Arquivos de ambiente rastreados: ${trackedEnvFiles.join(", ")}`);

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:^|[^A-Za-z0-9_])(?:sk_live_|sk_test_|re_)[A-Za-z0-9_-]{20,}/,
  /AIza[0-9A-Za-z_-]{30,}/,
  /gh[pousr]_[A-Za-z0-9_]{30,}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
];
const secretHits = [];
for (const [file, text] of contents) {
  if (file === ".env.example") continue;
  if (secretPatterns.some((pattern) => pattern.test(text))) secretHits.push(file);
}
if (secretHits.length === 0) pass("secrets", "Nenhum padrão de chave privada/token foi encontrado nos arquivos rastreados.");
else fail("secrets", `Possíveis segredos em: ${secretHits.join(", ")}`);

const publicEnv = contents.get(".env.example") ?? "";
if (!/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/.test(publicEnv)) {
  fail("public-environment", "A chave pública do Supabase não está documentada em .env.example.");
} else if (/NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|SERVICE|PASSWORD|TOKEN|PRIVATE|API_KEY)/.test(publicEnv)) {
  fail("public-environment", "Há uma variável sensível marcada como NEXT_PUBLIC_.");
} else {
  pass("public-environment", "Variáveis públicas não incluem service_role, senha ou tokens privados.");
}

const migrationFiles = trackedFiles.filter((file) => file.startsWith("supabase/migrations/") && file.endsWith(".sql"));
const advisorHardening = migrationFiles
  .map((file) => contents.get(file) ?? "")
  .join("\n");
const createdTables = [];
for (const file of migrationFiles) {
  const text = contents.get(file) ?? "";
  for (const match of text.matchAll(/create table (?:if not exists )?public\.([a-z0-9_]+)/gi)) createdTables.push({ file, table: match[1] });
}
const missingRls = createdTables.filter(({ table }) => {
  const allSql = migrationFiles.map((file) => contents.get(file) ?? "").join("\n");
  return !new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i").test(allSql);
});
if (missingRls.length === 0) pass("supabase-rls", `${createdTables.length} tabelas públicas criadas pelas migrations têm RLS habilitado.`);
else fail("supabase-rls", `Tabelas sem RLS detectadas: ${missingRls.map(({ table }) => table).join(", ")}`);
if (advisorHardening.includes("restrict_advisor_workflow_update_trigger")) {
  pass("advisor-rls", "Atualizações diretas do orientador são limitadas por trigger transacional.");
} else {
  fail("advisor-rls", "Não foi encontrada a proteção de UPDATE do workflow do orientador.");
}

const projectApiRoutes = trackedFiles.filter((file) => /^app\/api\/projects\/.*\/route\.ts$/.test(file));
const unguardedProjectRoutes = projectApiRoutes.filter((file) => {
  const text = contents.get(file) ?? "";
  return !text.includes("requireAuthenticatedUser") && !text.includes("auth.getClaims");
});
if (unguardedProjectRoutes.length === 0) pass("api-auth", `${projectApiRoutes.length} rotas de projeto exigem autenticação no servidor.`);
else fail("api-auth", `Rotas de projeto sem requireAuthenticatedUser: ${unguardedProjectRoutes.join(", ")}`);

const dangerousHtml = trackedFiles.filter((file) => file !== "scripts/audit-security.mjs" && (contents.get(file) ?? "").includes("dangerouslySetInnerHTML"));
if (dangerousHtml.length === 1 && dangerousHtml[0] === "app/home.html/page.tsx") {
  pass("xss", "Único uso de HTML bruto está limitado ao JSON-LD estático da landing page.");
} else if (dangerousHtml.length === 0) pass("xss", "Nenhum uso de HTML bruto foi encontrado.");
else warn("xss", `Revisar usos de HTML bruto: ${dangerousHtml.join(", ")}`);

const nextConfig = contents.get("next.config.ts") ?? "";
const requiredHeaders = ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security"];
const missingHeaders = requiredHeaders.filter((header) => !nextConfig.includes(header));
if (missingHeaders.length === 0) pass("security-headers", "Cabeçalhos de transporte, framing, MIME, referrer e permissões configurados.");
else fail("security-headers", `Cabeçalhos ausentes: ${missingHeaders.join(", ")}`);

const proxy = contents.get("proxy.ts") ?? "";
if (proxy.includes('request.nextUrl.pathname.startsWith("/api/")') && proxy.includes('Origem não permitida')) {
  pass("csrf", "Origem explícita cross-site é rejeitada para mutações da API no proxy.");
} else warn("csrf", "Não foi encontrada uma guarda explícita de origem no proxy.");

if (proxy.includes("Content-Security-Policy") && proxy.includes("nonce-")) {
  pass("csp", "CSP dinâmica com nonce é emitida pelo proxy.");
} else {
  warn("csp", "CSP dinâmica com nonce ainda não foi encontrada.");
}

if ((contents.get("app/dashboard/layout.tsx") ?? "").includes("index: false") && (contents.get("app/robots.ts") ?? "").includes("/dashboard/")) {
  pass("privacy-indexing", "Dashboard e rotas privadas estão fora de indexação.");
} else fail("privacy-indexing", "Revisar robots e metadata das áreas privadas.");

warn("remote-verification", "Verificação RLS remota e fluxo E2E dependem de credenciais de teste e acesso à API Supabase; não são inferidos por esta auditoria estática.");

const failures = findings.filter((finding) => finding.status === "fail");
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), filesScanned: trackedFiles.length, findings }, null, 2));
if (failures.length > 0) process.exitCode = 1;
