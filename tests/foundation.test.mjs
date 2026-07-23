import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("keeps the branded foundation and locale in the App Router", async () => {
  const [layout, page] = await Promise.all([
    readProjectFile("app/layout.tsx"),
    readProjectFile("app/page.tsx"),
  ]);

  assert.match(layout, /<html lang="pt-BR"/);
  assert.match(layout, /title: "Mapa da Pesquisa"/);
  assert.match(page, /O que você quer desenvolver\?/);
  assert.doesNotMatch(page, /Comece pela ideia/);
  assert.match(page, /PublicStartForm/);
});

test("requests login only after the public central execution", async () => {
  const [home, publicStart, loginPage, authActions, quickStart] = await Promise.all([
    readProjectFile("app/page.tsx"),
    readProjectFile("modules/projects/public-start-form.tsx"),
    readProjectFile("app/(auth)/login/page.tsx"),
    readProjectFile("modules/auth/actions.ts"),
    readProjectFile("modules/projects/quick-start-form.tsx"),
  ]);

  assert.doesNotMatch(home, /href="\/login"/);
  assert.match(publicStart, /sessionStorage\.setItem/);
  assert.match(publicStart, /login\?next=/);
  assert.match(loginPage, /hiddenFields/);
  assert.match(loginPage, /Continuar com Google/);
  assert.match(authActions, /readSafeDestination/);
  assert.match(authActions, /signInWithOAuth/);
  assert.match(authActions, /provider: "google"/);
  assert.match(quickStart, /requestSubmit/);
});

test("suggests AI refinements while the research request is being written", async () => {
  const [input, route, gemini] = await Promise.all([
    readProjectFile("modules/projects/research-prompt-input.tsx"),
    readProjectFile("app/api/prompt-suggestions/route.ts"),
    readProjectFile("modules/generation/gemini.ts"),
  ]);

  assert.match(input, /Crie um roteiro de tese de mestrado/);
  assert.match(input, /650/);
  assert.match(input, /Sugestões para consolidar o mapa/);
  assert.match(input, /Tema/);
  assert.match(input, /Formulação/);
  assert.match(route, /suggestResearchPrompts/);
  assert.match(gemini, /exatamente 3 sugestões curtas/);
  assert.match(gemini, /Não invente instituições/);
});

test("completes Change 004 with a versioned canonical schema and anti-hallucination prompt", async () => {
  const [schema, prompt, spec] = await Promise.all([
    readProjectFile("modules/generation/schema.ts"),
    readProjectFile("modules/generation/prompts/structure-v1.ts"),
    readProjectFile(".specs/changes/004-implement-core-feature-2/spec.md"),
  ]);

  assert.match(schema, /RESEARCH_STRUCTURE_SCHEMA_VERSION = "1\.0\.0"/);
  assert.match(schema, /z\.array\(researchChapterSchema\)\.length\(REQUIRED_CHAPTERS\.length\)/);
  assert.equal((schema.match(/"Introdução"|"Revisão da Literatura"|"Metodologia Científica"|"Desenvolvimento da Pesquisa"|"Conclusões"/g) ?? []).length, 5);
  assert.match(prompt, /Não invente referências, citações, dados, resultados ou conclusões empíricas/);
  assert.match(spec, /Status: concluída/);
});

test("implements an idempotent and owner-scoped generation pipeline", async () => {
  const [route, gemini, migration] = await Promise.all([
    readProjectFile("app/api/projects/[id]/generate/route.ts"),
    readProjectFile("modules/generation/gemini.ts"),
    readProjectFile("supabase/migrations/20260723003616_create_generation_workspace.sql"),
  ]);

  assert.match(route, /idempotencyKey/);
  assert.match(route, /maxReferences: 20/);
  assert.match(route, /interpretResearchRequest/);
  assert.match(route, /keywordOverrides/);
  assert.match(route, /topic: interpreted\.researchQuery/);
  assert.match(route, /project\.status !== "failed"/);
  assert.match(route, /research_starter_retry_broader_interval/);
  assert.match(route, /kind: "last-10-years"/);
  assert.match(route, /knowledge_area: knowledgeArea/);
  assert.match(route, /report\.references\.length === 0/);
  assert.match(route, /title: structure\.title/);
  assert.match(route, /A geração falhou sem alterar a estrutura salva/);
  assert.match(gemini, /Output\.object/);
  assert.match(gemini, /generatedStructureSchema/);
  assert.match(gemini, /interpretedResearchRequestSchema/);
  assert.match(gemini, /consulta temática para busca bibliográfica em inglês/);
  assert.match(gemini, /knowledgeAreaProposed/);
  assert.match(gemini, /proponha a mais adequada/);
  assert.match(gemini, /substituem o foco anterior da pesquisa/);
  assert.match(gemini, /replacementFocus/);
  assert.match(gemini, /Remova instruções operacionais/);
  assert.match(gemini, /title: REQUIRED_CHAPTERS\[chapterIndex\]/);
  assert.match(gemini, /thinkingBudget: 0/);
  assert.match(gemini, /validateReferenceIds/);
  assert.match(migration, /unique \(owner_id, idempotency_key\)/);
  assert.equal((migration.match(/create policy/g) ?? []).length, 8);
  assert.match(migration, /alter table public\.research_structures enable row level security/);
});

