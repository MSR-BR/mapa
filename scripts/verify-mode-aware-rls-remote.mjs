import { createClient } from "@supabase/supabase-js";

const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "MAPA_E2E_STUDENT_EMAIL",
  "MAPA_E2E_ADVISOR_EMAIL",
  "MAPA_E2E_PASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) throw new Error(`Variável obrigatória ausente: ${variable}`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.MAPA_E2E_PASSWORD;
const studentEmail = process.env.MAPA_E2E_STUDENT_EMAIL.toLowerCase();
const advisorEmail = process.env.MAPA_E2E_ADVISOR_EMAIL.toLowerCase();
const checks = [];

function client() {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function pass(name) {
  checks.push(name);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function signIn(email, label) {
  const supabase = client();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`${label}_signin:${error?.message ?? "missing_user"}`);
  return { id: data.user.id, label, supabase };
}

async function profile(account) {
  const { data, error } = await account.supabase
    .from("user_profiles")
    .select("active_role,role_version")
    .eq("user_id", account.id)
    .single();
  if (error || !data) throw new Error(`${account.label}_profile:${error?.message ?? "missing"}`);
  return data;
}

function rpcRow(data) {
  return Array.isArray(data) ? data[0] : data;
}

async function switchRole(account, role, version, requestId = crypto.randomUUID()) {
  const { data, error } = await account.supabase.rpc("switch_active_role", {
    expected_role_version: version,
    next_role: role,
    request_id: requestId,
  });
  if (error) throw new Error(`${account.label}_switch_${role}:${error.message}`);
  const row = rpcRow(data);
  if (!row || row.active_role !== role) throw new Error(`${account.label}_switch_invalid_result`);
  return row;
}

async function ensureRole(account, role) {
  const current = await profile(account);
  return current.active_role === role
    ? current
    : switchRole(account, role, current.role_version);
}

async function expectError(name, operation, fragment = "") {
  const result = await operation();
  if (!result.error) throw new Error(`${name}:expected_error`);
  if (fragment && !result.error.message.includes(fragment)) {
    throw new Error(`${name}:unexpected_error:${result.error.message}`);
  }
  pass(name);
}

async function visible(account, projectId) {
  const { data, error } = await account.supabase
    .from("projects")
    .select("id,title,authoring_role")
    .eq("id", projectId);
  if (error) throw new Error(`${account.label}_visibility:${error.message}`);
  return data ?? [];
}

async function removeProject(account, projectId) {
  if (!projectId) return;
  const { error } = await account.supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(`${account.label}_cleanup:${error.message}`);
}

let student;
let advisor;
let studentOriginal;
let advisorOriginal;
let studentProjectId = null;
let advisorProjectId = null;
let failure = null;
const cleanupErrors = [];

try {
  student = await signIn(studentEmail, "student");
  advisor = await signIn(advisorEmail, "advisor");
  studentOriginal = await profile(student);
  advisorOriginal = await profile(advisor);

  await ensureRole(student, "student");
  await ensureRole(advisor, "advisor");
  pass("synthetic_accounts_ready");

  const staleStart = await profile(student);
  const advisorMode = await switchRole(student, "advisor", staleStart.role_version);
  await expectError(
    "stale_role_version_denied",
    () => student.supabase.rpc("switch_active_role", {
      expected_role_version: staleStart.role_version,
      next_role: "student",
      request_id: crypto.randomUUID(),
    }),
    "role_version_conflict",
  );
  const studentMode = await switchRole(student, "student", advisorMode.role_version);
  const idempotencyKey = crypto.randomUUID();
  const firstNoop = await switchRole(student, "student", studentMode.role_version, idempotencyKey);
  const replayNoop = await switchRole(student, "student", studentMode.role_version, idempotencyKey);
  assert(firstNoop.role_version === replayNoop.role_version, "idempotency_version_mismatch");
  pass("role_switch_idempotent");

  await expectError(
    "direct_profile_update_denied",
    () => student.supabase
      .from("user_profiles")
      .update({ active_role: "advisor" })
      .eq("user_id", student.id)
      .select("active_role"),
  );

  const studentTitle = `[C87 E2E] Projeto estudantil ${Date.now()}`;
  const studentInsert = await student.supabase
    .from("projects")
    .insert({ keywords: [], owner_id: student.id, status: "draft", title: studentTitle })
    .select("id,title,authoring_role,advisor_id,advisor_email")
    .single();
  if (studentInsert.error || !studentInsert.data) {
    throw new Error(`student_insert_returning:${studentInsert.error?.message ?? "missing"}`);
  }
  studentProjectId = studentInsert.data.id;
  assert(studentInsert.data.authoring_role === "student", "student_authoring_role_mismatch");
  pass("student_insert_returning");

  const advisorTitle = `[C87 E2E] Projeto autônomo ${Date.now()}`;
  const advisorInsert = await advisor.supabase
    .from("projects")
    .insert({ keywords: [], owner_id: advisor.id, status: "draft", title: advisorTitle })
    .select("id,title,authoring_role,advisor_id,advisor_email")
    .single();
  if (advisorInsert.error || !advisorInsert.data) {
    throw new Error(`advisor_insert_returning:${advisorInsert.error?.message ?? "missing"}`);
  }
  advisorProjectId = advisorInsert.data.id;
  assert(advisorInsert.data.authoring_role === "advisor", "advisor_authoring_role_mismatch");
  assert(advisorInsert.data.advisor_id === null && advisorInsert.data.advisor_email === null, "advisor_project_not_autonomous");
  pass("advisor_insert_returning");

  assert((await visible(student, advisorProjectId)).length === 0, "student_saw_advisor_project");
  assert((await visible(advisor, studentProjectId)).length === 0, "advisor_saw_unlinked_student_project");
  pass("cross_account_isolation");

  await expectError(
    "direct_supervision_update_denied",
    () => student.supabase
      .from("projects")
      .update({ advisor_id: advisor.id })
      .eq("id", studentProjectId)
      .select("id"),
  );

  await expectError(
    "self_advising_denied",
    () => student.supabase.rpc("set_project_advisor", {
      advisor_email_input: studentEmail,
      project_id_input: studentProjectId,
    }),
    "self_advising_not_allowed",
  );

  const link = await student.supabase.rpc("set_project_advisor", {
    advisor_email_input: advisorEmail,
    project_id_input: studentProjectId,
  });
  if (link.error) throw new Error(`advisor_link:${link.error.message}`);
  assert(link.data === true, "advisor_link_not_resolved");
  assert((await visible(advisor, studentProjectId)).length === 1, "advisor_cannot_read_linked_project");
  pass("linked_advisor_read");

  const tamper = await advisor.supabase
    .from("projects")
    .update({ title: "[C87 E2E] alteração indevida" })
    .eq("id", studentProjectId)
    .select("id");
  assert(Boolean(tamper.error) || (tamper.data?.length ?? 0) === 0, "advisor_modified_student_project");
  const ownerRead = await visible(student, studentProjectId);
  assert(ownerRead[0]?.title === studentTitle, "student_title_changed_by_advisor");
  pass("advisor_academic_update_denied");

  const studentBefore = await profile(student);
  const studentAsAdvisor = await switchRole(student, "advisor", studentBefore.role_version);
  assert((await visible(student, studentProjectId)).length === 0, "student_project_visible_in_advisor_mode");
  await switchRole(student, "student", studentAsAdvisor.role_version);
  assert((await visible(student, studentProjectId)).length === 1, "student_project_not_restored");
  pass("student_mode_isolation");

  const advisorBefore = await profile(advisor);
  const advisorAsStudent = await switchRole(advisor, "student", advisorBefore.role_version);
  assert((await visible(advisor, advisorProjectId)).length === 0, "advisor_project_visible_in_student_mode");
  assert((await visible(advisor, studentProjectId)).length === 0, "linked_project_visible_in_student_mode");
  await expectError(
    "advisor_project_supervision_denied",
    () => advisor.supabase.rpc("set_project_advisor", {
      advisor_email_input: studentEmail,
      project_id_input: advisorProjectId,
    }),
    "student_authored_project_required",
  );
  await switchRole(advisor, "advisor", advisorAsStudent.role_version);
  assert((await visible(advisor, advisorProjectId)).length === 1, "advisor_project_not_restored");
  assert((await visible(advisor, studentProjectId)).length === 1, "linked_project_not_restored");
  pass("advisor_mode_isolation");
} catch (error) {
  failure = error;
} finally {
  if (student) {
    try {
      await ensureRole(student, "student");
      await removeProject(student, studentProjectId);
      studentProjectId = null;
    } catch (error) {
      cleanupErrors.push(`student_cleanup:${error.message}`);
    }
  }
  if (advisor) {
    try {
      await ensureRole(advisor, "advisor");
      await removeProject(advisor, advisorProjectId);
      advisorProjectId = null;
    } catch (error) {
      cleanupErrors.push(`advisor_cleanup:${error.message}`);
    }
  }
  if (student && studentOriginal) {
    try {
      await ensureRole(student, studentOriginal.active_role);
    } catch (error) {
      cleanupErrors.push(`student_restore:${error.message}`);
    }
  }
  if (advisor && advisorOriginal) {
    try {
      await ensureRole(advisor, advisorOriginal.active_role);
    } catch (error) {
      cleanupErrors.push(`advisor_restore:${error.message}`);
    }
  }
  if (student) await student.supabase.auth.signOut().catch(() => {});
  if (advisor) await advisor.supabase.auth.signOut().catch(() => {});
}

if (failure) throw failure;
if (cleanupErrors.length > 0) throw new Error(cleanupErrors.join(";"));
pass("temporary_data_cleaned_and_roles_restored");
console.log(JSON.stringify({ checks, status: "pass" }));
