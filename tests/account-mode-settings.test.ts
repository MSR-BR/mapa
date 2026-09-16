import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  classifyProfileModeSwitchError,
  isProfileModeSwitchNoop,
  parseProfileModeSwitchInput,
  resolveProfileModeSwitchResult,
} from "../modules/profile/mode-switch-policy";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const requestId = "11111111-1111-4111-8111-111111111111";

test("validates the versioned and idempotent mode-switch request", () => {
  assert.deepEqual(parseProfileModeSwitchInput({
    expectedRoleVersion: "7",
    nextRole: "advisor",
    requestId,
  }), {
    ok: true,
    value: { expectedRoleVersion: 7, nextRole: "advisor", requestId },
  });
  for (const input of [
    { expectedRoleVersion: "0", nextRole: "advisor", requestId },
    { expectedRoleVersion: "1", nextRole: "visitor", requestId },
    { expectedRoleVersion: "1", nextRole: "student", requestId: "not-a-uuid" },
  ]) {
    assert.deepEqual(parseProfileModeSwitchInput(input), { ok: false });
  }
});

test("short-circuits only an exact no-op and leaves stale retries to the RPC", () => {
  const input = { expectedRoleVersion: 7, nextRole: "advisor" as const, requestId };
  assert.equal(isProfileModeSwitchNoop("advisor", 7, input), true);
  assert.equal(isProfileModeSwitchNoop("advisor", 8, input), false);
  assert.equal(isProfileModeSwitchNoop("student", 7, input), false);
});

test("accepts only a well-formed RPC result for the requested role", () => {
  assert.deepEqual(resolveProfileModeSwitchResult([{
    active_role: "student",
    role_changed_at: "2026-09-16T00:00:00.000Z",
    role_version: 8,
  }], "student"), {
    activeRole: "student",
    roleChangedAt: "2026-09-16T00:00:00.000Z",
    roleVersion: 8,
  });
  assert.equal(resolveProfileModeSwitchResult([], "student"), null);
  assert.equal(resolveProfileModeSwitchResult([{
    active_role: "advisor",
    role_changed_at: "now",
    role_version: 8,
  }], "student"), null);
});

test("maps database failures without leaking provider details", () => {
  assert.equal(classifyProfileModeSwitchError({ message: "role_version_conflict" }), "conflict");
  assert.equal(classifyProfileModeSwitchError({ details: "idempotency_key_conflict" }), "conflict");
  assert.equal(classifyProfileModeSwitchError({ message: "invalid_active_role" }), "invalid_request");
  assert.equal(classifyProfileModeSwitchError({ message: "permission denied for function switch_active_role" }), "unavailable");
  assert.equal(classifyProfileModeSwitchError({ message: "internal provider detail" }), "failed");
});

test("keeps settings, action, consent and cross-tab refresh server authoritative", () => {
  const action = read("modules/profile/actions.ts");
  const client = read("modules/profile/account-mode-settings.tsx");
  const sync = read("modules/profile/account-mode-sync.tsx");
  const page = read("app/dashboard/settings/page.tsx");
  const layout = read("app/dashboard/layout.tsx");
  const menu = read("modules/auth/account-menu.tsx");
  const legal = read("modules/legal/legal-consent-gate.tsx");
  const dashboard = read("app/dashboard/page.tsx");
  const styles = read("app/globals.css");
  const verifier = read("scripts/verify-account-mode-settings.sh");
  const verificationSql = read("scripts/verify-account-mode-settings.sql");

  assert.match(action, /isAccountModeSwitchEnabled\(\)/);
  assert.match(action, /requireActorContext\(\)/);
  assert.match(action, /isProfileModeSwitchNoop\(actor\.activeRole, actor\.roleVersion, parsed\.value\)/);
  assert.ok(
    action.indexOf("isProfileModeSwitchNoop")
      < action.indexOf('.rpc("switch_active_role"'),
  );
  assert.match(action, /\.rpc\("switch_active_role"/);
  assert.match(action, /revalidatePath\("\/dashboard", "layout"\)/);
  assert.doesNotMatch(action, /logout/);
  assert.match(page, /if \(!isAccountModeSwitchEnabled\(\)\) redirect\("\/dashboard"\)/);
  assert.match(menu, /accountModeSwitchEnabled && activeRole/);
  assert.match(menu, /href="\/dashboard\/settings"/);
  assert.match(layout, /AccountModeSync/);
  assert.match(sync, /BroadcastChannel/);
  assert.match(sync, /router\.refresh\(\)/);
  assert.doesNotMatch(sync, /activeRole|nextRole/);
  assert.match(client, /useActionState/);
  assert.match(client, /aria-modal="true"/);
  assert.match(client, /Usar como/);
  assert.match(client, /expectedRoleVersion/);
  assert.match(client, /crypto\.randomUUID\(\)/);
  assert.match(client, /router\.replace\("\/dashboard"\)/);
  assert.match(legal, /name="profileRoleVersion"/);
  assert.match(legal, /value=\{roleVersion\}/);
  assert.match(dashboard, /ownedProjectsBase\.eq\("authoring_role", profile\.activeRole\)/);
  assert.match(dashboard, /title="Projetos para revisar"/);
  assert.match(styles, /\.account-mode-options \{ display:grid; grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(verifier, /postgres:17-alpine/);
  assert.match(verificationSql, /verification_reverse_switch_failed/);
  assert.match(verificationSql, /verification_reverse_idempotent_replay_failed/);
  assert.match(verificationSql, /verification_expected_reverse_version_conflict/);
});
