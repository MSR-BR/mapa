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
  assert.match(page, /Vamos construir o mapa da sua pesquisa\?/);
  assert.match(page, /Defina e organize os tópicos fundamentais da pesquisa/);
  assert.doesNotMatch(page, /Comece pela ideia/);
  assert.match(page, /PublicStartForm/);
  assert.match(page, /auth\/callback\?code=/);
  assert.match(page, /dashboard\?resume=1/);
});

test("requests login only after the public central execution", async () => {
  const [home, publicStart, loginPage, signupPage, authActions, quickStart, legalContent, legalLinks, dashboard, supportRoute, profileStorage] = await Promise.all([
    readProjectFile("app/page.tsx"),
    readProjectFile("modules/projects/public-start-form.tsx"),
    readProjectFile("app/(auth)/login/page.tsx"),
    readProjectFile("app/(auth)/signup/page.tsx"),
    readProjectFile("modules/auth/actions.ts"),
    readProjectFile("modules/projects/quick-start-form.tsx"),
    readProjectFile("modules/legal/legal-content.ts"),
    readProjectFile("modules/legal/legal-links.tsx"),
    readProjectFile("app/dashboard/page.tsx"),
    readProjectFile("app/api/support/route.ts"),
    readProjectFile("modules/profile/storage.ts"),
  ]);

  assert.doesNotMatch(home, /href="\/login"/);
  assert.match(publicStart, /localStorage\.setItem/);
  assert.match(publicStart, /savedAt: Date\.now\(\)/);
  assert.match(publicStart, /login\?next=/);
  assert.match(publicStart, /Mapa Avançado/);
  assert.match(publicStart, /Mapa Rápido/);
  assert.match(publicStart, /public-mode-card-advanced/);
  assert.match(publicStart, /public-mode-card-quick/);
  assert.match(publicStart, /useState<"quick" \| "advanced">\("advanced"\)/);
  assert.match(publicStart, /ResearchPromptInput/);
  assert.match(loginPage, /hiddenFields/);
  assert.match(loginPage, /Continuar com Google/);
  assert.match(loginPage, /signup\?next=/);
  assert.match(signupPage, /hiddenFields/);
  assert.match(signupPage, /login\?next=/);
  assert.match(authActions, /readSafeDestination/);
  assert.match(authActions, /emailRedirectTo:.*encodeURIComponent\(next\)/);
  assert.match(authActions, /signInWithOAuth/);
  assert.match(authActions, /provider: "google"/);
  assert.match(await readProjectFile("app/auth/callback/route.ts"), /error=google/);
  assert.match(quickStart, /requestSubmit/);
  assert.match(quickStart, /PENDING_PROJECT_MAX_AGE_MS/);
  assert.match(quickStart, /pendingDraftRead/);
  assert.match(quickStart, /hasResearchProductType/);
  assert.match(quickStart, /Roteiro rápido/);
  assert.match(quickStart, /Construção avançada/);
  assert.match(quickStart, /canResume/);
  assert.match(dashboard, /canResume=\{profile\.hasLegalConsent\}/);
  assert.match(legalContent, /com apoio do orientador/);
  assert.match(legalContent, /no uso do aplicativo/);
  assert.match(legalContent, /Como estudante/);
  assert.match(legalContent, /Como orientador/);
  assert.match(legalContent, /Research Starter/);
  assert.match(legalContent, /até 30 dias/);
  assert.match(profileStorage, /terms_version === LEGAL_TERMS_VERSION/);
  assert.match(legalLinks, /Sérgio França/);
  assert.match(legalLinks, /Escola de Engenharia/);
  assert.match(legalLinks, /aria-labelledby="legal-dialog-title"/);
  assert.match(legalLinks, /closeOnEscape/);
  assert.match(legalLinks, /Universidade Federal Fluminense/);
  assert.match(legalLinks, /\/brand\/uff-logo\.png/);
  assert.match(supportRoute, /marioreis@id\.uff\.br/);
  assert.match(supportRoute, /sfranca@id\.uff\.br/);
  assert.match(supportRoute, /to: SUPPORT_RECIPIENTS/);
  assert.match(quickStart, /if \(!fresh\) localStorage\.removeItem/);
  assert.doesNotMatch(quickStart, /localStorage\.removeItem\(PENDING_PROJECT_KEY\);\n    }\n  } catch/);
  assert.match(await readProjectFile("modules/projects/pending-project-cleanup.tsx"), /successful project page|localStorage\.removeItem/);
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
  assert.match(input, /MINIMUM_SUGGESTION_LENGTH = 8/);
  assert.match(input, /buildLocalPromptSuggestions/);
  assert.match(input, /Tema/);
  assert.match(input, /Formulação/);
  assert.match(input, /Recorte/);
  assert.match(route, /suggestResearchPrompts/);
  assert.match(gemini, /exatamente 3 sugestões curtas/);
  assert.match(gemini, /terceira sugestão de recorte/);
  assert.match(gemini, /Não invente instituições/);
});

