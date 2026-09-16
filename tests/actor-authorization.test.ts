import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { evaluateActorRequirements, resolveProfileRecord } from "../modules/profile/actor-policy";
import { evaluateProjectAuthorization } from "../modules/projects/authorization-policy";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const student = { activeRole: "student" as const, email: "student@example.com", userId: "student-id" };
const advisor = { activeRole: "advisor" as const, email: "advisor@example.com", userId: "advisor-id" };
const studentProject = { advisorEmail: advisor.email, advisorId: advisor.userId, authoringRole: "student" as const, ownerId: student.userId };
const advisorProject = { advisorEmail: null, advisorId: null, authoringRole: "advisor" as const, ownerId: advisor.userId };

test("profile records and actor requirements fail closed", () => {
  assert.deepEqual(resolveProfileRecord(null, [], "v1"), { status: "missing" });
  assert.deepEqual(resolveProfileRecord(
    { active_role: "visitor", role_changed_at: "now", role_version: 1 }, [], "v1",
  ), { status: "invalid" });
  assert.deepEqual(resolveProfileRecord(
    { active_role: "student", role_changed_at: "now", role_version: 2 },
    [{ profile_role: "advisor", terms_version: "v1" }], "v1",
  ), { activeRole: "student", hasLegalConsent: false, roleChangedAt: "now", roleVersion: 2, status: "ready" });
  assert.deepEqual(resolveProfileRecord(
    { active_role: "advisor", role_changed_at: "now", role_version: 3 },
    [{ profile_role: "advisor", terms_version: "v1" }], "v1",
  ), { activeRole: "advisor", hasLegalConsent: true, roleChangedAt: "now", roleVersion: 3, status: "ready" });

  const requirements = [
    [{ profileStatus: "missing", requireLegalConsent: false, strictMode: true, verifyRoleVersion: false }, { allowed: false, code: "profile_required" }],
    [{ expectedRoleVersion: 4, hasLegalConsent: true, profileStatus: "ready", requireLegalConsent: true, roleVersion: 5, strictMode: true, verifyRoleVersion: true }, { allowed: false, code: "profile_mode_stale" }],
    [{ hasLegalConsent: false, profileStatus: "ready", requireLegalConsent: true, roleVersion: 5, strictMode: true, verifyRoleVersion: false }, { allowed: false, code: "profile_consent_required" }],
    [{ hasLegalConsent: false, profileStatus: "ready", requireLegalConsent: true, roleVersion: 5, strictMode: false, verifyRoleVersion: true }, { allowed: true }],
  ] as const;
  for (const [input, expected] of requirements) {
    assert.deepEqual(evaluateActorRequirements(input), expected);
  }
});

test("owner authoring requires the matching active mode", () => {
  assert.deepEqual(evaluateProjectAuthorization({ actor: student, capability: "owner", project: studentProject, strictMode: true }), { allowed: true, relation: "owner" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: advisor, capability: "owner", project: advisorProject, strictMode: true }), { allowed: true, relation: "owner" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: { ...student, activeRole: "advisor" }, capability: "owner", project: studentProject, strictMode: true }), { allowed: false, code: "profile_mode_mismatch" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: advisor, capability: "owner", project: studentProject, strictMode: true }), { allowed: false, code: "project_not_found" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: { ...student, activeRole: "advisor" }, capability: "owner", project: studentProject, strictMode: false }), { allowed: true, relation: "owner" });
});

