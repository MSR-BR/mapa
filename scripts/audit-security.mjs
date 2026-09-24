import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";

const classification = "S3_SENSITIVE";
const snapshot = {
  commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  dirty: execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0,
};

const repositoryFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => !file.startsWith(".git/") && !file.startsWith("node_modules/") && !file.startsWith(".next/"));

const textFiles = repositoryFiles.filter((file) => !/\.(?:png|jpe?g|gif|webp|pdf|woff2?|ttf|ico)$/i.test(file));
const contents = new Map();
for (const file of textFiles) {
  try {
    await access(file);
    contents.set(file, await readFile(file, "utf8"));
  } catch {
    // Tracked files removed in the working tree are intentionally absent.
  }
}

const findings = [];
const pass = (check, evidence) => findings.push({ check, evidence, status: "pass" });
const warn = (check, evidence) => findings.push({ check, evidence, status: "warning" });
const fail = (check, evidence) => findings.push({ check, evidence, status: "fail" });

const repositoryEnvFiles = repositoryFiles.filter((file) => /(^|\/)\.env(?:\.|$)/.test(file) && file !== ".env.example");
if (repositoryEnvFiles.length === 0) pass("secrets", "Nenhum .env de ambiente versionado ou pendente foi encontrado.");
else fail("secrets", `Arquivos de ambiente versionados ou pendentes: ${repositoryEnvFiles.join(", ")}`);

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
if (secretHits.length === 0) pass("secrets", "Nenhum padrão de chave privada/token foi encontrado nos arquivos do repositório.");
else fail("secrets", `Possíveis segredos em: ${secretHits.join(", ")}`);

const publicEnv = contents.get(".env.example") ?? "";
if (!/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/.test(publicEnv)) {
  fail("public-environment", "A chave pública do Supabase não está documentada em .env.example.");
} else if (/NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|SERVICE|PASSWORD|TOKEN|PRIVATE|API_KEY)/.test(publicEnv)) {
  fail("public-environment", "Há uma variável sensível marcada como NEXT_PUBLIC_.");
} else {
  pass("public-environment", "Variáveis públicas não incluem service_role, senha ou tokens privados.");
}

const migrationFiles = repositoryFiles.filter((file) => file.startsWith("supabase/migrations/") && file.endsWith(".sql"));
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

const projectApiRoutes = repositoryFiles.filter((file) => /^app\/api\/projects\/.*\/route\.ts$/.test(file));
const unguardedProjectRoutes = projectApiRoutes.filter((file) => {
  const text = contents.get(file) ?? "";
  return !text.includes("authorizeProjectRoute") && !text.includes("authorizeOwnedProjectsRoute");
});
const legacyProjectRoutes = projectApiRoutes.filter((file) => (contents.get(file) ?? "").includes("requireAuthenticatedUser"));
if (unguardedProjectRoutes.length > 0) {
  fail("api-auth", `Rotas de projeto sem gate central: ${unguardedProjectRoutes.join(", ")}`);
} else if (legacyProjectRoutes.length > 0) {
  fail("api-auth", `Rotas de projeto ainda usam autenticação legada: ${legacyProjectRoutes.join(", ")}`);
} else {
  pass("api-auth", `${projectApiRoutes.length} rotas de projeto usam autorização central de ator, modo e relação.`);
}

const dangerousHtml = repositoryFiles.filter((file) => file !== "scripts/audit-security.mjs" && (contents.get(file) ?? "").includes("dangerouslySetInnerHTML"));
const rootPage = contents.get("app/page.tsx") ?? "";
const rootJsonLdIsSerialized =
  rootPage.includes('type="application/ld+json"') &&
  rootPage.includes("JSON.stringify(structuredData)") &&
  rootPage.includes("nonce={nonce}");
