import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { USER_PROFILE_PRESENTATIONS } from "../modules/profile/presentation.ts";

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
  const [home, publicStart, loginPage, signupPage, authActions, quickStart, legalContent, legalLinks, dashboard, supportRoute, actorPolicy, profileStorage] = await Promise.all([
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
    readProjectFile("modules/profile/actor-policy.ts"),
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
  assert.match(loginPage, /label="Google"/);
  assert.match(loginPage, /Acesse ou crie sua conta com o Google/);
  assert.doesNotMatch(loginPage, /LinkedIn|linkedin_oidc|modules\/auth\/auth-form|forgot-password|signup\?next=/);
  assert.match(signupPage, /redirect/);
  assert.match(signupPage, /google-only/);
  assert.match(authActions, /readSafeAuthDestination/);
  assert.match(authActions, /signInWithOAuth/);
  assert.match(authActions, /readSocialAuthProvider/);
  assert.match(authActions, /provider,/);
  assert.match(authActions, /provider=\$\{provider\}/);
  assert.doesNotMatch(authActions, /signInWithPassword|signUp|resetPasswordForEmail|updateUser/);
  assert.match(await readProjectFile("app/auth/callback/route.ts"), /buildLoginErrorPath/);
  assert.match(quickStart, /requestSubmit/);
  assert.match(quickStart, /PENDING_PROJECT_MAX_AGE_MS/);
  assert.match(quickStart, /pendingDraftRead/);
  assert.match(quickStart, /hasResearchProductType/);
  assert.match(quickStart, /Mapa Rápido/);
  assert.match(quickStart, /Mapa Avançado/);
  assert.match(quickStart, /canResume/);
  assert.match(dashboard, /canResume=\{profile\.hasLegalConsent\}/);
  assert.match(legalContent, /com apoio do orientador/);
  assert.match(legalContent, /no uso do aplicativo/);
  assert.match(legalContent, /Como estudante/);
  assert.match(legalContent, /Nesta área de revisão/);
  assert.match(legalContent, /Research Starter/);
  assert.match(legalContent, /até 30 dias/);
  assert.match(profileStorage, /resolveProfileRecord\(data, consent, LEGAL_TERMS_VERSION\)/);
  assert.match(actorPolicy, /consent\.terms_version === termsVersion/);
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
  const [input, route, gemini, quickStart, publicStart] = await Promise.all([
    readProjectFile("modules/projects/research-prompt-input.tsx"),
    readProjectFile("app/api/prompt-suggestions/route.ts"),
    readProjectFile("modules/generation/gemini.ts"),
    readProjectFile("modules/projects/quick-start-form.tsx"),
    readProjectFile("modules/projects/public-start-form.tsx"),
  ]);

  assert.match(input, /Informe as palavras-chave \(mínimo duas\) ou escreva o tema da pesquisa\./);
  assert.doesNotMatch(input, /Exemplo: Crie um roteiro de dissertação de mestrado/);
  assert.match(input, /650/);
  assert.match(input, /Sugestões para consolidar o mapa/);
  assert.match(input, /MINIMUM_SUGGESTION_LENGTH = 8/);
  assert.match(input, /buildLocalPromptSuggestions/);
  assert.match(input, /Tema \{index \+ 1\}/);
  assert.match(input, /normalizeSuggestionText/);
  assert.match(input, /onSuggestionSelect\?\.\(selectedPrompt\)/);
  assert.match(quickStart, /quickSuggestionSubmitPending/);
  assert.match(quickStart, /onSuggestionSelect=\{handleQuickSuggestionSelect\}/);
  assert.match(quickStart, /formRef\.current\.requestSubmit\(\)/);
  assert.match(publicStart, /quickSuggestionContinuePending/);
  assert.match(publicStart, /onSuggestionSelect=\{handleQuickSuggestionSelect\}/);
  assert.match(publicStart, /formRef\.current\.requestSubmit\(\)/);
  assert.match(gemini, /Não use os rótulos 'Tema de pesquisa', 'Investigar' ou 'Analisar'/);
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
  assert.match(route, /research-starter-unauthorized/);
  assert.match(route, /credencial configurada/);
  assert.match(route, /gemini-quota-exhausted/);
  assert.match(service, /normalizeReferences/);
  assert.match(service, /safeUrl/);
  assert.match(service, /DISCOVERY_DEADLINE_MS/);
  assert.match(service, /broadenResearchQuery/);
  assert.match(service, /compactOriginalPrompt/);
  assert.match(service, /research-starter-unauthorized/);
  assert.match(service, /prepayment credits are depleted/);
  assert.match(client, /DEFAULT_MAX_ATTEMPTS/);
  assert.match(client, /AbortSignal\.timeout/);
  assert.match(client, /temporary-unavailable/);
  assert.match(workspace, /Seu briefing continua salvo/);
  assert.match(workspace, /integração bibliográfica precisa ser atualizada/);
  assert.match(workspace, /AbortSignal\.timeout\(110_000\)/);
  assert.match(version, /v\d{8}\.\d+/);
});