test("provides persistent editing with loss protection and retry", async () => {
  const [workspace, saveRoute] = await Promise.all([
    readProjectFile("modules/generation/generation-workspace.tsx"),
    readProjectFile("app/api/projects/[id]/generation/route.ts"),
  ]);

  assert.match(workspace, /beforeunload/);
  assert.match(workspace, /Regenerar substituirá a versão salva/);
  assert.match(workspace, /Otimizar literatura/);
  assert.match(workspace, /keywords: keywordOverrides/);
  assert.match(workspace, /OK e regenerar/);
  assert.match(workspace, /generation-save-button/);
  assert.match(workspace, /Tentar novamente/);
  assert.match(workspace, /: "Salvar"/);
  assert.match(workspace, /reference-code/);
  assert.match(workspace, /router\.refresh\(\)/);
  assert.doesNotMatch(workspace, /Change 004 · geração e editor/);
  assert.match(saveRoute, /editableResearchStructureSchema/);
  assert.match(saveRoute, /validateReferenceIds/);
});

test("exports only the authenticated owner's saved structure as DOCX and PDF", async () => {
  const [route, docx, pdf, workspace] = await Promise.all([
    readProjectFile("app/api/projects/[id]/exports/[format]/route.ts"),
    readProjectFile("modules/export/docx.ts"),
    readProjectFile("modules/export/pdf.ts"),
    readProjectFile("modules/generation/generation-workspace.tsx"),
  ]);

  assert.match(route, /\.eq\("owner_id", userId\)/);
  assert.match(route, /private, no-store/);
  assert.match(route, /Content-Disposition/);
  assert.match(route, /loadGenerationSnapshot/);
  assert.match(docx, /Revisar antes do uso/);
  assert.match(docx, /Referências verificadas/);
  assert.match(docx, /Referências otimizadas com/);
  assert.match(pdf, /bufferPages: true/);
  assert.match(pdf, /Referências verificadas/);
  assert.match(pdf, /Referências otimizadas com Research Starter/);
  assert.match(workspace, /Exportar DOCX/);
  assert.match(workspace, /Salve as alterações antes de exportar/);
});

test("keeps the Research Starter key server-side and follows its v1 contract", async () => {
  const [client, route, verification, environment] = await Promise.all([
    readProjectFile("modules/research-starter/client.ts"),
    readProjectFile("app/api/research-starter/reports/route.ts"),
    readProjectFile("scripts/verify-research-starter.mjs"),
    readProjectFile(".env.example"),
  ]);

  assert.match(client, /import "server-only"/);
  assert.match(client, /RESEARCH_STARTER_API_KEY/);
  assert.match(client, /\/api\/v1\/reports/);
  assert.match(route, /requireAuthenticatedUser/);
  assert.match(route, /publicationInterval: \{ kind: interval \}/);
  assert.match(verification, /maxReferences: 3/);
  assert.match(environment, /^RESEARCH_STARTER_API_KEY=$/m);
  assert.doesNotMatch(environment, /NEXT_PUBLIC_RESEARCH_STARTER/);
});

test("defines an uncached health endpoint", async () => {
  const route = await readProjectFile("app/api/health/route.ts");

  assert.match(route, /export function GET/);
  assert.match(route, /status: "ok"/);
  assert.match(route, /"Cache-Control": "no-store"/);
});

test("uses the standard Next.js runtime expected by Vercel", async () => {
  const manifest = JSON.parse(await readProjectFile("package.json"));

  assert.equal(manifest.scripts.dev, "next dev");
  assert.equal(manifest.scripts.build, "next build");
  assert.equal(manifest.scripts.start, "next start");
  assert.equal(manifest.dependencies.vinext, undefined);
  assert.equal(manifest.devDependencies?.wrangler, undefined);
});

test("pins Supabase to the Mapa project and requires a publishable key", async () => {
  const [config, environment] = await Promise.all([
    readProjectFile("lib/supabase/config.ts"),
    readProjectFile(".env.example"),
  ]);

  assert.match(config, /aeaweherkrqmlqnxsmib/);
  assert.match(config, /sb_publishable_/);
  assert.doesNotMatch(
    environment,
    /^(?:SUPABASE_SERVICE_ROLE_KEY|.*=sb_secret_)/m,
  );
  assert.match(environment, /NEXT_PUBLIC_SUPABASE_PROJECT_REF=aeaweherkrqmlqnxsmib/);
});

