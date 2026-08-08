const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "TEST_USER_A_EMAIL",
  "TEST_USER_A_PASSWORD",
  "TEST_USER_B_EMAIL",
  "TEST_USER_B_PASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) throw new Error(`Variável obrigatória ausente: ${variable}`);
}

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

const [userA, userB] = await Promise.all([
  signIn(process.env.TEST_USER_A_EMAIL, process.env.TEST_USER_A_PASSWORD),
  signIn(process.env.TEST_USER_B_EMAIL, process.env.TEST_USER_B_PASSWORD),
]);

let projectId;
let workflowCreated = false;
try {
  const created = await readJson(
    await fetch(`${baseUrl}/rest/v1/projects?select=id,owner_id`, {
      body: JSON.stringify({ owner_id: userA.userId, title: "Verificação temporária de isolamento" }),
      headers: projectHeaders(userA.token),
      method: "POST",
    }),
    "Criação de projeto temporário",
  );

  if (created.length !== 1 || created[0].owner_id !== userA.userId) {
    throw new Error("O projeto temporário não foi criado para o proprietário esperado.");
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

  console.log("Isolamento autenticado confirmado para projetos e workflows.");
} finally {
  if (projectId) {
    if (workflowCreated) {
      await fetch(`${baseUrl}/rest/v1/research_workflows?project_id=eq.${projectId}`, {
        headers: projectHeaders(userA.token, "return=minimal"),
        method: "DELETE",
      });
    }
    const now = new Date().toISOString();
    await fetch(`${baseUrl}/rest/v1/projects?id=eq.${projectId}`, {
      body: JSON.stringify({ deleted_at: now, updated_at: now }),
      headers: projectHeaders(userA.token, "return=minimal"),
      method: "PATCH",
    });
  }
}