if (dangerousHtml.length === 1 && dangerousHtml[0] === "app/page.tsx" && rootJsonLdIsSerialized) {
  pass("xss", "Único uso de HTML bruto está limitado ao JSON-LD serializado e protegido por nonce da página pública.");
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

const securityProfile = contents.get(".specs/security/profile.md") ?? "";
const releaseGate = contents.get(".specs/security/release-gate.md") ?? "";
if (
  securityProfile.includes("S3_SENSITIVE")
  && securityProfile.includes("Ações que exigem autorização explícita")
  && releaseGate.includes("PASS_WITH_ACCEPTED_RISK")
  && releaseGate.includes("Aprovação técnica local não autoriza mutação remota")
) {
  pass("security-governance", "Perfil S3, riscos residuais, autoridade e gate de release estão documentados.");
} else {
  fail("security-governance", "Perfil de segurança ou gate de release está ausente/incompleto.");
}

const publicMutationControls = [
  "app/api/bug-reports/route.ts",
  "app/api/prompt-suggestions/route.ts",
  "app/api/support/route.ts",
];
const missingRateLimits = publicMutationControls.filter((file) => !(contents.get(file) ?? "").includes("checkRateLimit"));
if (missingRateLimits.length === 0) {
  pass("public-abuse-controls", "Relatos de bugs, sugestões e suporte aplicam limitação de taxa.");
} else {
  fail("public-abuse-controls", `Rotas públicas sem limitação de taxa: ${missingRateLimits.join(", ")}`);
}

const inboundRoute = contents.get("app/api/inbound/resend/route.ts") ?? "";
if (
  inboundRoute.includes("RESEND_WEBHOOK_SECRET")
  && inboundRoute.includes("webhooks.verify")
  && inboundRoute.includes("MAX_FORWARD_ATTACHMENT_BYTES")
) {
  pass("inbound-webhook", "Webhook de suporte exige assinatura e limita o volume agregado de anexos.");
} else {
  fail("inbound-webhook", "Assinatura ou limite de anexos do webhook de suporte não foi encontrado.");
}

const researchStarterRoute = contents.get("app/api/research-starter/reports/route.ts") ?? "";
if (researchStarterRoute.includes("requireAuthenticatedUser")) {
  pass("provider-auth", "Proxy do Research Starter exige usuário autenticado.");
} else {
  fail("provider-auth", "Proxy do Research Starter não contém guarda de autenticação.");
}

const bugRoute = contents.get("app/api/bug-reports/route.ts") ?? "";
const bugMigration = contents.get("supabase/migrations/20260821153000_create_bug_reports.sql") ?? "";
if (
  bugRoute.includes("MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024")
  && bugRoute.includes("image/png")
  && bugRoute.includes("safeFileName")
  && bugRoute.includes("upsert: false")
  && /values\s*\('bug-report-attachments',\s*'bug-report-attachments',\s*false\)/i.test(bugMigration)
  && bugMigration.includes("bug_report_attachments_select_owner_or_admin")
) {
  pass("private-upload", "Anexos de bugs são limitados, normalizados e armazenados em bucket privado com policy.");
} else {
  fail("private-upload", "Controles de tipo, tamanho, nome, bucket privado ou policy de anexos estão incompletos.");
}

const centralizedLoggers = new Set([
  "lib/observability/gemini-usage.ts",
  "lib/observability/request-context.ts",
]);
const directRuntimeLogs = repositoryFiles.filter((file) => (
  /^(?:app|lib|modules)\/.*\.(?:ts|tsx)$/.test(file)
  && !centralizedLoggers.has(file)
  && /console\.(?:error|warn|info)\s*\(/.test(contents.get(file) ?? "")
));
const requestLogger = contents.get("lib/observability/request-context.ts") ?? "";
if (
  directRuntimeLogs.length === 0
  && requestLogger.includes("logSanitizedOperationalFailure")
  && requestLogger.includes("SAFE_ERROR_CODE_PATTERN")
) {
  pass("log-privacy", "Logs de runtime passam pelos observadores com allowlist e classificação sanitizada de falhas.");
} else if (directRuntimeLogs.length > 0) {
  fail("log-privacy", `Logs diretos fora dos observadores centrais: ${directRuntimeLogs.join(", ")}`);
} else {
  fail("log-privacy", "O observador central não contém o sanitizador esperado.");
}

const robots = contents.get("app/robots.ts") ?? "";
const privateLayouts = ["app/dashboard/layout.tsx", "app/admin/bugs/page.tsx", "app/(auth)/layout.tsx"];
const privateMetadataNoindex = privateLayouts.every((file) => (contents.get(file) ?? "").includes("index: false"));
const privateHeaderPatterns = ["/login", "/auth/:path*", "/dashboard/:path*", "/admin/:path*"];
const privateHeadersNoindex =
  nextConfig.includes("X-Robots-Tag") &&
  nextConfig.includes("noindex, nofollow, noarchive") &&
  privateHeaderPatterns.every((pattern) => nextConfig.includes(pattern));
const crawlableNoindexRoutes = ["/dashboard/", "/admin/", "/login", "/auth/"].every((route) => !robots.includes(`"${route}"`));

if (privateMetadataNoindex && privateHeadersNoindex && crawlableNoindexRoutes) {
  pass("privacy-indexing", "Áreas privadas emitem noindex por metadata e cabeçalho, sem bloqueio contraditório no robots.txt.");
} else {
  fail("privacy-indexing", "Revisar metadata, X-Robots-Tag e crawlability das áreas privadas.");
}

warn("distributed-rate-limit", "O rate limit permanece em memória e é válido por instância; distribuição depende de uma futura decisão orientada por evidência.");
warn("attachment-malware-scan", "Anexos recebidos por e-mail são limitados, mas não passam por antivírus antes do encaminhamento interno.");
const explicitGrantManifest = contents.get("supabase/explicit-access-manifest.json") ?? "";
const explicitGrantVerifier = contents.get("scripts/verify-explicit-grants.mjs") ?? "";
const explicitGrantLocalGate = contents.get("scripts/verify-explicit-grants-local.sh") ?? "";
if (
  explicitGrantManifest.includes('"public.projects"')
  && explicitGrantManifest.includes('"public.user_profile_role_events"')
  && explicitGrantVerifier.includes("auditExplicitGrantRepository")
  && explicitGrantLocalGate.includes("verify-explicit-grants.sql")
) {
  pass("supabase-explicit-grants", "Oito tabelas, doze funções e ausência de views/sequences têm contrato local e gate PostgreSQL descartável.");
} else {
  fail("supabase-explicit-grants", "Manifesto ou verificadores locais de grants explícitos estão ausentes/incompletos.");
}
warn("remote-verification", "Verificação RLS remota, restore e fluxo E2E dependem de credenciais e execução operacional; não são inferidos por esta auditoria estática.");

const failures = findings.filter((finding) => finding.status === "fail");
const warnings = findings.filter((finding) => finding.status === "warning");
const result = failures.length > 0
  ? "BLOCKED"
  : warnings.length > 0
    ? "PASS_WITH_ACCEPTED_RISK"
    : "PASS";
console.log(JSON.stringify({
  classification,
  filesScanned: repositoryFiles.length,
  findings,
  generatedAt: new Date().toISOString(),
  result,
  snapshot,
}, null, 2));
if (failures.length > 0) process.exitCode = 1;