test("keeps quick prompts compact and does not repeat them as five intake answers", async () => {
  const [actions, intake] = await Promise.all([
    readProjectFile("modules/projects/actions.ts"),
    readProjectFile("modules/projects/research-intake.ts"),
  ]);

  assert.match(actions, /Quick mode is a single natural-language prompt/);
  assert.match(actions, /legacyPromptMode && promptValue\.length < 10/);
  assert.match(actions, /formData\.set\("problemStatement", parsedIntake \? composeResearchBrief\(parsedIntake\) : promptValue\)/);
  assert.match(actions, /promptValue \|\| result\.data\.problem_statement/);
  assert.match(intake, /collapse an identical answer repeated in every field/);
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
  assert.match(route, /createFinalMapDocxExport/);
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
  assert.match(gemini, /process\.env\.GEMINI_MODEL\?\.trim\(\) \|\| "gemini-3\.6-flash"/);
  assert.match(gemini, /thinkingLevel: "minimal"/);
  assert.doesNotMatch(gemini, /thinkingBudget: 0|gemini-2\.5-flash/);
  assert.match(gemini, /validateReferenceIds/);
  assert.match(migration, /unique \(owner_id, idempotency_key\)/);
  assert.equal((migration.match(/create policy/g) ?? []).length, 8);
  assert.match(migration, /alter table public\.research_structures enable row level security/);
});

