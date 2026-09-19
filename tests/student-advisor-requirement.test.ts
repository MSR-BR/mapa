import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  projectAdvisorGate,
  STUDENT_ADVISOR_REQUIRED_CODE,
} from "../modules/research-workflow/advisor-requirement";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("requires an advisor only for student-authored progression", () => {
  assert.deepEqual(
    projectAdvisorGate({ advisorEmail: null, authoringRole: "student" }),
    { advisorEmail: null, kind: "advisor_required" },
  );
  assert.deepEqual(
    projectAdvisorGate({ advisorEmail: "  ORIENTADOR@EXAMPLE.EDU  ", authoringRole: "student" }),
    { advisorEmail: "orientador@example.edu", kind: "advisor_review" },
  );
  assert.deepEqual(
    projectAdvisorGate({ advisorEmail: "ignored@example.edu", authoringRole: "advisor" }),
    { advisorEmail: null, kind: "self_directed" },
  );
  assert.equal(STUDENT_ADVISOR_REQUIRED_CODE, "student_advisor_required");
});

test("blocks the first student decision in the interface until an advisor is saved", () => {
  const page = read("app/dashboard/projects/[id]/page.tsx");
  const panel = read("modules/projects/project-advisor-panel.tsx");
  const workspace = read("modules/research-workflow/research-definition-workspace.tsx");
  const actions = read("modules/projects/actions.ts");
  const styles = read("app/globals.css");

  assert.match(page, /advisorEmail=\{project\.advisor_email\}/);
  assert.match(panel, /id="project-advisor"/);
  assert.match(panel, /required\s+type="email"/);
  assert.match(panel, /obrigatório para validar a primeira decisão e avançar/i);
  assert.match(workspace, /const advisorRequired = !isSelfDirectedProject && !advisorEmail\?\.trim\(\)/);
  assert.match(workspace, /disabled=\{busy \|\| waitingForAdvisor \|\| advisorRequired\}/);
  assert.match(workspace, /Informe o orientador para avançar/);
  assert.match(workspace, /Enviar para validação/);
  assert.match(actions, /Projetos do perfil Aluno precisam de validação para avançar/);
  assert.doesNotMatch(actions, /Orientador removido deste projeto/);
  assert.match(styles, /\.student-advisor-required/);
});

test("enforces the advisor gate in every progression API", () => {
  for (const file of [
    "app/api/projects/[id]/definition/route.ts",
    "app/api/projects/[id]/chapters/route.ts",
    "app/api/projects/[id]/methodology/route.ts",
    "app/api/projects/[id]/final-map/route.ts",
  ]) {
    const route = read(file);
    assert.match(route, /projectAdvisorGate/);
    assert.match(route, /STUDENT_ADVISOR_REQUIRED_CODE/);
    assert.match(route, /advisorGate\?\.kind === "advisor_required"/);
    assert.match(route, /advisorGate\?\.kind === "advisor_review"/);
  }
});

test("ships a database trigger and isolated PostgreSQL proof against direct progress", () => {
  const migration = read("supabase/migrations/20260919123000_c089_require_student_advisor_approval.sql");
  const runner = read("scripts/verify-student-advisor-gate.sh");
  const verification = read("scripts/verify-student-advisor-gate.sql");
  const remoteE2e = read("scripts/verify-advisor-student-flow.ts");

  assert.match(migration, /create or replace function public\.enforce_student_advisor_workflow_progress\(\)/);
  assert.match(migration, /student_advisor_approval_required/);
  assert.match(migration, /student_advisor_email_required/);
  assert.match(migration, /student_advisor_review_transition_invalid/);
  assert.match(migration, /project_record\.authoring_role <> 'student'/);
  assert.match(runner, /postgres:17-alpine/);
  assert.match(runner, /20260919123000_c089_require_student_advisor_approval\.sql/);
  assert.match(verification, /verification_c89_expected_direct_progress_denial/);
  assert.match(verification, /verification_c89_advisor_approval_failed/);
  assert.match(verification, /verification_c89_advisor_autonomy_failed/);
  assert.match(remoteE2e, /assertStudentProgressWithoutAdvisorDenied/);
  assert.match(remoteE2e, /avanço sem orientador recusado sem alterar o workflow/);
});