test("defines an owner-scoped projects schema with RLS", async () => {
  const migration = await readProjectFile(
    "supabase/migrations/20260722013741_create_projects_foundation.sql",
  );

  assert.match(migration, /owner_id uuid not null references auth\.users/);
  assert.match(migration, /alter table public\.projects enable row level security/);
  assert.match(migration, /revoke all on table public\.projects from anon/);
  assert.equal((migration.match(/create policy/g) ?? []).length, 4);
  assert.match(migration, /with check \(\(select auth\.uid\(\)\).*owner_id\)/s);
  assert.doesNotMatch(migration, /auth\.role\(\)|security definer/i);
});

test("protects the dashboard beyond the auth proxy", async () => {
  const [dashboard, projectAuth, proxy, authActions, recoveryPage] = await Promise.all([
    readProjectFile("app/dashboard/page.tsx"),
    readProjectFile("modules/projects/auth.ts"),
    readProjectFile("lib/supabase/proxy.ts"),
    readProjectFile("modules/auth/actions.ts"),
    readProjectFile("app/(auth)/forgot-password/page.tsx"),
  ]);

  assert.match(proxy, /auth\.getClaims\(\)/);
  assert.match(dashboard, /requireAuthenticatedUser\(\)/);
  assert.match(projectAuth, /auth\.getClaims\(\)/);
  assert.match(projectAuth, /redirect\("\/login"\)/);
  assert.match(authActions, /signInWithPassword/);
  assert.match(authActions, /resetPasswordForEmail/);
  assert.match(authActions, /Se o e-mail estiver cadastrado/);
  assert.match(recoveryPage, /caso o e-mail pertença a uma conta/);
});

test("sanitizes auth callback destinations", async () => {
  const callback = await readProjectFile("app/auth/callback/route.ts");

  assert.match(callback, /startsWith\("\/"\)/);
  assert.match(callback, /!value\.startsWith\("\/\/"\)/);
  assert.match(callback, /exchangeCodeForSession/);
});

