import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path: string) => (
  readFile(new URL(`../${path}`, import.meta.url), "utf8")
);

test("registers the S3 security profile and a remote-aware release gate", async () => {
  const [profile, gate, c102Spec, c103Spec, packageJson] = await Promise.all([
    readProjectFile(".specs/security/profile.md"),
    readProjectFile(".specs/security/release-gate.md"),
    readProjectFile(".specs/changes/102-transversal-security-infrastructure/spec.md"),
    readProjectFile(".specs/changes/103-supabase-explicit-grants-readiness/spec.md"),
    readProjectFile("package.json"),
  ]);

  assert.match(profile, /S3_SENSITIVE/);
  assert.match(profile, /Ações que exigem autorização explícita/);
  assert.match(profile, /Rate limit distribuído \| Parcial/);
  assert.match(gate, /PASS_WITH_ACCEPTED_RISK/);
  assert.match(gate, /Aprovação técnica local não autoriza mutação remota/);
  assert.match(c102Spec, /nenhuma consulta, migration, grant ou policy Supabase foi executada/i);
  assert.match(c103Spec, /Nenhuma consulta, migration, grant, policy\s+ou alteração foi executada no Supabase remoto/i);
  assert.match(packageJson, /"security:gate"/);
  assert.match(packageJson, /"supabase:release-gate"/);
});

test("keeps public abuse, webhook and private upload controls explicit", async () => {
  const [bugRoute, bugMigration, supportRoute, promptRoute, inboundRoute, researchStarterRoute] = await Promise.all([
    readProjectFile("app/api/bug-reports/route.ts"),
    readProjectFile("supabase/migrations/20260821153000_create_bug_reports.sql"),
    readProjectFile("app/api/support/route.ts"),
    readProjectFile("app/api/prompt-suggestions/route.ts"),
    readProjectFile("app/api/inbound/resend/route.ts"),
    readProjectFile("app/api/research-starter/reports/route.ts"),
  ]);

  for (const route of [bugRoute, supportRoute, promptRoute]) assert.match(route, /checkRateLimit/);
  assert.match(inboundRoute, /RESEND_WEBHOOK_SECRET/);
  assert.match(inboundRoute, /webhooks\.verify/);
  assert.match(inboundRoute, /MAX_FORWARD_ATTACHMENT_BYTES/);
  assert.match(researchStarterRoute, /requireAuthenticatedUser/);
  assert.match(bugRoute, /MAX_ATTACHMENT_BYTES = 5 \* 1024 \* 1024/);
  assert.match(bugRoute, /image\/png/);
  assert.match(bugRoute, /safeFileName/);
  assert.match(bugRoute, /upsert: false/);
  assert.match(bugMigration, /values \('bug-report-attachments', 'bug-report-attachments', false\)/);
  assert.match(bugMigration, /bug_report_attachments_select_owner_or_admin/);
});

test("routes sensitive runtime events through centralized sanitized loggers", async () => {
  const runtimeFiles = [
    "app/api/bug-reports/route.ts",
    "app/api/inbound/resend/route.ts",
    "app/api/prompt-suggestions/route.ts",
    "app/api/projects/[id]/discover/route.ts",
    "app/api/projects/[id]/generate/route.ts",
    "app/api/projects/integrate/route.ts",
    "lib/email/project-notifications.ts",
    "modules/projects/actions.ts",
  ];
  const texts = await Promise.all(runtimeFiles.map(readProjectFile));
  for (const [index, source] of texts.entries()) {
    assert.doesNotMatch(source, /console\.(?:error|warn|info)\s*\(/, runtimeFiles[index]);
  }

  const logger = await readProjectFile("lib/observability/request-context.ts");
  assert.match(logger, /SAFE_ERROR_CODE_PATTERN/);
  assert.match(logger, /logSanitizedOperationalFailure/);
  assert.doesNotMatch(texts.join("\n"), /message:\s*error instanceof Error/);
});