test("recovers the Gemini 3 pipeline and preserves AI-generated final titles", async () => {
  const [gemini, verification, environment, roadmap, spec] = await Promise.all([
    readProjectFile("modules/generation/gemini.ts"),
    readProjectFile("scripts/verify-gemini.mjs"),
    readProjectFile(".env.example"),
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/072-gemini-pipeline-recovery/spec.md"),
  ]);

  assert.match(gemini, /process\.env\.GEMINI_MODEL\?\.trim\(\) \|\| "gemini-3\.6-flash"/);
  assert.match(gemini, /thinkingLevel: "minimal"/);
  assert.doesNotMatch(gemini, /thinkingBudget: 0|gemini-2\.5-flash/);
  assert.match(gemini, /Sugira um título final curto derivado do objetivo geral/);
  assert.match(gemini, /title: generated\.title/);
  assert.match(verification, /const model = process\.env\.GEMINI_MODEL\?\.trim\(\) \|\| "gemini-3\.6-flash"/);
  assert.match(verification, /thinkingLevel: "minimal"/);
  assert.match(environment, /^GEMINI_MODEL=$/m);
  assert.match(roadmap, /072 \| Recuperação do pipeline Gemini \| Concluída/);
  assert.match(spec, /\*\*Status:\*\* concluída/);
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

test("exports only the authenticated owner's saved structure as PDF or DOCX", async () => {
  const [route, docx, pdf, workspace, finalWorkspace, citationHelper, prompt, styles] = await Promise.all([
    readProjectFile("app/api/projects/[id]/exports/[format]/route.ts"),
    readProjectFile("modules/export/docx.ts"),
    readProjectFile("modules/export/pdf.ts"),
    readProjectFile("modules/generation/generation-workspace.tsx"),
    readProjectFile("modules/research-workflow/final-map-workspace.tsx"),
    readProjectFile("modules/research-workflow/reference-citations.ts"),
    readProjectFile("modules/generation/prompts/structure-v1.ts"),
    readProjectFile("app/globals.css"),
  ]);

  assert.match(route, /\.eq\("owner_id", userId\)/);
  assert.match(route, /format === "docx"/);
  assert.match(route, /createDocxExport/);
  assert.match(route, /createFinalMapDocxExport/);
  assert.match(route, /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/);
  assert.doesNotMatch(route, /temporariamente indisponível/);
  assert.match(route, /private, no-store/);
  assert.match(route, /Content-Disposition/);
  assert.match(route, /loadGenerationSnapshot/);
  assert.match(docx, /Packer\.toBuffer/);
  assert.match(docx, /createFinalMapDocxExport/);
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
  assert.match(workspace, /Exportar Word/);
  assert.match(finalWorkspace, /Exportar Word/);
  assert.match(workspace, /Salve as alterações antes de exportar/);
  assert.match(styles, /\.final-export-panel \{[^}]*linear-gradient\(145deg, #17221e, #0c1210\)/);
  assert.match(styles, /\.final-export-panel a \{[^}]*linear-gradient\(135deg, #f5fff9, #b9d6ca\)/);
  assert.match(styles, /\.final-export-panel a:hover \{[^}]*transform: translateY\(-1px\)/);
});

test("keeps the Research Starter key server-side and follows its v1 contract", async () => {
  const [client, route, verification, productionVerification, environment] = await Promise.all([
    readProjectFile("modules/research-starter/client.ts"),
    readProjectFile("app/api/research-starter/reports/route.ts"),
    readProjectFile("scripts/verify-research-starter.mjs"),
    readProjectFile("scripts/verify-research-starter-production.mjs"),
    readProjectFile(".env.example"),
  ]);

  assert.match(client, /import "server-only"/);
  assert.match(client, /RESEARCH_STARTER_MAPA_API_KEY/);
  assert.doesNotMatch(client, /process\.env\.RESEARCH_STARTER_API_KEY\b/);
  assert.match(client, /\/api\/v1\/reports/);
  assert.match(route, /requireAuthenticatedUser/);
  assert.match(route, /publicationInterval: \{ kind: interval \}/);
  assert.match(verification, /maxReferences: 3/);
  assert.doesNotMatch(verification, /process\.env\.RESEARCH_STARTER_API_KEY\b/);
  assert.match(productionVerification, /MAPA_E2E_STUDENT_EMAIL/);
  assert.match(productionVerification, /\/api\/research-starter\/reports/);
  assert.match(productionVerification, /Cookie: cookie/);
  assert.doesNotMatch(environment, /^RESEARCH_STARTER_API_KEY=/m);
  assert.match(environment, /^RESEARCH_STARTER_MAPA_API_KEY=$/m);
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
  assert.equal(manifest.engines.node, "22.x");
  assert.equal(manifest.dependencies.next, "16.3.5");
  assert.equal(manifest.dependencies.resend, "^6.28.0");
  assert.equal(manifest.devDependencies["eslint-config-next"], "16.3.5");
  assert.equal(manifest.devDependencies["@tailwindcss/postcss"], "4.3.3");
  assert.equal(manifest.devDependencies.tailwindcss, "4.3.3");
  assert.equal(manifest.overrides.postcss, "8.5.28");
  assert.equal(manifest.overrides.sharp, "0.35.4");
  assert.deepEqual(manifest.allowScripts, {
    esbuild: false,
    "unrs-resolver": false,
  });
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

test("protects the dashboard and retires password routes", async () => {
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
  assert.match(dashboard, /loadActorContext\(\)/);
  assert.match(projectAuth, /auth\.getClaims\(\)/);
  assert.match(projectAuth, /redirect\("\/login"\)/);
  assert.doesNotMatch(authActions, /signInWithPassword|resetPasswordForEmail|updatePassword|signUp/);
  assert.match(recoveryPage, /redirect/);
  assert.match(recoveryPage, /google-only/);
  assert.match(confirmRoute, /google-only/);
  assert.doesNotMatch(confirmRoute, /verifyOtp|token_hash|recovery/);
});

test("sanitizes auth callback destinations", async () => {
  const [callback, oauthContract] = await Promise.all([
    readProjectFile("app/auth/callback/route.ts"),
    readProjectFile("modules/auth/oauth-contract.ts"),
  ]);

  assert.match(callback, /readSafeAuthDestination/);
  assert.match(oauthContract, /value\.startsWith\("\/"\)/);
  assert.match(oauthContract, /value\.startsWith\("\/\/"\)/);
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
  assert.match(workspace, /Validar etapa/);
  assert.match(workspace, /ManualReferencePanel/);
  assert.match(workspace, /justificationLabelSuffix = isSelfDirectedProject \? " \(opcional\)" : " \*"/);
  assert.match(workspace, /Por que esta grande pergunta vale ser investigada\?\{justificationLabelSuffix\}/);
  assert.match(workspace, /Justificativa do OE\{index \+ 1\}\{justificationLabelSuffix\}/);
  assert.match(workspace, /studentJustification/);
  assert.match(route, /promoteObjectiveId: z\.string\(\)\.uuid\(\)\.nullable\(\)\.optional\(\)/);
  assert.match(workspace, /promotionId \?\? undefined/);
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

test("reconciles stale topic links before presenting association counts", async () => {
  const [integrity, workspace, route, finalMap] = await Promise.all([
    readProjectFile("modules/research-workflow/topic-integrity.ts"),
    readProjectFile("modules/research-workflow/methodology-workspace.tsx"),
    readProjectFile("app/api/projects/[id]/methodology/route.ts"),
    readProjectFile("modules/research-workflow/final-map.ts"),
  ]);

  assert.match(integrity, /reconcileTopicLinks/);
  assert.match(integrity, /associatedTopicIds: uniqueIds/);
  assert.match(workspace, /filter\(\(topicId\) => topics\.some/);
  assert.match(route, /reconciledWorkflowContent/);
  assert.match(finalMap, /content: reconcileTopicLinks\(workflow\.content\)/);
});

test("preserves downstream work when returning without editing an upstream step", async () => {
  const [definitionRoute, chaptersRoute] = await Promise.all([
    readProjectFile("app/api/projects/[id]/definition/route.ts"),
    readProjectFile("app/api/projects/[id]/chapters/route.ts"),
  ]);

  assert.match(definitionRoute, /reuseExistingGeneral/);
  assert.match(definitionRoute, /reuseExistingSpecifics/);
  assert.match(definitionRoute, /if \(!reuseExistingGeneral\) content = markDescendantsStale/);
  assert.match(definitionRoute, /if \(!reuseExistingSpecifics\) content = markDescendantsStale/);
  assert.match(chaptersRoute, /sameTopics/);
  assert.match(chaptersRoute, /reuseExistingDevelopment/);
  assert.match(chaptersRoute, /versão já existente do Capítulo 4 foi preservada/);
});

test("keeps academic coherence advisory instead of blocking stage progression", async () => {
  const [definitionRoute, chaptersRoute, methodologyRoute, finalMap, finalMapRoute, workspace] = await Promise.all([
    readProjectFile("app/api/projects/[id]/definition/route.ts"),
    readProjectFile("app/api/projects/[id]/chapters/route.ts"),
    readProjectFile("app/api/projects/[id]/methodology/route.ts"),
    readProjectFile("modules/research-workflow/final-map.ts"),
    readProjectFile("app/api/projects/[id]/final-map/route.ts"),
    readProjectFile("modules/research-workflow/final-map-workspace.tsx"),
  ]);

  assert.match(definitionRoute, /Orientação de coerência da Change 068/);
  assert.match(chaptersRoute, /Orientação de capítulos da Change 068/);
  assert.match(methodologyRoute, /advisoryMessages = \[\.\.\.new Set\(\[\.\.\.errors, \.\.\.warnings\]\)\]/);
  assert.doesNotMatch(methodologyRoute, /return NextResponse\.json\(\{ errors, workflow: saved \}, \{ status: 422 \}\)/);
  assert.match(finalMap, /if \(options\.advisory\) return true/);
  assert.match(finalMapRoute, /canCompleteFinalMap\(finalMap, \{ advisory: true \}\)/);
  assert.match(workspace, /Sugestão de revisão/);
});

test("distinguishes macro stages from substeps across the research workflow", async () => {
  const [progress, discovery, definition, chapters, methodology, finalMap] = await Promise.all([
    readProjectFile("modules/research-workflow/workflow-progress.tsx"),
    readProjectFile("modules/research-workflow/proposal-discovery-workspace.tsx"),
    readProjectFile("modules/research-workflow/research-definition-workspace.tsx"),
    readProjectFile("modules/research-workflow/literature-development-workspace.tsx"),
    readProjectFile("modules/research-workflow/methodology-workspace.tsx"),
    readProjectFile("modules/research-workflow/final-map-workspace.tsx"),
  ]);

  assert.match(progress, /Etapa \{current\}\/\{WORKFLOW_PROGRESS_TOTAL\}/);
  assert.match(progress, /Passo \{currentDetail\}\/\{detailSteps\.length\}/);
  assert.match(progress, /Problemática/, "A etapa inicial é nomeada de acordo com o conteúdo.");
  assert.match(progress, /Metodologia e encerramento/, "O encerramento integra a última macroetapa.");
  assert.match(progress, /Voltar para/);
  assert.match(discovery, /currentStep=\{selectedCandidate \? "problem_statement" : null\}/);
  assert.match(definition, /currentStep=\{step\}/);
  assert.match(chapters, /currentStep=\{workflow\.content\.activeStep/);
  assert.match(methodology, /currentStep="methodology_matrix"/);
  assert.match(finalMap, /currentStep="final_map"/);
  assert.doesNotMatch(definition, /className="definition-progress"/);
  assert.doesNotMatch(methodology, /className="definition-progress methodology-progress"/);
});

test("implements Change 073 with revision-safe back navigation and methodology recovery", async () => {
  const [progress, navigation, route, gemini, methodology, styles, spec, roadmap] = await Promise.all([
    readProjectFile("modules/research-workflow/workflow-progress.tsx"),
    readProjectFile("modules/research-workflow/workflow-navigation.ts"),
    readProjectFile("app/api/projects/[id]/navigation/route.ts"),
    readProjectFile("modules/generation/gemini.ts"),
    readProjectFile("modules/research-workflow/methodology-workspace.tsx"),
    readProjectFile("app/globals.css"),
    readProjectFile(".specs/changes/073-reliable-workflow-navigation/spec.md"),
    readProjectFile(".specs/roadmap.md"),
  ]);

  assert.match(progress, /api\/projects/);
  assert.match(progress, /\/navigation/);
  assert.match(progress, /hasUnsavedChanges && !window\.confirm/);
  assert.match(progress, /router\.replace\(workflowNavigationUrl/);
  assert.match(navigation, /POSITION_ORDER/);
  assert.match(navigation, /POSITION_ORDER\[target\] < POSITION_ORDER\[current\]/);
  assert.match(route, /authorizeProjectRoute/);
  assert.match(route, /workflow\.revision !== parsed\.data\.revision/);
  assert.match(route, /pendingAdvisorReview\(workflow\.content\)/);
  assert.match(route, /Etapa anterior aberta sem alterar o conteúdo salvo/);
  assert.match(gemini, /reconcileGeneratedMethodologyRows/);
  assert.match(methodology, /A matriz metodológica ainda não foi criada/);
  assert.match(methodology, /Gerar matriz novamente/);
  assert.match(styles, /workflow-progress-detail/);
  assert.match(spec, /Change 073/);
  assert.match(roadmap, /\| 073 \| Navegação e validação confiável das etapas \|/);
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
  assert.match(workspace, /FINAL_TITLE_MAX_LENGTH/);
  assert.match(workspace, /sistema apenas recomenda encurtar; você pode avançar/);
  assert.match(route, /FINAL_TITLE_MAX_LENGTH/);
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
  assert.match(advisorWorkspace, /Área de revisão/);
  assert.match(advisorWorkspace, /Modo leitura/);
  assert.match(advisorWorkspace, /Tudo que o estudante construiu/);
  assert.match(advisorWorkspace, /AdvisorReadOnlyProject/);
  assert.match(advisorWorkspace, /Justificativa do estudante/);
  assert.match(advisorWorkspace, /withCitationMarkers/);
  assert.match(advisorWorkspace, /Comentários da revisão/);
  assert.match(advisorWorkspace, /Solicitar correção/);
  assert.match(advisorWorkspace, /Validar etapa/);
  assert.match(advisorRoute, /request_changes/);
  assert.match(advisorRoute, /review\.targetState/);
  assert.match(advisorRoute, /claimEmail/);
  assert.match(definitionRoute, /pendingAdvisorReview/);
  assert.match(definitionRoute, /isSelfDirectedProject/);
  assert.match(definitionRoute, /requireStudentJustification: !isSelfDirectedProject/);
  assert.match(definitionRoute, /Aguardando revisão/);
  assert.match(chaptersRoute, /requireStudentJustification: !isSelfDirectedProject/);
  assert.match(chaptersRoute, /projectAdvisorGate/);
  assert.match(chaptersRoute, /Capítulo 2 validado pelo estudante/);
  assert.match(chaptersRoute, /Capítulo 4 validado pelo estudante/);
  assert.match(methodologyRoute, /requireStudentJustification: !isSelfDirectedProject/);
  assert.match(methodologyRoute, /projectAdvisorGate/);
  assert.match(methodologyRoute, /Metodologia validada pelo estudante/);
  assert.match(finalMapRoute, /projectAdvisorGate/);
  assert.match(finalMapRoute, /Mapa validado pelo estudante/);
  assert.match(projectPage, /AdvisorReviewWorkspace/);
  assert.match(projectPage, /project\.owner_id/);
  assert.match(dashboard, /Projetos para revisar/);
  assert.match(dashboard, /variant="advisor"/);
  assert.match(card, /A autoria e a exclusão permanecem com o estudante/);
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
    profileRoleLockMigration,
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
    readProjectFile("supabase/migrations/20260911190000_lock_user_profile_role.sql"),
    readProjectFile("app/globals.css"),
  ]);

  assert.match(accountMenu, /activeRole/);
  assert.match(accountMenu, /Perfil da conta/);
  assert.match(accountMenu, /profilePresentation\?\.profileLabel/);
  assert.doesNotMatch(accountMenu, /Área de trabalho:/);
  assert.doesNotMatch(accountMenu, /Este perfil permanece associado/);
  assert.doesNotMatch(accountMenu, /Mudar para/);
  assert.match(profileActions, /setInitialProfileRole/);
  assert.doesNotMatch(profileActions, /\.update\(\{ active_role/);
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
  assert.match(dashboard, /profilePresentation\.dashboardKicker/);
  assert.match(dashboard, /showAdvisorField=\{profilePresentation\.showAdvisorField\}/);
  assert.match(dashboard, /Crie mapas e revise projetos compartilhados/);
  assert.match(dashboard, /Projetos e revisões/);
  assert.match(dashboard, /advisor-mode-hero/);
  assert.match(dashboard, /profile\.activeRole === "advisor"/);
  assert.match(dashboard, /Projetos para revisar/);
  assert.match(projectPage, /ProjectAdvisorPanel/);
  assert.match(projectPage, /isSelfDirectedProject/);
  assert.match(projectPage, /isStudentAuthoredProject \? \(/);
  assert.match(projectPage, /authorizeProject\(id, "related_read"/);
  assert.match(projectPage, /relation === "advisor"/);
  assert.doesNotMatch(projectPage, /advisorMatches/);
  assert.match(advisorRoute, /capability: "advisor_review"/);
  assert.match(advisorRoute, /authorizeProjectRoute/);
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
  assert.match(profileRoleLockMigration, /revoke update on table public\.user_profiles from authenticated/);
  assert.match(profileRoleLockMigration, /drop policy if exists "user_profiles_update_own"/);
  assert.match(styles, /profile-mode-backdrop/);
  assert.match(styles, /account-profile-switch/);
  assert.match(styles, /project-advisor-panel/);
});

test("keeps explicit profile identity separate from role-specific controls", () => {
  assert.deepEqual(USER_PROFILE_PRESENTATIONS.student, {
    dashboardKicker: "Perfil Aluno",
    profileLabel: "Aluno",
    showAdvisorField: true,
  });
  assert.deepEqual(USER_PROFILE_PRESENTATIONS.advisor, {
    dashboardKicker: "Perfil Orientador",
    profileLabel: "Orientador",
    showAdvisorField: false,
  });
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

test("keeps the advisor-student E2E verifier compatible with versioned role switching", async () => {
  const [verification, roleLockMigration, roadmap, spec] = await Promise.all([
    readProjectFile("scripts/verify-advisor-student-flow.ts"),
    readProjectFile("supabase/migrations/20260911190000_lock_user_profile_role.sql"),
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/071-immutable-role-e2e-verifier/spec.md"),
  ]);

  assert.match(verification, /switchActiveRole/);
  assert.match(verification, /assertActiveRolePersistsAcrossSession/);
  assert.match(verification, /role_version_conflict/);
  assert.match(verification, /restoreOriginalRole/);
  assert.match(verification, /saída sem PII/);
  assert.doesNotMatch(verification, /studentEmail,\s*advisorEmail/);
  assert.doesNotMatch(verification, /\.upsert\(\{ active_role/);
  assert.match(roleLockMigration, /revoke update on table public\.user_profiles from authenticated/);
  assert.match(roadmap, /071 \| Verificador E2E compatível com papel imutável/);
  assert.match(spec, /O roteiro não faz `INSERT` ou `UPDATE` em `user_profiles`/);
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

test("keeps methodology coherence live and makes project closure discoverable", async () => {
  const [methodology, finalMap, styles] = await Promise.all([
    readProjectFile("modules/research-workflow/methodology-workspace.tsx"),
    readProjectFile("modules/research-workflow/final-map-workspace.tsx"),
    readProjectFile("app/globals.css"),
  ]);

  assert.match(methodology, /methodologyCompatibilityWarnings/);
  assert.match(methodology, /atualizados enquanto você edita/);
  assert.match(methodology, /Nenhum aviso foi detectado nos dados atuais/);
  assert.match(methodology, /Encerramento do projeto/);
  assert.match(finalMap, /Encerrar projeto/);
  assert.match(finalMap, /Aguardando revisão/);
  assert.match(styles, /\.final-completion-panel/);
});


test("registers Change 074 production acceptance and cross-account isolation", async () => {
  const [verification, roadmap, spec, finalMap, advisorWorkspace] = await Promise.all([
    readProjectFile("scripts/verify-advisor-student-flow.ts"),
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/074-production-final-acceptance/spec.md"),
    readProjectFile("modules/research-workflow/final-map-workspace.tsx"),
    readProjectFile("modules/research-workflow/advisor-review-workspace.tsx"),
  ]);

  assert.match(verification, /assertActiveRolePersistsAcrossSession/);
  assert.match(verification, /Isolamento anterior ao vínculo/);
  assert.match(verification, /O comentário do orientador não ficou visível para o aluno/);
  assert.match(verification, /O projeto temporário permaneceu após a limpeza/);
  assert.match(finalMap, /Etapa 2\/4 · Passo 1\/2/);
  assert.match(finalMap, /Etapa 3\/4 · Passo 2\/2 · Capítulo 4/);
  assert.match(advisorWorkspace, /Etapa 4\/4 · Passo 1\/2 · Capítulo 3/);
  assert.match(roadmap, /074 \| Homologação final do fluxo completo em produção/);
  assert.match(spec, /gpt-5\.6-sol/);
});

test("registers Change 075 production operational stability", async () => {
  const [roadmap, objective, closure, operations, projectState, agentRules] = await Promise.all([
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/075-production-operational-stability/objective.md"),
    readProjectFile(".specs/changes/075-production-operational-stability/closure-evidence.md"),
    readProjectFile("docs/operations.md"),
    readProjectFile(".specs/project-state.md"),
    readProjectFile("AGENTS.md"),
  ]);

  assert.match(roadmap, /075 \| Estabilização operacional de produção \| Concluída/);
  assert.match(objective, /credencial server-side do Research Starter/);
  assert.match(closure, /gpt-5\.6-sol com raciocínio xhigh/);
  assert.match(closure, /dpl_A96gpBn81Z4Rfu5tqDxoRpYKACZi/);
  assert.match(operations, /research-starter:verify:production/);
  assert.match(projectState, /RESEARCH_STARTER_MAPA_API_KEY/);
  assert.match(agentRules, /node_modules\/next\/dist\/docs\//);
});

test("registers Change 076 explicit profiles and contextual controls", async () => {
  const [roadmap, closure, operations, presentation] = await Promise.all([
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/076-explicit-profile-role-interface/closure-evidence.md"),
    readProjectFile("docs/operations.md"),
    readProjectFile("modules/profile/presentation.ts"),
  ]);

  assert.match(roadmap, /076 \| Clareza dos perfis e interface contextual \| Concluída/);
  assert.match(closure, /gpt-5\.6-sol com raciocínio xhigh/);
  assert.match(closure, /dpl_AsVvML65fECUU2XfhCGaFN4anYGd/);
  assert.match(operations, /Perfil Aluno/);
  assert.match(presentation, /showAdvisorField: false/);
  assert.match(presentation, /showAdvisorField: true/);
});

test("registers Change 077 concise profile menu", async () => {
  const [roadmap, closure, operations, accountMenu, presentation] = await Promise.all([
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/077-concise-profile-menu/closure-evidence.md"),
    readProjectFile("docs/operations.md"),
    readProjectFile("modules/auth/account-menu.tsx"),
    readProjectFile("modules/profile/presentation.ts"),
  ]);

  assert.match(roadmap, /077 \| Menu de perfil conciso \| Concluída/);
  assert.match(closure, /dpl_HiCEa53yXkM9b2AWbnHvruEJ2vb1/);
  assert.match(operations, /identificação\s+explícita `Aluno` ou `Orientador`/);
  assert.doesNotMatch(accountMenu, /Área de trabalho:/);
  assert.doesNotMatch(accountMenu, /Este perfil permanece associado/);
  assert.doesNotMatch(presentation, /workspaceLabel/);
});

test("registers Change 078 reproducible social promo package", async () => {
  const [roadmap, closure, generator, manifestText, reportText, video] = await Promise.all([
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/078-social-promo-video/closure-evidence.md"),
    readProjectFile("scripts/generate-social-promo-c78.swift"),
    readProjectFile("outputs/social-promo-c78/manifest.json"),
    readProjectFile("outputs/social-promo-c78/technical-report.json"),
    readFile(new URL("../outputs/social-promo-c78/mapa-da-pesquisa-social-15s.mp4", import.meta.url)),
  ]);
  const manifest = JSON.parse(manifestText);
  const report = JSON.parse(reportText);

  assert.match(roadmap, /078 \| Vídeo promocional para redes sociais \| Concluída/);
  assert.match(closure, /gpt-5\.6-sol.*xhigh/);
  assert.match(generator, /SUA PESQUISA/);
  assert.match(generator, /ALUNO/);
  assert.match(generator, /ORIENTADOR/);
  assert.match(generator, /https:\/\/mapadapesquisa\.com\.br/);
  assert.equal(manifest.format.durationSeconds, 15);
  assert.equal(manifest.format.width, 1080);
  assert.equal(manifest.format.height, 1920);
  assert.equal(report.frameRate, 30);
  assert.equal(report.audioTrackCount, 1);
  assert.equal(report.qrPayload, "https://mapadapesquisa.com.br");
  assert.ok(video.byteLength > 1_000_000);
});

test("registers Change 079 premium promo while preserving version 1", async () => {
  const [roadmap, audit, generator, manifestText, reportText, videoV1, videoV2] = await Promise.all([
    readProjectFile(".specs/roadmap.md"),
    readProjectFile(".specs/changes/079-social-promo-premium/creative-audit.md"),
    readProjectFile("scripts/generate-social-promo-c79.swift"),
    readProjectFile("outputs/social-promo-c79/manifest.json"),
    readProjectFile("outputs/social-promo-c79/technical-report.json"),
    readFile(new URL("../outputs/social-promo-c78/mapa-da-pesquisa-social-15s.mp4", import.meta.url)),
    readFile(new URL("../outputs/social-promo-c79/mapa-da-pesquisa-social-15s-v2.mp4", import.meta.url)),
  ]);
  const manifest = JSON.parse(manifestText);
  const report = JSON.parse(reportText);
  const v1Hash = createHash("sha256").update(videoV1).digest("hex");

  assert.match(roadmap, /079 \| Vídeo promocional premium — versão 2 \| Concluída/);
  assert.match(audit, /interromper o scroll/);
  assert.match(generator, /TRAVOU\?/);
  assert.match(generator, /TRANSFORME SUA IDEIA/);
  assert.match(generator, /VOCÊ/);
  assert.match(generator, /NO CONTROLE\./);
  assert.match(generator, /TIRE SUA PESQUISA/);
  assert.equal(v1Hash, manifest.preservedVersion.sha256);
  assert.equal(report.soundtrackSource, "heygen-astral-aa1ba64cd12042e89800c7356498ff40");
  assert.equal(report.durationSeconds, 15);
  assert.equal(report.width, 1080);
  assert.equal(report.height, 1920);
  assert.equal(report.frameRate, 30);
  assert.equal(report.audioTrackCount, 1);
  assert.equal(report.qrPayload, "https://mapadapesquisa.com.br");
  assert.ok(videoV2.byteLength > 2_000_000);
});

test("embeds the supplied promotional video in the public landing page", async () => {
  const [landing, styles, roadmap, video, poster] = await Promise.all([
    readProjectFile("app/home.html/page.tsx"),
    readProjectFile("app/globals.css"),
    readProjectFile(".specs/roadmap.md"),
    readFile(new URL("../public/media/mapa-da-pesquisa-apresentacao.mp4", import.meta.url)),
    readFile(new URL("../public/media/mapa-da-pesquisa-apresentacao-poster.png", import.meta.url)),
  ]);

  assert.match(roadmap, /081 \| Vídeo de apresentação na landing page \| Concluída/);
  assert.match(landing, /id="apresentacao"/);
  assert.match(landing, /<video/);
  assert.match(landing, /preload="none"/);
  assert.match(landing, /playsInline/);
  assert.match(landing, /mapa-da-pesquisa-apresentacao\.mp4/);
  assert.match(landing, /mapa-da-pesquisa-apresentacao-poster\.png/);
  assert.match(styles, /\.landing-video \{ display:grid/);
  assert.match(styles, /@media \(max-width: 520px\).*\.landing-actions \{ display:grid; grid-template-columns:1fr; \}/);
  assert.equal(video.subarray(4, 8).toString("ascii"), "ftyp");
  assert.equal(poster.subarray(1, 4).toString("ascii"), "PNG");
  assert.ok(video.byteLength > 10_000_000);
  assert.ok(poster.byteLength > 500_000);
});


test("prepares the versioned account-mode database foundation without exposing the switch", async () => {
  const [migration, verifier, verificationSql, databaseTypes, requirements] = await Promise.all([
    readProjectFile("supabase/migrations/20260916163351_account_mode_database_foundation.sql"),
    readProjectFile("scripts/verify-account-mode-foundation.sh"),
    readProjectFile("scripts/verify-account-mode-foundation.sql"),
    readProjectFile("lib/supabase/database.types.ts"),
    readProjectFile(".specs/changes/083-account-mode-database-foundation/requirements.md"),
  ]);

  assert.match(migration, /^begin;/);
  assert.match(migration, /c083_projects_without_profiles/);
  assert.match(migration, /create table public.user_profile_role_events/);
  assert.match(migration, /alter table public.user_profile_role_events enable row level security/);
  assert.match(migration, /user_profile_role_events_actor_idx/);
  assert.match(migration, /revoke all on table public\.user_profile_role_events\s+from public, anon, authenticated/);
  assert.match(migration, /add column authoring_role text/);
  assert.match(migration, /c083_student_self_advised_projects/);
  assert.match(migration, /p\.advisor_id = p\.owner_id/);
  assert.match(migration, /else 'student'/);
  assert.match(migration, /new\.authoring_role := resolved_role/);
  assert.match(migration, /project_authoring_role_is_immutable/);
  assert.match(migration, /advisor_authored_project_cannot_have_supervisor/);
  assert.match(migration, /create or replace function public\.switch_active_role/);
  assert.match(migration, /role_version_conflict/);
  assert.match(migration, /idempotency_key_conflict/);
  assert.match(migration, /revoke all on function public\.switch_active_role\(text, bigint, uuid\)\s+from public, anon, authenticated, service_role/);
  assert.match(migration, /revoke update on table public.user_profiles from authenticated/);
  assert.match(migration, /commit;\s*$/);
  assert.match(verifier, /postgres:17-alpine/);
  assert.match(verifier, /trap cleanup/);
  assert.match(verificationSql, /verification_forged_authoring_was_trusted/);
  assert.match(verificationSql, /verification_switch_rpc_exposed/);
  assert.match(databaseTypes, /authoring_role: "student" \| "advisor"/);
  assert.match(databaseTypes, /user_profile_role_events/);
  assert.match(databaseTypes, /switch_active_role/);
  assert.match(requirements, /manter seu EXECUTE revogado até a C87/);
});
