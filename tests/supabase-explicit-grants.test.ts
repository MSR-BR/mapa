import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  auditExplicitGrants,
  auditExplicitGrantRepository,
  loadExplicitGrantAudit,
} from "../scripts/verify-explicit-grants.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("keeps every owned Supabase object aligned with the explicit access manifest", async () => {
  const result = await auditExplicitGrantRepository(projectRoot);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.summary, {
    functions: 12,
    migrations: 19,
    sequences: 0,
    tables: 8,
    views: 0,
  });
});

test("fails when a future migration adds an undeclared exposed object", async () => {
  const input = await loadExplicitGrantAudit(projectRoot);
  input.migrations.push({
    name: "99999999999999_undeclared_object.sql",
    sql: `
      create table public.undeclared_object (id uuid primary key);
      alter table public.undeclared_object enable row level security;
      revoke all on table public.undeclared_object from public, anon, authenticated;
    `,
  });
  const result = auditExplicitGrants(input);
  assert.ok(result.errors.some((error) => error.includes("Tabela não declarado no manifesto: public.undeclared_object")));
});

test("fails when a future migration broadens a protected table grant", async () => {
  const input = await loadExplicitGrantAudit(projectRoot);
  input.migrations.push({
    name: "99999999999999_broad_grant.sql",
    sql: "grant all on table public.projects to authenticated;",
  });
  const result = auditExplicitGrants(input);
  assert.ok(result.errors.some((error) => error.includes("Grant amplo proibido em public.projects")));
});

test("fails when legacy default privileges are not explicitly removed", async () => {
  const input = await loadExplicitGrantAudit(projectRoot);
  const migration = input.migrations.find(({ name }) => name.includes("c104_reduce_legacy_explicit_grants"));
  assert.ok(migration);
  migration.sql = migration.sql.replace(
    /revoke all privileges on table[\s\S]*?from public, anon, authenticated, service_role;/,
    "",
  );
  const result = auditExplicitGrants(input);
  assert.ok(result.errors.some((error) => (
    error.includes("Privilégios divergentes para authenticated")
    || error.includes("Privilégios divergentes para service_role")
  )));
});