test("makes proposal discovery resilient to Research Starter and Gemini deviations", async () => {
  const [route, service, client, workspace, version] = await Promise.all([
    readProjectFile("app/api/projects/[id]/discover/route.ts"),
    readProjectFile("modules/research-workflow/discovery-service.ts"),
    readProjectFile("modules/research-starter/client.ts"),
    readProjectFile("modules/research-workflow/proposal-discovery-workspace.tsx"),
    readProjectFile("lib/app-version.ts"),
  ]);

  assert.match(route, /preservedBriefing/);
  assert.match(route, /briefing-too-short/);
  assert.match(route, /proposal-shape-invalid/);
  assert.match(route, /research-starter-unavailable/);
  assert.match(route, /gemini-quota-exhausted/);
  assert.match(service, /normalizeReferences/);
  assert.match(service, /safeUrl/);
  assert.match(service, /DISCOVERY_DEADLINE_MS/);
  assert.match(service, /broadenResearchQuery/);
  assert.match(service, /prepayment credits are depleted/);
  assert.match(client, /DEFAULT_MAX_ATTEMPTS/);
  assert.match(client, /AbortSignal\.timeout/);
  assert.match(client, /temporary-unavailable/);
  assert.match(workspace, /Seu briefing continua salvo/);
  assert.match(workspace, /AbortSignal\.timeout\(110_000\)/);
  assert.match(version, /v\d{8}\.\d+/);
});

test("registers Change 044 production pipeline verification", async () => {
  const [roadmap, spec, evidence, packageJson, version] = await Promise.all([
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/044-production-pipeline-verification/spec.md"),
    readProjectFile(".specs/changes/044-production-pipeline-verification/closure-evidence.md"),
    readProjectFile("package.json"),
    readProjectFile("lib/app-version.ts"),
  ]);

  assert.match(roadmap, /044 \| Validação final do pipeline Gemini \+ Research Starter \| Concluída/);
  assert.match(spec, /exact/);
  assert.match(spec, /supabase:verify-advisor-student/);
  assert.match(evidence, /v23082026\.3/);
  assert.match(packageJson, /research-proposals:verify/);
  assert.match(packageJson, /server-only/);
  assert.match(version, /v\d{8}\.\d+/);
});

test("registers Change 045 observability and maintenance controls", async () => {
  const [roadmap, spec, evidence, operations, health, proxy, logger, version] = await Promise.all([
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/045-observability-post-pilot/spec.md"),
    readProjectFile(".specs/changes/045-observability-post-pilot/closure-evidence.md"),
    readProjectFile("docs/operations.md"),
    readProjectFile("app/api/health/route.ts"),
    readProjectFile("proxy.ts"),
    readProjectFile("lib/observability/request-context.ts"),
    readProjectFile("lib/app-version.ts"),
  ]);

  assert.match(roadmap, /045 \| Observabilidade e manutenção pós-piloto \| Concluída/);
  assert.match(spec, /x-request-id/);
  assert.match(evidence, /sanitizados/);
  assert.match(operations, /Change 045/);
  assert.match(health, /X-Health-Status/);
  assert.match(proxy, /attachRequestId/);
  assert.match(logger, /SAFE_LOG_FIELDS/);
  assert.match(version, /v\d{8}\.\d+/);
});

test("registers Change 046 academic PDF format and CBL registration", async () => {
  const [roadmap, spec, evidence, pdf, route, asset, version] = await Promise.all([
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/046-final-pdf-format/spec.md"),
    readProjectFile(".specs/changes/046-final-pdf-format/closure-evidence.md"),
    readProjectFile("modules/export/pdf.ts"),
    readProjectFile("app/api/projects/[id]/exports/[format]/route.ts"),
    readProjectFile("public/brand/cbl-isbn-barcode.jpeg").catch(() => ""),
    readProjectFile("lib/app-version.ts"),
  ]);

  assert.match(roadmap, /046 \| PDF final conforme modelo acadêmico e registro CBL \| Concluída/);
  assert.match(spec, /REFERÊNCIAS/);
  assert.match(spec, /978-65-01-44943-2/);
  assert.match(evidence, /8 páginas/);
  assert.match(pdf, /1 INTRODUÇÃO/);
  assert.match(pdf, /5 CONCLUSÃO E RECOMENDAÇÕES PARA FUTURAS PESQUISAS/);
  assert.match(pdf, /cbl-isbn-barcode\.jpeg/);
  assert.match(pdf, /mapadapesquisa\.com\.br/);
  assert.match(route, /Exportação em Word está temporariamente indisponível/);
  assert.equal(asset.length > 0, true);
  assert.match(version, /v\d{8}\.\d+/);
});

