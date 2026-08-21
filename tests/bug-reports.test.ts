import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("implements a private, rate-limited bug report intake", async () => {
  const [route, form, migration, links] = await Promise.all([
    readProjectFile("app/api/bug-reports/route.ts"),
    readProjectFile("modules/bug-reports/bug-report-form.tsx"),
    readProjectFile("supabase/migrations/20260821153000_create_bug_reports.sql"),
    readProjectFile("modules/legal/legal-links.tsx"),
  ]);

  assert.match(route, /checkRateLimit/);
  assert.match(route, /request\.formData/);
  assert.match(route, /BUG_REPORT_BUCKET/);
  assert.match(route, /RESEND_API_KEY/);
  assert.match(form, /Registrar relato/);
  assert.match(form, /attachment/);
  assert.match(links, /Relatar problema/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /bug_reports_select_reporter_or_admin/);
  assert.match(migration, /bug_report_attachments_insert_anonymous/);
  assert.match(migration, /public\.is_bug_report_admin/);
  assert.doesNotMatch(migration, /auth\.role\(\)/);
});

test("provides an authenticated admin triage surface", async () => {
  const [page, api, list, config] = await Promise.all([
    readProjectFile("app/admin/bugs/page.tsx"),
    readProjectFile("app/api/bug-reports/[id]/route.ts"),
    readProjectFile("modules/bug-reports/admin-list.tsx"),
    readProjectFile("modules/bug-reports/config.ts"),
  ]);

  assert.match(page, /isBugReportAdminEmail/);
  assert.match(page, /createSignedUrl/);
  assert.match(api, /PATCH/);
  assert.match(api, /BUG_REPORT_STATUSES/);
  assert.match(list, /Salvar triagem/);
  assert.match(list, /status-\$\{status\}/);
  assert.match(config, /marioreis@id\.uff\.br/);
  assert.match(config, /sfranca@id\.uff\.br/);
});
