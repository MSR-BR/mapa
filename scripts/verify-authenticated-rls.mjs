const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const userAEmail = process.env.TEST_USER_A_EMAIL ?? process.env.MAPA_E2E_STUDENT_EMAIL;
const userAPassword = process.env.TEST_USER_A_PASSWORD ?? process.env.MAPA_E2E_PASSWORD;
const userBEmail = process.env.TEST_USER_B_EMAIL ?? process.env.MAPA_E2E_ADVISOR_EMAIL;
const userBPassword = process.env.TEST_USER_B_PASSWORD ?? process.env.MAPA_E2E_PASSWORD;

for (const [name, value] of Object.entries({
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: apiKey,
  NEXT_PUBLIC_SUPABASE_URL: baseUrl,
  TEST_USER_A_OR_MAPA_E2E_STUDENT_EMAIL: userAEmail,
  TEST_USER_A_PASSWORD_OR_MAPA_E2E_PASSWORD: userAPassword,
  TEST_USER_B_OR_MAPA_E2E_ADVISOR_EMAIL: userBEmail,
  TEST_USER_B_PASSWORD_OR_MAPA_E2E_PASSWORD: userBPassword,
})) {
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
}

async function signIn(email, password) {
  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    body: JSON.stringify({ email, password }),
    headers: { apikey: apiKey, "Content-Type": "application/json" },
    method: "POST",
  });
  const body = await response.json();
  if (!response.ok || !body.access_token || !body.user?.id) {
    throw new Error(`Falha ao autenticar usuário de teste: HTTP ${response.status}`);
  }
  return { token: body.access_token, userId: body.user.id };
}

function projectHeaders(token, prefer = "return=representation") {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
}

async function readJson(response, operation) {
  const body = await response.json();
  if (!response.ok) throw new Error(`${operation} falhou: HTTP ${response.status}`);
  return body;
}

async function requireOk(response, operation) {
  if (!response.ok) throw new Error(`${operation} falhou: HTTP ${response.status}`);
}

async function readProfile(user) {
  const rows = await readJson(
    await fetch(`${baseUrl}/rest/v1/user_profiles?select=active_role,role_version&user_id=eq.${user.userId}`, {
      headers: projectHeaders(user.token, "return=minimal"),
    }),
    "Leitura do perfil",
  );
  const profile = rows[0];
  if (!profile || !["student", "advisor"].includes(profile.active_role)) {
    throw new Error("Perfil sintético ausente ou inválido.");
  }
  return profile;
}

async function switchRole(user, nextRole, expectedVersion) {
  const rows = await readJson(
    await fetch(`${baseUrl}/rest/v1/rpc/switch_active_role`, {
      body: JSON.stringify({
        expected_role_version: expectedVersion,
        next_role: nextRole,
        request_id: crypto.randomUUID(),
      }),
      headers: projectHeaders(user.token),
      method: "POST",
    }),
    `Troca para ${nextRole}`,
  );
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row || row.active_role !== nextRole) throw new Error(`Troca para ${nextRole} retornou estado inválido.`);
  return row;
}

async function ensureRole(user, role) {
  const profile = await readProfile(user);
  return profile.active_role === role ? profile : switchRole(user, role, profile.role_version);
}

const [userA, userB] = await Promise.all([
  signIn(userAEmail, userAPassword),
  signIn(userBEmail, userBPassword),
]);
const [userAOriginal, userBOriginal] = await Promise.all([
  readProfile(userA),
  readProfile(userB),
]);