test("supervision, review and reminders obey the actor matrix", () => {
  assert.deepEqual(evaluateProjectAuthorization({ actor: student, capability: "student_supervision", project: studentProject, strictMode: true }), { allowed: true, relation: "owner" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: advisor, capability: "student_supervision", project: advisorProject, strictMode: true }), { allowed: false, code: "profile_mode_mismatch" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: advisor, capability: "advisor_review", project: studentProject, strictMode: true }), { allowed: true, relation: "advisor" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: { ...advisor, userId: "pending-id" }, capability: "advisor_review", project: { ...studentProject, advisorId: null }, strictMode: true }), { allowed: false, code: "project_not_found" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: { ...advisor, userId: "pending-id" }, capability: "advisor_review", project: { ...studentProject, advisorId: null }, strictMode: false }), { allowed: true, relation: "advisor" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: { ...advisor, activeRole: "student" }, capability: "advisor_review", project: studentProject, strictMode: true }), { allowed: false, code: "profile_mode_mismatch" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: advisor, capability: "advisor_review", project: { ...studentProject, authoringRole: "advisor" }, strictMode: true }), { allowed: false, code: "profile_mode_mismatch" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: advisor, capability: "advisor_review", project: advisorProject, strictMode: true }), { allowed: false, code: "project_not_found" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: student, capability: "reminder", project: studentProject, strictMode: true }), { allowed: true, relation: "owner" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: advisor, capability: "reminder", project: studentProject, strictMode: true }), { allowed: true, relation: "advisor" });
  assert.deepEqual(evaluateProjectAuthorization({ actor: { ...advisor, email: "other@example.com", userId: "other-id" }, capability: "related_read", project: studentProject, strictMode: true }), { allowed: false, code: "project_not_found" });
});

test("every academic endpoint uses centralized authorization", () => {
  const routes = [
    "app/api/projects/[id]/advisor-review/remind/route.ts",
    "app/api/projects/[id]/advisor-review/route.ts",
    "app/api/projects/[id]/chapters/route.ts",
    "app/api/projects/[id]/definition/route.ts",
    "app/api/projects/[id]/discover/route.ts",
    "app/api/projects/[id]/exports/[format]/route.ts",
    "app/api/projects/[id]/final-map/route.ts",
    "app/api/projects/[id]/generate/route.ts",
    "app/api/projects/[id]/generation/route.ts",
    "app/api/projects/[id]/methodology/route.ts",
    "app/api/projects/[id]/navigation/route.ts",
    "app/api/projects/[id]/proposal-selection/route.ts",
    "app/api/projects/[id]/references/route.ts",
    "app/api/projects/integrate/route.ts",
  ];
  for (const route of routes) {
    const value = read(route);
    assert.match(value, /authorize(?:OwnedProjects|Project)Route/);
    assert.doesNotMatch(value, /requireAuthenticatedUser|createClient\(|loadUserProfile/);
    if (!route.includes("exports/[format]")) assert.match(value, /mutation: true/);
  }
  assert.match(read(routes[0]), /capability: "reminder"/);
  assert.match(read(routes[1]), /capability: "advisor_review"/);
  for (const route of [routes[2], routes[3], routes[6], routes[9]]) {
    assert.match(read(route), /authorizeProjectCapabilityResponse/);
    assert.match(read(route), /"student_supervision"/);
  }
});

test("identity, errors, consent and feature flag stay server authoritative", () => {
  const actor = read("modules/profile/authorization.ts");
  const storage = read("modules/profile/storage.ts");
  const auth = read("modules/projects/auth.ts");
  const legal = read("modules/legal/legal-consent-actions.ts");
  const actions = read("modules/projects/actions.ts");
  assert.match(actor, /import "server-only"/);
  assert.match(actor, /auth\.getClaims\(\)/);
  assert.match(actor, /profile_mode_stale/);
  assert.match(actor, /profile_mode_mismatch/);
  assert.match(storage, /UserProfileLoadError/);
  assert.doesNotMatch(storage, /activeRole:\s*"student"/);
  assert.match(auth, /status: error\.status/);
  assert.match(auth, /"Cache-Control": "private, no-store"/);
  assert.doesNotMatch(legal, /formData\.get\("profileRole"\)/);
  assert.match(legal, /profile_role: actor\.activeRole/);
  assert.match(actions, /requireActorContext/);
  assert.match(actions, /authorizeProject/);
  assert.match(actions, /"student_supervision"/);
  assert.doesNotMatch(actions, /requireAuthenticatedUser/);
  assert.match(read(".env.example"), /^ACCOUNT_MODE_SWITCH_ENABLED=false$/m);
});
