import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const grantMigration = read("supabase/migrations/20260917003926_c087_grant_switch_active_role.sql");
const hardeningMigration = read("supabase/migrations/20260917003928_c087_harden_mode_aware_rls.sql");
const returningFixMigration = read("supabase/migrations/20260917015508_c087_fix_project_insert_returning.sql");

test("releases the switch RPC without reopening direct profile updates", () => {
  assert.match(grantMigration, /revoke all on function public\.switch_active_role\(text, bigint, uuid\)[\s\S]*from public, anon, authenticated, service_role/);
  assert.match(grantMigration, /grant execute on function public\.switch_active_role\(text, bigint, uuid\)[\s\S]*to authenticated/);
  assert.match(grantMigration, /revoke update on table public\.user_profiles from authenticated/);
  assert.doesNotMatch(grantMigration, /grant update on table public\.user_profiles/);
});

test("binds own project access to the active mode and immutable authorship", () => {
  assert.match(hardeningMigration, /create schema if not exists private/);
  assert.match(hardeningMigration, /revoke all on schema private from public, anon/);
  assert.match(hardeningMigration, /create or replace function private\.current_active_role\(\)[\s\S]*where up\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(hardeningMigration, /create or replace function private\.project_owned_in_active_mode[\s\S]*p\.authoring_role = \(select private\.current_active_role\(\)\)/);
  assert.match(hardeningMigration, /create policy "projects_insert_own"[\s\S]*owner_id = \(select auth\.uid\(\)\)[\s\S]*authoring_role = \(select private\.current_active_role\(\)\)/);
  assert.match(hardeningMigration, /create policy "projects_update_own"[\s\S]*with check \(\(select private\.project_owned_in_active_mode\(id, owner_id\)\)\)/);
  assert.match(hardeningMigration, /revoke update on table public\.projects from authenticated/);
  assert.match(hardeningMigration, /grant update \([\s\S]*workflow_version[\s\S]*\) on table public\.projects to authenticated/);
  assert.doesNotMatch(hardeningMigration.match(/grant update \([\s\S]*?\) on table public\.projects/)?.[0] ?? "", /advisor_id|advisor_email|owner_id|authoring_role/);
});

test("keeps project insert returning compatible with mode-aware selection", () => {
  assert.match(returningFixMigration, /drop policy if exists "projects_select_own"/);
  assert.match(returningFixMigration, /owner_id = \(select auth\.uid\(\)\)/);
  assert.match(returningFixMigration, /authoring_role = \(select private\.current_active_role\(\)\)/);
  assert.doesNotMatch(returningFixMigration, /project_owned_in_active_mode/);
});

test("authorizes child rows through the parent and separates linked review access", () => {
  for (const table of ["research_workflows", "generation_jobs", "research_structures"]) {
    assert.match(
      hardeningMigration,
      new RegExp(`create policy "${table}_select_own"[\\s\\S]*private\\.project_owned_in_active_mode\\(project_id, owner_id\\)`),
      table,
    );
  }
  assert.match(hardeningMigration, /create or replace function private\.project_reviewable_by_active_advisor[\s\S]*current_active_role\(\)\) = 'advisor'/);
  assert.match(hardeningMigration, /p\.owner_id <> \(select auth\.uid\(\)\)[\s\S]*p\.authoring_role = 'student'[\s\S]*p\.advisor_id = \(select auth\.uid\(\)\)/);
  assert.match(hardeningMigration, /create policy "research_workflows_update_advised"[\s\S]*with check \(\(select private\.project_reviewable_by_active_advisor/);
  assert.match(hardeningMigration, /projects_pending_advisor_email_idx[\s\S]*lower\(advisor_email\)[\s\S]*advisor_id is null/);
});

test("hardens supervision functions and the review trigger", () => {
  assert.match(hardeningMigration, /create or replace function public\.set_project_advisor[\s\S]*resolved_role is distinct from 'student'/);
  assert.match(hardeningMigration, /self_advising_not_allowed/);
  assert.match(hardeningMigration, /project_authoring_role <> 'student'/);
  assert.match(hardeningMigration, /create or replace function public\.claim_pending_advisor_projects[\s\S]*resolved_role is distinct from 'advisor'/);
  assert.match(hardeningMigration, /p\.authoring_role = 'student'[\s\S]*p\.owner_id <> current_user_id[\s\S]*p\.advisor_id is null/);
  assert.match(hardeningMigration, /create or replace function public\.restrict_advisor_workflow_update[\s\S]*advisor_workflow_content_not_allowed/);
  assert.match(hardeningMigration, /project_record\.advisor_id is distinct from current_user_id/);

  const securedFunctions: Array<[schema: "private" | "public", name: string]> = [
    ["private", "current_active_role"],
    ["private", "project_owned_in_active_mode"],
    ["private", "project_reviewable_by_active_advisor"],
    ["public", "set_project_advisor"],
    ["public", "claim_pending_advisor_projects"],
    ["public", "restrict_advisor_workflow_update"],
  ];
  for (const [schema, fn] of securedFunctions) {
    assert.match(
      hardeningMigration,
      new RegExp(`create or replace function ${schema}\\.${fn}[\\s\\S]*?security definer[\\s\\S]*?set search_path = ''`),
      `${schema}.${fn}`,
    );
  }
});

test("ships an isolated direct-client policy matrix", () => {
  const runner = read("scripts/verify-mode-aware-rls.sh");
  const verification = read("scripts/verify-mode-aware-rls.sql");

  assert.match(runner, /postgres:17-alpine/);
  assert.match(runner, /20260917003926_c087_grant_switch_active_role\.sql/);
  assert.match(runner, /20260917003928_c087_harden_mode_aware_rls\.sql/);
  assert.match(runner, /20260917015508_c087_fix_project_insert_returning\.sql/);
  assert.match(verification, /verification_student_projects_visible_in_advisor_mode/);
  assert.match(verification, /verification_advisor_owner_cross_mode_matrix/);
  assert.match(verification, /verification_pending_claim_failed/);
  assert.match(verification, /verification_expected_self_advising_denial/);
  assert.match(verification, /verification_expected_academic_tamper_denial/);
  assert.match(verification, /verification_missing_profile_visibility/);
  assert.match(verification, /verification_function_grants_invalid/);
  assert.match(verification, /verification_student_insert_returning_failed/);
  assert.match(verification, /verification_advisor_insert_returning_failed/);
});