test("uses the structured situation-problem intake and product-depth guidance", async () => {
  const [intakeSchema, guidance, action, gemini] = await Promise.all([
    readProjectFile("modules/projects/research-intake.ts"),
    readProjectFile("modules/research-workflow/research-level-guidance.ts"),
    readProjectFile("modules/projects/actions.ts"),
    readProjectFile("modules/generation/gemini.ts"),
  ]);

  for (const field of ["problemContext", "observedSituation", "discrepancyConsequences", "existingKnowledgeGap", "delimitationQuestion"]) {
    assert.match(intakeSchema, new RegExp(field));
  }
  for (const product of ["TCC / Graduação", "Monografia / Especialização", "Dissertação / Mestrado", "Tese / Doutorado", "Artigo de evento acadêmico", "Artigo de periódico de alto impacto"]) {
    assert.match(guidance, new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(action, /intakeJson/);
  assert.match(action, /legacyPromptMode/);
  assert.match(gemini, /researchGuidance/);
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

test("implements the additive Change 009 workflow foundation", async () => {
  const [schema, stateMachine, storage, migration] = await Promise.all([
    readProjectFile("modules/research-workflow/schema.ts"),
    readProjectFile("modules/research-workflow/state-machine.ts"),
    readProjectFile("modules/research-workflow/storage.ts"),
    readProjectFile("supabase/migrations/20260807225154_create_research_workflow_v2_foundation.sql"),
  ]);

  assert.match(schema, /RESEARCH_WORKFLOW_SCHEMA_VERSION = "2\.0\.0"/);
  assert.match(schema, /draft_prompt/);
  assert.match(schema, /coherenceFindingSchema/);
  assert.match(schema, /traceLinkSchema/);
  assert.match(stateMachine, /allowedTransitions/);
  assert.match(stateMachine, /collectDependentElementTypes/);
  assert.match(storage, /import "server-only"/);
  assert.match(storage, /\.eq\("owner_id", ownerId\)/);
  assert.match(migration, /add column workflow_version smallint not null default 1/);
  assert.match(migration, /foreign key \(project_id, owner_id\)/);
  assert.match(migration, /alter table public\.research_workflows enable row level security/);
  assert.equal((migration.match(/create policy/g) ?? []).length, 4);
  assert.doesNotMatch(migration, /auth\.role\(\)|security definer/i);
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
  assert.match(route, /broadenResearchQuery/);
  assert.match(route, /research_starter_retry_broader_query/);
  assert.match(gemini, /Remova tipos de documento, grau acadêmico/);
  assert.match(gemini, /doctoral thesis, dissertation, alignment ou compliance/);
  assert.match(gemini, /searchTerms/);
  assert.match(gemini, /Não acrescente sinônimos/);
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

test("exports only the authenticated owner's saved structure as PDF", async () => {
  const [route, pdf, workspace, finalWorkspace, citationHelper, prompt, styles] = await Promise.all([
    readProjectFile("app/api/projects/[id]/exports/[format]/route.ts"),
    readProjectFile("modules/export/pdf.ts"),
    readProjectFile("modules/generation/generation-workspace.tsx"),
    readProjectFile("modules/research-workflow/final-map-workspace.tsx"),
    readProjectFile("modules/research-workflow/reference-citations.ts"),
    readProjectFile("modules/generation/prompts/structure-v1.ts"),
    readProjectFile("app/globals.css"),
  ]);

  assert.match(route, /\.eq\("owner_id", userId\)/);
  assert.match(route, /format === "docx"/);
  assert.match(route, /temporariamente indisponível/);
  assert.match(route, /private, no-store/);
  assert.match(route, /Content-Disposition/);
  assert.match(route, /loadGenerationSnapshot/);
  assert.match(pdf, /bufferPages: true/);
  assert.match(pdf, /Referências verificadas/);
  assert.match(pdf, /Referências otimizadas com Research Starter/);
  assert.match(pdf, /Escopo do produto acadêmico/);
  assert.match(pdf, /Impactos potenciais/);
  assert.match(pdf, /Oportunidades derivadas da literatura/);
  assert.match(pdf, /withCitationMarkers/);
  assert.match(pdf, /literatureExpansionText/);
  assert.match(citationHelper, /R\$\{String\(index \+ 1\)\.padStart\(2, "0"\)\}/);
  assert.match(finalWorkspace, /literature-draft-text/);
  assert.match(finalWorkspace, /router\.push\("\/dashboard"\)/);
  assert.match(prompt, /Revisão da Literatura, escreva texto corrido/);
  assert.doesNotMatch(workspace, /Exportar DOCX/);
  assert.doesNotMatch(finalWorkspace, /Exportar DOCX/);
  assert.match(workspace, /Salve as alterações antes de exportar/);
  assert.match(styles, /\.final-export-panel \{[^}]*linear-gradient\(145deg, #17221e, #0c1210\)/);
  assert.match(styles, /\.final-export-panel a \{[^}]*linear-gradient\(135deg, #f5fff9, #b9d6ca\)/);
  assert.match(styles, /\.final-export-panel a:hover \{[^}]*transform: translateY\(-1px\)/);
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
  assert.match(route, /status,/);
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
  const [dashboard, projectAuth, proxy, proxyEntry, authActions, recoveryPage, confirmRoute] = await Promise.all([
    readProjectFile("app/dashboard/page.tsx"),
    readProjectFile("modules/projects/auth.ts"),
    readProjectFile("lib/supabase/proxy.ts"),
    readProjectFile("proxy.ts"),
    readProjectFile("modules/auth/actions.ts"),
    readProjectFile("app/(auth)/forgot-password/page.tsx"),
    readProjectFile("app/auth/confirm/route.ts"),
  ]);

  assert.match(proxy, /auth\.getClaims\(\)/);
  assert.match(proxyEntry, /_next\/static/);
  assert.match(dashboard, /requireAuthenticatedUser\(\)/);
  assert.match(projectAuth, /auth\.getClaims\(\)/);
  assert.match(projectAuth, /redirect\("\/login"\)/);
  assert.match(authActions, /signInWithPassword/);
  assert.match(authActions, /resetPasswordForEmail/);
  assert.match(authActions, /auth\/confirm\?type=recovery/);
  assert.match(authActions, /Se o e-mail estiver cadastrado/);
  assert.match(recoveryPage, /caso o e-mail pertença a uma conta/);
  assert.match(confirmRoute, /verifyOtp/);
  assert.match(confirmRoute, /safeNext/);
});

test("sanitizes auth callback destinations", async () => {
  const callback = await readProjectFile("app/auth/callback/route.ts");

  assert.match(callback, /startsWith\("\/"\)/);
  assert.match(callback, /!value\.startsWith\("\/\/"\)/);
  assert.match(callback, /exchangeCodeForSession/);
});

test("documents the canonical authentication callback required in production", async () => {
  const operations = await readProjectFile("docs/operations.md");

  assert.match(operations, /NEXT_PUBLIC_APP_URL.*https:\/\/mapadapesquisa\.com\.br/);
  assert.match(operations, /Site URL no Supabase Auth.*https:\/\/mapadapesquisa\.com\.br/);
  assert.match(operations, /Redirect URL permitida.*https:\/\/mapadapesquisa\.com\.br\/auth\/callback/);
});

test("derives project ownership from verified claims", async () => {
  const [actions, projectAuth] = await Promise.all([
    readProjectFile("modules/projects/actions.ts"),
    readProjectFile("modules/projects/auth.ts"),
  ]);

  assert.match(projectAuth, /auth\.getClaims\(\)/);
  assert.match(projectAuth, /claims\?\.sub/);
  assert.match(actions, /owner_id: userId/);
  assert.match(actions, /createResearchWorkflow/);
  assert.match(actions, /isResearchMapV2EnabledForClaims/);
  assert.match(actions, /workflow_version: useResearchMapV2 \? 2 : 1/);
  assert.match(actions, /Nova proposta de pesquisa/);
  assert.doesNotMatch(actions, /formData\.get\("owner/i);
  assert.match(actions, /\.eq\("owner_id", userId\)/);
});

test("implements duplicate and confirmed soft-delete operations", async () => {
  const actions = await readProjectFile("modules/projects/actions.ts");

  assert.match(actions, /status: "draft"/);
  assert.match(actions, /duplicateResearchWorkflow/);
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

test("implements the approved hybrid dashboard with prompt-first proposal discovery", async () => {
  const [home, dashboard, quickStart, discovery, visualDecision, loading, error] = await Promise.all([
    readProjectFile("app/page.tsx"),
    readProjectFile("app/dashboard/page.tsx"),
    readProjectFile("modules/projects/quick-start-form.tsx"),
    readProjectFile("modules/research-workflow/proposal-discovery-workspace.tsx"),
    readProjectFile(".specs/changes/002-implement-mvp-foundation/subchanges/002.5-polish-responsive-shell.md"),
    readProjectFile("app/dashboard/loading.tsx"),
    readProjectFile("app/dashboard/error.tsx"),
  ]);

  assert.match(home, /redirect\("\/dashboard\?continue=1"\)/);
  assert.match(dashboard, /Vamos construir o mapa da sua pesquisa\?/);
  assert.match(dashboard, /Continue de onde parou/);
  assert.match(dashboard, /continueParam === "1"/);
  assert.match(dashboard, /Projetos em andamento/);
  assert.match(dashboard, /Projetos concluídos/);
  assert.match(dashboard, /Projetos integrados/);
  assert.match(dashboard, /variant="active"/);
  assert.match(dashboard, /variant="completed"/);
  assert.match(dashboard, /variant="integrated"/);
  assert.match(dashboard, /Marque dois a quatro projetos/);
  assert.match(dashboard, /const continuationMeta = activeProjects\[0\] \?\? null/);
  assert.doesNotMatch(dashboard, /\?\? projects\[0\]/);
  assert.match(dashboard, /DashboardProjectGrid/);
  assert.match(quickStart, /useActionState/);
  assert.match(quickStart, /createProject/);
  assert.doesNotMatch(quickStart, /Abrir configurações iniciais/);
  assert.match(quickStart, /autoGenerate/);
  assert.match(quickStart, /Mapa Avançado/);
  assert.match(quickStart, /Mapa Rápido/);
  assert.match(discovery, /Escolha um caminho para a pesquisa/);
  assert.match(discovery, /Mais próxima do seu pedido/);
  assert.match(discovery, /Research Starter/);
  assert.match(visualDecision, /\[x\] Híbrida/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(error, /Tentar novamente/);
});

test("implements Change 010 with one persisted discovery and six selectable proposals", async () => {
  const [discoverRoute, selectionRoute, service, gemini, projectPage, storage] = await Promise.all([
    readProjectFile("app/api/projects/[id]/discover/route.ts"),
    readProjectFile("app/api/projects/[id]/proposal-selection/route.ts"),
    readProjectFile("modules/research-workflow/discovery-service.ts"),
    readProjectFile("modules/generation/gemini.ts"),
    readProjectFile("app/dashboard/projects/[id]/page.tsx"),
    readProjectFile("modules/generation/storage.ts"),
  ]);

  assert.match(discoverRoute, /discoverResearchProposals/);
  assert.match(discoverRoute, /\.eq\("revision", workflow\.revision\)/);
  assert.match(discoverRoute, /state: "choosing_problem"/);
  assert.match(selectionRoute, /selectedCandidateId/);
  assert.match(selectionRoute, /activeStep: "problem_statement"/);
  assert.match(service, /maxReferences: 20/);
  assert.match(service, /last-5-years/);
  assert.match(service, /last-10-years/);
  assert.match(gemini, /Crie exatamente seis propostas acadêmicas distintas/);
  assert.match(gemini, /A proposta 1 deve ter kind=exact/);
  assert.match(projectPage, /workflow_version === 2/);
  assert.match(projectPage, /ProposalDiscoveryWorkspace/);
  assert.match(storage, /loadGenerationStatus/);
  assert.doesNotMatch(discoverRoute, /select\("\*"\)/);
});

test("implements Change 011 with editable and versioned problem and objectives", async () => {
  const [route, workspace, validation, schema, gemini, page, referenceRoute, referencePanel, workflowReferences] = await Promise.all([
    readProjectFile("app/api/projects/[id]/definition/route.ts"),
    readProjectFile("modules/research-workflow/research-definition-workspace.tsx"),
    readProjectFile("modules/research-workflow/definition-validation.ts"),
    readProjectFile("modules/research-workflow/schema.ts"),
    readProjectFile("modules/generation/gemini.ts"),
    readProjectFile("app/dashboard/projects/[id]/page.tsx"),
    readProjectFile("app/api/projects/[id]/references/route.ts"),
    readProjectFile("modules/research-workflow/manual-reference-panel.tsx"),
    readProjectFile("modules/research-workflow/workflow-references.ts"),
  ]);

  assert.match(route, /\.eq\("revision", workflow\.revision\)/);
  assert.match(route, /markDescendantsStale/);
  assert.match(route, /elementVersions/);
  assert.match(route, /validating_specific_objectives/);
  assert.match(workspace, /Regenerar sugestão/);
  assert.match(workspace, /Salvar rascunho/);
  assert.match(workspace, /Validar pelo estudante/);
  assert.match(workspace, /ManualReferencePanel/);
  assert.match(workspace, /justificationLabelSuffix = isAdvisorOwner \? " \(opcional\)" : " \*"/);
  assert.match(workspace, /Por que esta grande pergunta vale ser investigada\?\{justificationLabelSuffix\}/);
  assert.match(workspace, /Justificativa do OE\{index \+ 1\}\{justificationLabelSuffix\}/);
  assert.match(workspace, /studentJustification/);
  assert.match(route, /Preencha a justificativa da grande pergunta \(\*\)/);
  assert.match(workspace, /specifics\.length >= 6/);
  assert.match(validation, /INFINITIVE_OPENING/);
  assert.match(validation, /redundantes/);
  assert.match(schema, /definitionStepSchema/);
  assert.match(schema, /elementVersionSchema/);
  assert.match(gemini, /Crie exatamente um objetivo geral/);
  assert.match(gemini, /Crie exatamente quatro objetivos específicos/);
  assert.match(gemini, /referências externas manuais/);
  assert.match(page, /ResearchDefinitionWorkspace/);
  assert.match(referenceRoute, /source: "manual"/);
  assert.match(referenceRoute, /referenceArchive/);
  assert.match(referenceRoute, /\.eq\("owner_id", ownerId\)/);
  assert.match(referenceRoute, /\.eq\("revision", workflow\.revision\)/);
  assert.match(referencePanel, /Nova referência externa/);
  assert.match(referencePanel, /Título/);
  assert.match(referencePanel, /Autores/);
  assert.match(referencePanel, /Revista/);
  assert.match(referencePanel, /Volume, ano, páginas/);
  assert.match(referencePanel, /Abstract/);
  assert.match(referencePanel, /DOI/);
  assert.match(workflowReferences, /studentContextNotes/);
  assert.match(workflowReferences, /discoveryWithWorkflowReferences/);
});

test("implements Change 012 with traceable Chapter 2 and Chapter 4 planning", async () => {
  const [route, workspace, validation, library, schema, gemini, page] = await Promise.all([
    readProjectFile("app/api/projects/[id]/chapters/route.ts"),
    readProjectFile("modules/research-workflow/literature-development-workspace.tsx"),
    readProjectFile("modules/research-workflow/chapter-validation.ts"),
    readProjectFile("modules/research-workflow/knowledge-library.ts"),
    readProjectFile("modules/research-workflow/schema.ts"),
    readProjectFile("modules/generation/gemini.ts"),
    readProjectFile("app/dashboard/projects/[id]/page.tsx"),
  ]);

  assert.match(route, /generateLiteratureTopics/);
  assert.match(route, /generateDevelopmentTopics/);
  assert.match(route, /fetchResearchStarterReport/);
  assert.match(route, /topics: undefined/);
  assert.match(route, /referenceArchive/);
  assert.match(route, /discoveryWithWorkflowReferences/);
  assert.match(route, /studentContextNotes/);
  assert.match(route, /generalObjectiveId: context\.general\.id/);
  assert.match(route, /\.eq\("revision", workflow\.revision\)/);
  assert.match(route, /validateCompleteObjectiveCoverage/);
  assert.match(workspace, /ManualReferencePanel/);
  assert.match(workspace, /Otimizar literatura/);
  assert.match(workspace, /OEG/);
  assert.match(workspace, /apresentação do estudo de caso/);
  assert.match(workspace, /Justificativa deste tópico \*/);
  assert.match(route, /parseSubmittedTopics/);
  assert.match(workspace, /Atende completamente/);
  assert.match(workspace, /Atende parcialmente/);
  assert.match(workspace, /Grau de cobertura de/);
  assert.match(validation, /OBJECTIVE_COVERAGE_LABELS/);
  assert.match(workspace, /literature-optimizer-card/);
  assert.match(workspace, /Quando otimizar:/);
  assert.match(workspace, /associações específicas entre tópico e referência podem mudar/);
  assert.match(workspace, /Se tudo estiver bom, você pode apenas validar e avançar/);
  assert.match(workspace, /requestBody\.topics = topics/);
  assert.match(workspace, /Referências encontradas e associadas/);
  assert.match(workspace, /Cobertura dos objetivos/);
  assert.match(workspace, /para cima/);
  assert.match(workspace, /referências associadas/);
  assert.match(validation, /resultados\? \(\?:encontrados/);
  assert.match(validation, /generalObjectiveId/);
  assert.match(validation, /justificativa do aluno \(\*\)/);
  assert.match(validation, /entre três e seis/);
  assert.match(library, /KNOWLEDGE_LIBRARY_VERSION/);
  assert.match(library, /status: "suggested"/);
  assert.match(schema, /chapterTopicDetails/);
  assert.match(schema, /knowledgeSuggestions/);
  assert.match(gemini, /Crie exatamente quatro tópicos para o Capítulo 2/);
  assert.match(gemini, /Crie exatamente quatro tópicos para o Capítulo 4/);
  assert.match(gemini, /ID do objetivo geral \(OEG\)/);
  assert.match(page, /LiteratureDevelopmentWorkspace/);
});

test("implements Change 052 with a real Research Starter optimization and safe archive", async () => {
  const [spec, route, workspace, references, evidence, roadmap, version] = await Promise.all([
    readProjectFile(".specs/changes/052-literature-optimization-explanation/spec.md"),
    readProjectFile("app/api/projects/[id]/chapters/route.ts"),
    readProjectFile("modules/research-workflow/literature-development-workspace.tsx"),
    readProjectFile("modules/research-workflow/workflow-references.ts"),
    readProjectFile(".specs/changes/052-literature-optimization-explanation/closure-evidence.md"),
    readProjectFile(".specs/roadmap.md"),
    readProjectFile("lib/app-version.ts"),
  ]);

  assert.match(spec, /nova busca no Research Starter/);
  assert.match(route, /fetchResearchStarterReport/);
  assert.match(route, /mergeReferenceArchive/);
  assert.match(route, /A versão anterior foi preservada/);
  assert.match(route, /resultados parciais/);
  assert.match(route, /associada\(s\) aos novos tópicos/);
  assert.match(workspace, /nova busca no Research Starter/);
  assert.match(workspace, /referências externas adicionadas manualmente permanecem preservadas/);
  assert.match(workspace, /externa\(s\) preservada\(s\)/);
  assert.match(references, /mergeReferenceArchive/);
  assert.match(evidence, /v25082026\.3/);
  assert.match(roadmap, /052 \| Explicação e garantia da otimização da literatura \| Concluída/);
  assert.match(version, /v\d{8}\.\d+/);
});

test("keeps methodology controls responsive and reference-aware", async () => {
  const [workspace, styles, route, gemini] = await Promise.all([
    readProjectFile("modules/research-workflow/methodology-workspace.tsx"),
    readProjectFile("app/globals.css"),
    readProjectFile("app/api/projects/[id]/methodology/route.ts"),
    readProjectFile("modules/generation/gemini.ts"),
  ]);

  assert.match(workspace, /referenceById/);
  assert.match(workspace, /referenceText\(reference\)/);
  assert.match(workspace, /METHODOLOGY_HELP/);
  assert.match(workspace, /data-methodology-help/);
  assert.match(workspace, /function ethicsTextToList/);
  assert.match(workspace, /cleaned\.some\(\(item\) => item\.length < 10\)/);
  assert.match(workspace, /return cleaned\.join\(", "\)/);
  assert.match(workspace, /ethicsWarnings: ethicsTextToList\(ethicsText\)/);
  assert.match(workspace, /Avisos éticos ou de acesso<textarea/);
  assert.doesNotMatch(workspace, /ethicsWarnings: textToList\(ethicsText\)/);
  assert.match(workspace, /clearValidationErrors/);
  assert.match(workspace, /blockingMessages/);
  assert.match(workspace, /warningFindings/);
  assert.match(workspace, /Explicar/);
  assert.match(workspace, /Adicionar linha OEG/);
  assert.match(workspace, /moveRow/);
  assert.match(workspace, /Título final sugerido \*/);
  assert.match(workspace, /Natureza \*/);
  assert.match(workspace, /Abordagem \*/);
  assert.match(workspace, /Objetivos metodológicos \*/);
  assert.match(workspace, /Procedimentos \*/);
  assert.match(workspace, /Instrumentos \*/);
  assert.match(workspace, /Técnicas de análise \*/);
  assert.match(workspace, /Justificativa \*/);
  assert.match(workspace, /Levantamento \*/);
  assert.match(workspace, /Análise\/tratamento \*/);
  assert.match(workspace, /Resultado esperado \*/);
  assert.match(workspace, /Justificativa da linha \*/);
  assert.match(workspace, /methodologyMessageText/);
  assert.match(workspace, /OE\$\{index\} \(objetivo específico \$\{index\}\)/);
  assert.match(workspace, /methodologyMessageText\(finding\.message\)/);
  assert.match(styles, /input:not\(\[type="checkbox"\]\)/);
  assert.match(styles, /methodology-classification input\[type="checkbox"\]/);
  assert.match(styles, /methodology-classification fieldset \{[^}]*align-items: flex-start/);
  assert.match(styles, /methodology-classification fieldset label \{[^}]*border-radius: 0\.75rem/);
  assert.match(styles, /methodology-help-popover/);
  assert.match(styles, /definition-button\.secondary:disabled/);
  assert.doesNotMatch(styles, /methodology-classification fieldset label \{[^}]*border-radius: 999px/);
  assert.match(route, /improvementNotes/);
  assert.match(route, /formatMethodologyPlanIssues/);
  assert.match(route, /Justificativa metodológica \(\*\)/);
  assert.match(route, /Objetivos metodológicos \(\*\)/);
  assert.match(route, /Avisos éticos ou de acesso/);
  assert.match(route, /entre 10 e 400 caracteres/);
  assert.match(route, /Justificativa da linha \(\*\)/);
  assert.match(route, /generalObjectiveId: context\.general\.id/);
  assert.match(gemini, /Corrija especificamente estes avisos/);
  assert.match(gemini, /linha final para o objetivo geral/);
  assert.match(styles, /@media \(max-width: 600px\)/);
});

test("supports anchored project actions and owner-scoped AI integration", async () => {
  const [grid, card, route, projectPage, gemini, layout, accountMenu] = await Promise.all([
    readProjectFile("modules/projects/dashboard-project-grid.tsx"),
    readProjectFile("modules/projects/project-card-modal.tsx"),
    readProjectFile("app/api/projects/integrate/route.ts"),
    readProjectFile("app/dashboard/projects/[id]/page.tsx"),
    readProjectFile("modules/generation/gemini.ts"),
    readProjectFile("app/dashboard/layout.tsx"),
    readProjectFile("modules/auth/account-menu.tsx"),
  ]);

  assert.match(grid, /Selecione projetos concluídos para integrar/);
  assert.match(grid, /allowIntegration = false/);
  assert.match(grid, /project-library-section-\$\{variant\}/);
  assert.match(grid, /\/api\/projects\/integrate/);
  assert.match(grid, /integration-progress-bar/);
  assert.match(grid, /Lendo mapas salvos e referências/);
  assert.match(grid, /Integração concluída/);
  assert.match(card, /project-card-references/);
  assert.match(card, /selectable = true/);
  assert.match(card, /Integração de projetos/);
  assert.match(card, /Integração dos projetos:/);
  assert.match(card, /getBoundingClientRect/);
  assert.match(card, /createPortal/);
  assert.match(card, /event\.key === "Escape"/);
  assert.match(card, /document\.addEventListener\("pointerdown", close\)/);
  assert.doesNotMatch(card, /project-card-open/);
  assert.match(card, />Abrir</);
  assert.match(card, />Excluir</);
  assert.match(route, /\.eq\("owner_id", userId\)/);
  assert.match(route, /projectIds\.length < 2 \|\| projectIds\.length > 4/);
  assert.match(route, /research_workflows/);
  assert.match(route, /workflowToResearchStructure/);
  assert.match(route, /Todos os projetos precisam ter um mapa salvo/);
  assert.match(route, /sourceTitles/);
  assert.match(route, /mergeResearchStructures/);
  assert.match(projectPage, /integration-result-banner/);
  assert.match(projectPage, /Este mapa é uma integração dos projetos/);
  assert.match(gemini, /Integre os mapas fornecidos/);
  assert.match(layout, />Dashboard</);
  assert.match(layout, /AccountMenu/);
  assert.match(accountMenu, /document\.addEventListener\("pointerdown", closeOutside\)/);
  assert.match(accountMenu, /event\.key === "Escape"/);
});

test("adds advisor-student validation gates for every v2 step", async () => {
  const [
    advisorHelper,
    advisorWorkspace,
    advisorRoute,
    definitionRoute,
    chaptersRoute,
    methodologyRoute,
    finalMapRoute,
    projectPage,
    dashboard,
    card,
    styles,
    migration,
    schema,
    quickStart,
  ] = await Promise.all([
    readProjectFile("modules/research-workflow/advisor-review.ts"),
    readProjectFile("modules/research-workflow/advisor-review-workspace.tsx"),
    readProjectFile("app/api/projects/[id]/advisor-review/route.ts"),
    readProjectFile("app/api/projects/[id]/definition/route.ts"),
    readProjectFile("app/api/projects/[id]/chapters/route.ts"),
    readProjectFile("app/api/projects/[id]/methodology/route.ts"),
    readProjectFile("app/api/projects/[id]/final-map/route.ts"),
    readProjectFile("app/dashboard/projects/[id]/page.tsx"),
    readProjectFile("app/dashboard/page.tsx"),
    readProjectFile("modules/projects/project-card-modal.tsx"),
    readProjectFile("app/globals.css"),
    readProjectFile("supabase/migrations/20260814203000_add_advisor_review_access.sql"),
    readProjectFile("modules/research-workflow/schema.ts"),
    readProjectFile("modules/projects/quick-start-form.tsx"),
  ]);

  assert.match(schema, /advisorReviewSchema/);
  assert.match(schema, /advisorReviews/);
  assert.match(advisorHelper, /withAdvisorReviewRequest/);
  assert.match(advisorHelper, /withAdvisorReviewDecision/);
  assert.match(advisorWorkspace, /Área do orientador/);
  assert.match(advisorWorkspace, /Modo leitura/);
  assert.match(advisorWorkspace, /Tudo que o estudante construiu/);
  assert.match(advisorWorkspace, /AdvisorReadOnlyProject/);
  assert.match(advisorWorkspace, /Justificativa do estudante/);
  assert.match(advisorWorkspace, /withCitationMarkers/);
  assert.match(advisorWorkspace, /Comentários do orientador/);
  assert.match(advisorWorkspace, /Solicitar correção/);
  assert.match(advisorWorkspace, /Validar etapa/);
  assert.match(advisorRoute, /request_changes/);
  assert.match(advisorRoute, /review\.targetState/);
  assert.match(advisorRoute, /claimEmail/);
  assert.match(definitionRoute, /pendingAdvisorReview/);
  assert.match(definitionRoute, /isAdvisorOwner/);
  assert.match(definitionRoute, /requireStudentJustification: !isAdvisorOwner/);
  assert.match(definitionRoute, /Aguardando validação do orientador/);
  assert.match(chaptersRoute, /requireStudentJustification: !isAdvisorOwner/);
  assert.match(chaptersRoute, /!isAdvisorOwner && Boolean\(advisorEmail\)/);
  assert.match(chaptersRoute, /Capítulo 2 validado pelo estudante/);
  assert.match(chaptersRoute, /Capítulo 4 validado pelo estudante/);
  assert.match(methodologyRoute, /requireStudentJustification: !isAdvisorOwner/);
  assert.match(methodologyRoute, /!isAdvisorOwner && Boolean\(advisorEmail\)/);
  assert.match(methodologyRoute, /Metodologia validada pelo estudante/);
  assert.match(finalMapRoute, /!isAdvisorOwner && Boolean\(advisorEmail\)/);
  assert.match(finalMapRoute, /Mapa validado pelo estudante/);
  assert.match(projectPage, /AdvisorReviewWorkspace/);
  assert.match(projectPage, /project\.owner_id/);
  assert.match(dashboard, /Projetos sob minha orientação/);
  assert.match(dashboard, /variant="advisor"/);
  assert.match(card, /Somente o estudante pode excluir/);
  assert.match(card, /Orientador:/);
  assert.match(styles, /advisor-review-workspace/);
  assert.match(styles, /advisor-readonly-map/);
  assert.match(styles, /project-library-section-advisor/);
  assert.match(migration, /advisor_email/);
  assert.match(migration, /projects_select_advised/);
  assert.match(migration, /research_workflows_update_advised/);
  assert.match(quickStart, /advisorEmail/);
});

test("supports student/advisor profile modes and deferred advisor linking", async () => {
  const [
    accountMenu,
    profileActions,
    profilePrompt,
    profileStorage,
    projectActions,
    projectAdvisorPanel,
    dashboard,
    projectPage,
    advisorRoute,
    migration,
    styles,
  ] = await Promise.all([
    readProjectFile("modules/auth/account-menu.tsx"),
    readProjectFile("modules/profile/actions.ts"),
    readProjectFile("modules/profile/profile-mode-prompt.tsx"),
    readProjectFile("modules/profile/storage.ts"),
    readProjectFile("modules/projects/actions.ts"),
    readProjectFile("modules/projects/project-advisor-panel.tsx"),
    readProjectFile("app/dashboard/page.tsx"),
    readProjectFile("app/dashboard/projects/[id]/page.tsx"),
    readProjectFile("app/api/projects/[id]/advisor-review/route.ts"),
    readProjectFile("supabase/migrations/20260814214000_add_user_profiles_and_advisor_linking.sql"),
    readProjectFile("app/globals.css"),
  ]);

  assert.match(accountMenu, /activeRole/);
  assert.match(accountMenu, /Mudar para/);
  assert.match(profileActions, /setActiveProfileRole/);
  assert.match(profileActions, /insert\(\{ active_role: role, created_at: now, updated_at: now, user_id: userId \}\)/);
  assert.match(profileActions, /redirect\("\/dashboard"\)/);
  assert.match(profileActions, /claim_pending_advisor_projects/);
  assert.match(profilePrompt, /Primeiro acesso/);
  assert.match(profilePrompt, /Sou aluno/);
  assert.match(profilePrompt, /Sou orientador/);
  assert.match(profileStorage, /loadUserProfile/);
  assert.match(profileStorage, /hasProfile: false/);
  assert.match(dashboard, /isStudentMode/);
  assert.match(dashboard, /isAdvisorMode/);
  assert.match(dashboard, /Crie seus mapas e acompanhe orientações/);
  assert.match(dashboard, /showAdvisorField=\{false\}/);
  assert.match(dashboard, /Projetos e supervisões/);
  assert.match(dashboard, /advisor-mode-hero/);
  assert.match(dashboard, /profile\.activeRole === "advisor"/);
  assert.match(dashboard, /Projetos sob minha orientação/);
  assert.match(projectPage, /ProjectAdvisorPanel/);
  assert.match(projectPage, /isAdvisorOwner/);
  assert.match(projectPage, /isAdvisorOwner \? null :/);
  assert.match(projectPage, /advisorMatches && !isAdvisor/);
  assert.match(projectPage, /Abra este projeto no modo orientador/);
  assert.match(advisorRoute, /profile\.activeRole !== "advisor"/);
  assert.match(advisorRoute, /project\.advisor_id === userId/);
  assert.match(projectActions, /set_project_advisor/);
  assert.match(projectActions, /E-mail salvo\. O vínculo será concluído/);
  assert.match(projectAdvisorPanel, /E-mail do orientador/);
  assert.match(projectAdvisorPanel, /Conta vinculada/);
  assert.match(projectAdvisorPanel, /E-mail guardado/);
  assert.match(projectAdvisorPanel, /useState\(!advisorEmail\)/);
  assert.match(projectAdvisorPanel, /Alterar orientador/);
  assert.match(projectAdvisorPanel, /project-advisor-saved/);
  assert.match(migration, /create table if not exists public\.user_profiles/);
  assert.match(migration, /create or replace function public\.set_project_advisor/);
  assert.match(migration, /create or replace function public\.claim_pending_advisor_projects/);
  assert.match(migration, /grant execute on function public\.set_project_advisor\(uuid, text\) to authenticated/);
  assert.match(migration, /advisor_id = \(select auth\.uid\(\)\)/);
  assert.match(styles, /profile-mode-backdrop/);
  assert.match(styles, /account-profile-switch/);
  assert.match(styles, /project-advisor-panel/);
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