let projectId;
let workflowCreated = false;
let failure = null;
const cleanupErrors = [];
try {
  await Promise.all([ensureRole(userA, "student"), ensureRole(userB, "student")]);

  const created = await readJson(
    await fetch(`${baseUrl}/rest/v1/projects?select=id,owner_id,authoring_role`, {
      body: JSON.stringify({ owner_id: userA.userId, title: "Verificação temporária de isolamento C88" }),
      headers: projectHeaders(userA.token),
      method: "POST",
    }),
    "Criação de projeto temporário",
  );
  if (
    created.length !== 1
    || created[0].owner_id !== userA.userId
    || created[0].authoring_role !== "student"
  ) {
    throw new Error("O projeto temporário não foi criado para o proprietário e modo esperados.");
  }
  projectId = created[0].id;

  const workflow = await readJson(
    await fetch(`${baseUrl}/rest/v1/research_workflows?select=project_id,owner_id,state`, {
      body: JSON.stringify({ owner_id: userA.userId, project_id: projectId }),
      headers: projectHeaders(userA.token),
      method: "POST",
    }),
    "Criação de workflow temporário",
  );
  if (workflow.length !== 1 || workflow[0].state !== "draft_prompt") {
    throw new Error("O workflow temporário não iniciou no estado esperado.");
  }
  workflowCreated = true;

  const encodedFilter = encodeURIComponent(`eq.${projectId}`);
  const readByB = await readJson(
    await fetch(`${baseUrl}/rest/v1/projects?select=id&id=${encodedFilter}`, {
      headers: projectHeaders(userB.token, "return=minimal"),
    }),
    "Leitura negativa pelo usuário B",
  );
  if (readByB.length !== 0) throw new Error("RLS permitiu leitura entre proprietários.");

  const updateByB = await readJson(
    await fetch(`${baseUrl}/rest/v1/projects?id=${encodedFilter}&select=id`, {
      body: JSON.stringify({ title: "Alteração indevida" }),
      headers: projectHeaders(userB.token),
      method: "PATCH",
    }),
    "Atualização negativa pelo usuário B",
  );
  if (updateByB.length !== 0) throw new Error("RLS permitiu atualização entre proprietários.");

  const deleteByB = await readJson(
    await fetch(`${baseUrl}/rest/v1/projects?id=${encodedFilter}&select=id`, {
      headers: projectHeaders(userB.token),
      method: "DELETE",
    }),
    "Exclusão negativa pelo usuário B",
  );
  if (deleteByB.length !== 0) throw new Error("RLS permitiu exclusão entre proprietários.");

  const readWorkflowByB = await readJson(
    await fetch(`${baseUrl}/rest/v1/research_workflows?select=project_id&project_id=${encodedFilter}`, {
      headers: projectHeaders(userB.token, "return=minimal"),
    }),
    "Leitura negativa do workflow pelo usuário B",
  );
  if (readWorkflowByB.length !== 0) throw new Error("RLS permitiu leitura cruzada do workflow.");

  const updateWorkflowByB = await readJson(
    await fetch(`${baseUrl}/rest/v1/research_workflows?project_id=${encodedFilter}&select=project_id`, {
      body: JSON.stringify({ state: "completed" }),
      headers: projectHeaders(userB.token),
      method: "PATCH",
    }),
    "Atualização negativa do workflow pelo usuário B",
  );
  if (updateWorkflowByB.length !== 0) throw new Error("RLS permitiu atualização cruzada do workflow.");

  console.log(JSON.stringify({
    checks: [
      "authenticated_owner_insert_returning",
      "cross_owner_project_read_denied",
      "cross_owner_project_update_denied",
      "cross_owner_project_delete_denied",
      "cross_owner_workflow_read_denied",
      "cross_owner_workflow_update_denied",
    ],
    status: "pass",
  }));
} catch (error) {
  failure = error;
} finally {
  try {
    await ensureRole(userA, "student");
    if (projectId && workflowCreated) {
      await requireOk(
        await fetch(`${baseUrl}/rest/v1/research_workflows?project_id=eq.${projectId}`, {
          headers: projectHeaders(userA.token, "return=minimal"),
          method: "DELETE",
        }),
        "Limpeza do workflow",
      );
    }
    if (projectId) {
      await requireOk(
        await fetch(`${baseUrl}/rest/v1/projects?id=eq.${projectId}`, {
          headers: projectHeaders(userA.token, "return=minimal"),
          method: "DELETE",
        }),
        "Limpeza do projeto",
      );
      const remaining = await readJson(
        await fetch(`${baseUrl}/rest/v1/projects?select=id&id=eq.${projectId}`, {
          headers: projectHeaders(userA.token, "return=minimal"),
        }),
        "Confirmação da limpeza",
      );
      if (remaining.length !== 0) throw new Error("O projeto temporário permaneceu após a limpeza.");
    }
  } catch (error) {
    cleanupErrors.push(error instanceof Error ? error.message : String(error));
  }
  try {
    await ensureRole(userA, userAOriginal.active_role);
  } catch (error) {
    cleanupErrors.push(error instanceof Error ? error.message : String(error));
  }
  try {
    await ensureRole(userB, userBOriginal.active_role);
  } catch (error) {
    cleanupErrors.push(error instanceof Error ? error.message : String(error));
  }
}

if (failure) throw failure;
if (cleanupErrors.length > 0) throw new Error(cleanupErrors.join("; "));