test("derives project ownership from verified claims", async () => {
  const [actions, projectAuth] = await Promise.all([
    readProjectFile("modules/projects/actions.ts"),
    readProjectFile("modules/projects/auth.ts"),
  ]);

  assert.match(projectAuth, /auth\.getClaims\(\)/);
  assert.match(projectAuth, /claims\?\.sub/);
  assert.match(actions, /owner_id: userId/);
  assert.match(actions, /interpretResearchRequest/);
  assert.match(actions, /title: interpreted\.title/);
  assert.match(actions, /knowledgeAreaProposed/);
  assert.match(actions, /Área proposta:/);
  assert.doesNotMatch(actions, /formData\.get\("owner/i);
  assert.match(actions, /\.eq\("owner_id", userId\)/);
});

test("implements duplicate and confirmed soft-delete operations", async () => {
  const actions = await readProjectFile("modules/projects/actions.ts");

  assert.match(actions, /status: "draft"/);
  assert.match(actions, /confirmDelete/);
  assert.match(actions, /deleted_at: now/);
  assert.match(actions, /\.is\("deleted_at", null\)/);
  assert.doesNotMatch(actions, /\.delete\(\)/);
});

test("validates project fields against database limits", async () => {
  const [validation, form, actions] = await Promise.all([
    readProjectFile("modules/projects/validation.ts"),
    readProjectFile("modules/projects/project-form.tsx"),
    readProjectFile("modules/projects/actions.ts"),
  ]);

  assert.match(validation, /FIELD_LIMITS\.title/);
  assert.match(validation, /keywords\.length > 12/);
  assert.match(validation, /problemStatement: 5000/);
  assert.match(validation, /knowledgeArea: 120/);
  assert.match(validation, /fieldErrors\.problemStatement/);
  assert.match(actions, /values: result\.values/);
  assert.match(form, /setCustomValidity/);
  assert.match(form, /aria-invalid/);
  assert.match(form, /beforeunload/);
  assert.match(form, /Descartar alterações não salvas/);
});

test("implements the approved hybrid dashboard with prompt-first automatic generation", async () => {
  const [dashboard, quickStart, generation, visualDecision, loading, error] = await Promise.all([
    readProjectFile("app/dashboard/page.tsx"),
    readProjectFile("modules/projects/quick-start-form.tsx"),
    readProjectFile("modules/generation/generation-workspace.tsx"),
    readProjectFile(".specs/changes/002-implement-mvp-foundation/subchanges/002.5-polish-responsive-shell.md"),
    readProjectFile("app/dashboard/loading.tsx"),
    readProjectFile("app/dashboard/error.tsx"),
  ]);

  assert.match(dashboard, /Qual seu tema de pesquisa\?/);
  assert.match(dashboard, /Projetos recentes/);
  assert.match(dashboard, /DashboardProjectGrid/);
  assert.match(quickStart, /useActionState/);
  assert.match(quickStart, /createProject/);
  assert.doesNotMatch(quickStart, /Abrir configurações iniciais/);
  assert.match(quickStart, /autoGenerate/);
  assert.match(generation, /Buscando literatura no/);
  assert.match(generation, /Research Starter/);
  assert.match(visualDecision, /\[x\] Híbrida/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(error, /Tentar novamente/);
});

test("supports anchored project actions and owner-scoped AI integration", async () => {
  const [grid, card, route, gemini, layout, accountMenu] = await Promise.all([
    readProjectFile("modules/projects/dashboard-project-grid.tsx"),
    readProjectFile("modules/projects/project-card-modal.tsx"),
    readProjectFile("app/api/projects/integrate/route.ts"),
    readProjectFile("modules/generation/gemini.ts"),
    readProjectFile("app/dashboard/layout.tsx"),
    readProjectFile("modules/auth/account-menu.tsx"),
  ]);

  assert.match(grid, /Selecione projetos para integrar/);
  assert.match(grid, /\/api\/projects\/integrate/);
  assert.match(card, /getBoundingClientRect/);
  assert.match(card, /createPortal/);
  assert.match(card, /event\.key === "Escape"/);
  assert.match(card, /document\.addEventListener\("pointerdown", close\)/);
  assert.doesNotMatch(card, /project-card-open/);
  assert.match(card, />Abrir</);
  assert.match(card, />Excluir</);
  assert.match(route, /\.eq\("owner_id", userId\)/);
  assert.match(route, /projectIds\.length < 2 \|\| projectIds\.length > 4/);
  assert.match(route, /mergeResearchStructures/);
  assert.match(gemini, /Integre os mapas fornecidos/);
  assert.match(layout, />Dashboard</);
  assert.match(layout, /AccountMenu/);
  assert.match(accountMenu, /document\.addEventListener\("pointerdown", closeOutside\)/);
  assert.match(accountMenu, /event\.key === "Escape"/);
});

test("uses the approved dark silver authentication shell", async () => {
  const [authLayout, styles] = await Promise.all([
    readProjectFile("app/(auth)/layout.tsx"),
    readProjectFile("app/globals.css"),
  ]);

  assert.match(authLayout, /auth-intro-copy/);
  assert.match(authLayout, /Da primeira pergunta ao seu mapa de pesquisa/);
  assert.match(styles, /\.auth-shell \{[^}]*background: #08090b/s);
  assert.match(styles, /linear-gradient\(125deg, #ffffff/);
});

test("keeps authenticated Supabase usage within the free-plan budget", async () => {
  const [dashboard, projectPage, projectAuth, architecture] = await Promise.all([
    readProjectFile("app/dashboard/page.tsx"),
    readProjectFile("app/dashboard/projects/[id]/page.tsx"),
    readProjectFile("modules/projects/auth.ts"),
    readProjectFile(".specs/shared/architecture.md"),
  ]);

  assert.match(dashboard, /\.limit\(12\)/);
  assert.doesNotMatch(projectPage, /\.select\("\*"\)/);
  assert.match(projectAuth, /cache\(async function requireAuthenticatedUser/);
  assert.match(architecture, /Supabase Free/);
  assert.match(architecture, /paginação por cursor/);
});

test("provides a two-user authenticated RLS verification without admin keys", async () => {
  const verification = await readProjectFile("scripts/verify-authenticated-rls.mjs");

  assert.match(verification, /TEST_USER_A_EMAIL/);
  assert.match(verification, /TEST_USER_B_EMAIL/);
  assert.match(verification, /RLS permitiu leitura entre proprietários/);
  assert.match(verification, /RLS permitiu atualização entre proprietários/);
  assert.match(verification, /RLS permitiu exclusão entre proprietários/);
  assert.doesNotMatch(verification, /service.role|sb_secret_|SUPABASE_SECRET/i);
});

test("validates the migration locally without a paid Supabase branch", async () => {
  const [script, architecture] = await Promise.all([
    readProjectFile("scripts/verify-migration-local.sh"),
    readProjectFile(".specs/shared/architecture.md"),
  ]);

  assert.match(script, /postgres:17-alpine/);
  assert.match(script, /1\|4\|1\|2\|8\|3/);
  assert.match(script, /trap cleanup/);
  assert.match(architecture, /sem branches pagas/);
});
