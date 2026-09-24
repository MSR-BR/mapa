import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { evaluateProjectAuthorization } from "../modules/projects/authorization-policy";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

const student = { activeRole: "student" as const, email: "student@example.com", userId: "student-1" };
const advisor = { activeRole: "advisor" as const, email: "advisor@example.com", userId: "advisor-1" };
const studentProject = {
  advisorEmail: "advisor@example.com",
  advisorId: "advisor-1",
  authoringRole: "student" as const,
  ownerId: "student-1",
};
const advisorProject = {
  advisorEmail: null,
  advisorId: null,
  authoringRole: "advisor" as const,
  ownerId: "advisor-1",
};

test("enforces the strict student/advisor project matrix", () => {
  assert.deepEqual(evaluateProjectAuthorization({
    actor: student,
    capability: "related_read",
    project: studentProject,
    strictMode: true,
  }), { allowed: true, relation: "owner" });
  assert.deepEqual(evaluateProjectAuthorization({
    actor: { ...student, userId: "advisor-1" },
    capability: "related_read",
    project: advisorProject,
    strictMode: true,
  }), { allowed: false, code: "profile_mode_mismatch" });
  assert.deepEqual(evaluateProjectAuthorization({
    actor: advisor,
    capability: "related_read",
    project: advisorProject,
    strictMode: true,
  }), { allowed: true, relation: "owner" });
  assert.deepEqual(evaluateProjectAuthorization({
    actor: advisor,
    capability: "advisor_review",
    project: studentProject,
    strictMode: true,
  }), { allowed: true, relation: "advisor" });
  assert.deepEqual(evaluateProjectAuthorization({
    actor: { ...student, userId: "other-student" },
    capability: "related_read",
    project: studentProject,
    strictMode: true,
  }), { allowed: false, code: "project_not_found" });
  assert.deepEqual(evaluateProjectAuthorization({
    actor: { ...advisor, userId: "other-advisor", email: "other@example.com" },
    capability: "related_read",
    project: studentProject,
    strictMode: true,
  }), { allowed: false, code: "project_not_found" });
});

test("separates own projects from linked review projects in the dashboard", () => {
  const dashboard = read("app/dashboard/page.tsx");
  assert.match(dashboard, /ownedProjectsBase\.eq\("authoring_role", profile\.activeRole\)/);
  assert.match(dashboard, /advisedProjectsBase\.eq\("authoring_role", "student"\)\.eq\("advisor_id", userId\)/);
  assert.match(dashboard, /strictMode && isAdvisorMode/);
  assert.match(dashboard, />Projetos orientados</);
  assert.match(dashboard, /relation: project\.owner_id === userId \? "owner" as const : "advisor" as const/);
  assert.match(dashboard, /showAdvisorMetadata = project\.owner_id === userId && project\.authoring_role === "student"/);
});

test("authorizes direct URLs before loading project content", () => {
  const page = read("app/dashboard/projects/[id]/page.tsx");
  const authorizeAt = page.indexOf('authorizeProject(id, "related_read"');
  const fullProjectAt = page.indexOf('.select(\n      "id, title');
  const titleAt = page.indexOf("<h1>{project.title}</h1>");
  assert.ok(authorizeAt >= 0);
  assert.ok(authorizeAt < fullProjectAt);
  assert.ok(fullProjectAt < titleAt);
  assert.match(page, /isSelfDirectedProject = isOwner && access\.project\.authoring_role === "advisor"/);
  assert.doesNotMatch(page, /actor\.activeRole === "advisor"/);
});

test("keeps advisor-owned projects autonomous and removes student-only controls", () => {
  const page = read("app/dashboard/projects/[id]/page.tsx");
  const form = read("modules/projects/project-form.tsx");
  const actions = read("modules/projects/actions.ts");
  const workflowFiles = [
    "modules/research-workflow/research-definition-workspace.tsx",
    "modules/research-workflow/literature-development-workspace.tsx",
    "modules/research-workflow/methodology-workspace.tsx",
    "modules/research-workflow/final-map-workspace.tsx",
    "app/api/projects/[id]/definition/route.ts",
    "app/api/projects/[id]/chapters/route.ts",
    "app/api/projects/[id]/methodology/route.ts",
    "app/api/projects/[id]/final-map/route.ts",
  ].map(read).join("\n");

  assert.match(page, /isStudentAuthoredProject \? \(/);
  assert.match(form, /activeRole === "student"/);
  assert.match(actions, /access\.project\.authoring_role === "advisor"/);
  assert.match(actions, /if \(!isSelfDirectedProject\)/);
  assert.match(workflowFiles, /Enviar para validação/);
  assert.match(workflowFiles, /isSelfDirectedProject \? null : <AdvisorReviewNotice/);
  assert.match(workflowFiles, /access\.value\.project\.authoring_role === "advisor"/);
  assert.doesNotMatch(workflowFiles, /Validar pelo estudante|Validar como orientador|isAdvisorOwner/);
});

test("sends the profile version on every role-sensitive mutation surface", () => {
  const context = read("modules/profile/active-profile-context.tsx");
  const mutationClients = [
    "modules/generation/generation-workspace.tsx",
    "modules/projects/dashboard-project-grid.tsx",
    "modules/research-workflow/proposal-discovery-workspace.tsx",
    "modules/research-workflow/research-definition-workspace.tsx",
    "modules/research-workflow/literature-development-workspace.tsx",
    "modules/research-workflow/methodology-workspace.tsx",
    "modules/research-workflow/final-map-workspace.tsx",
    "modules/research-workflow/workflow-progress.tsx",
    "modules/research-workflow/manual-reference-panel.tsx",
    "modules/research-workflow/advisor-review-notice.tsx",
    "modules/research-workflow/advisor-review-workspace.tsx",
  ];
  assert.match(context, /"x-profile-role-version": String\(roleVersion\)/);
  for (const file of mutationClients) {
    assert.match(read(file), /profileMutationHeaders\(roleVersion\)/, file);
  }
  for (const file of [
    "modules/projects/quick-start-form.tsx",
    "modules/projects/project-form.tsx",
    "modules/projects/project-card-modal.tsx",
    "modules/projects/project-advisor-panel.tsx",
  ]) {
    assert.match(read(file), /name="profileRoleVersion"/, file);
  }
});

test("records real role context and a PII-free mode-change event", () => {
  const analytics = read("modules/analytics/analytics.ts");
  const settings = read("modules/profile/account-mode-settings.tsx");
  const workspaces = [
    "modules/generation/generation-workspace.tsx",
    "modules/research-workflow/proposal-discovery-workspace.tsx",
    "modules/research-workflow/research-definition-workspace.tsx",
    "modules/research-workflow/literature-development-workspace.tsx",
    "modules/research-workflow/methodology-workspace.tsx",
    "modules/research-workflow/final-map-workspace.tsx",
  ].map(read).join("\n");

  assert.match(analytics, /"profile_mode_changed"/);
  assert.equal((settings.match(/trackAnalyticsEvent\("profile_mode_changed"/g) ?? []).length, 2);
  assert.match(workspaces, /app_role: activeRole/);
  assert.doesNotMatch(settings, /email\s*:|projectId\s*:|project_id\s*:|project_title\s*:/i);
  assert.doesNotMatch(analytics, /email\??:|projectId\??:|project_id\??:/);
});
