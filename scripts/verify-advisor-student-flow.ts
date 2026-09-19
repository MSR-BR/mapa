import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "../lib/supabase/database.types";
import { createFinalMapDocxExport } from "../modules/export/docx";
import { createFinalMapPdfExport } from "../modules/export/pdf";
import {
  currentAdvisorReview,
  pendingAdvisorReview,
  withAdvisorReviewComment,
  withAdvisorReviewDecision,
  withAdvisorReviewRequest,
  type AdvisorTransition,
} from "../modules/research-workflow/advisor-review";
import {
  buildFinalMap,
  canCompleteFinalMap,
  finalMapSummary,
} from "../modules/research-workflow/final-map";
import {
  EMPTY_WORKFLOW_CONTENT,
  researchWorkflowContentSchema,
  type AdvisorReviewStep,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type StableWorkflowState,
  type ValidatedElement,
  type WorkflowState,
} from "../modules/research-workflow/schema";

type Client = SupabaseClient<Database>;
type ProjectVerificationRow = {
  advisor_email?: string | null;
  advisor_id?: string | null;
  authoring_role?: "advisor" | "student";
  id: string;
  owner_id: string;
  title?: string | null;
};
type WorkflowVerificationRow = {
  content: Json;
  owner_id: string;
  project_id: string;
  revision: number;
  schema_version: "2.0.0";
  source_revision: number;
  stable_state: StableWorkflowState;
  state: WorkflowState;
  updated_at: string;
};
type WorkflowUpdatedRow = {
  updated_at: string;
};
type AdvisorWorkflowReadRow = {
  content: Json;
  owner_id: string;
  project_id: string;
  revision: number;
  state: string;
};

const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PROJECT_REF",
  "MAPA_E2E_STUDENT_EMAIL",
  "MAPA_E2E_ADVISOR_EMAIL",
  "MAPA_E2E_PASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) throw new Error(`Variável obrigatória ausente: ${variable}`);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const runId = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
const password = process.env.MAPA_E2E_PASSWORD!;
const studentEmail = process.env.MAPA_E2E_STUDENT_EMAIL!.toLocaleLowerCase("pt-BR");
const advisorEmail = process.env.MAPA_E2E_ADVISOR_EMAIL!.toLocaleLowerCase("pt-BR");
const shouldCreateMissingUsers = process.env.MAPA_E2E_CREATE_USERS === "true";

function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // O fluxo E2E usa apenas Auth e Data API. O runner local pode estar em Node 20,
    // que não fornece WebSocket nativo; não abrimos canais Realtime neste script.
    realtime: { transport: class {} as never },
  });
}

async function ensureSignedIn(email: string, role: "advisor" | "student") {
  const client = createSupabaseClient();
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.data.session?.user) {
    return { client, email, userId: signIn.data.session.user.id };
  }
  if (!shouldCreateMissingUsers) {
    throw new Error(
      `Não foi possível autenticar a conta ${role}. ` +
      "Informe contas já confirmadas ou defina MAPA_E2E_CREATE_USERS=true para criar contas explicitamente fornecidas.",
    );
  }

  const signUp = await client.auth.signUp({
    email,
    options: { data: { purpose: "mapa-advisor-student-verification", role } },
    password,
  });
  if (signUp.error) {
    throw new Error(`Não foi possível criar a conta temporária ${role}: ${signUp.error.message}`);
  }
  if (!signUp.data.session?.user) {
    throw new Error(
      `A conta temporária ${role} foi criada, mas o Supabase exigiu confirmação por e-mail. ` +
      "Configure MAPA_E2E_STUDENT_EMAIL, MAPA_E2E_ADVISOR_EMAIL e MAPA_E2E_PASSWORD com contas já confirmadas para rodar este teste.",
    );
  }
  return { client, email, userId: signUp.data.session.user.id };
}

async function requireData<T>(operation: string, result: { data: T | null; error: { message: string } | null }) {
  if (result.error || result.data === null) throw new Error(`${operation}: ${result.error?.message ?? "sem retorno"}`);
  return result.data;
}

async function readProfile(account: { client: Client; userId: string }) {
  const { data, error } = await account.client
    .from("user_profiles")
    .select("active_role,role_version")
    .eq("user_id", account.userId)
    .single();
  if (error || !data) throw new Error(`Leitura do perfil: ${error?.message ?? "sem retorno"}`);
  if (data.active_role !== "student" && data.active_role !== "advisor") {
    throw new Error("O perfil de teste não possui um modo acadêmico válido.");
  }
  return { activeRole: data.active_role, roleVersion: data.role_version };
}

async function switchActiveRole(
  account: { client: Client; userId: string },
  nextRole: "advisor" | "student",
  expectedRoleVersion?: number,
  requestId = crypto.randomUUID(),
) {
  const current = expectedRoleVersion === undefined ? await readProfile(account) : null;
  const { data, error } = await account.client.rpc("switch_active_role", {
    expected_role_version: expectedRoleVersion ?? current!.roleVersion,
    next_role: nextRole,
    request_id: requestId,
  });
  if (error) throw new Error(`Troca para ${nextRole}: ${error.message}`);
  const row = (Array.isArray(data) ? data[0] : data) as {
    active_role?: string;
    role_version?: number;
  } | null;
  if (!row || row.active_role !== nextRole || typeof row.role_version !== "number") {
    throw new Error(`Troca para ${nextRole} retornou um estado inválido.`);
  }
  return { activeRole: nextRole, roleVersion: row.role_version };
}

async function ensureActiveRole(
  account: { client: Client; userId: string },
  role: "advisor" | "student",
) {
  const current = await readProfile(account);
  return current.activeRole === role
    ? current
    : switchActiveRole(account, role, current.roleVersion);
}

async function assertActiveRolePersistsAcrossSession(
  account: { client: Client; email: string; userId: string },
  expectedRole: "advisor" | "student",
) {
  const current = await readProfile(account);
  if (current.activeRole !== expectedRole) {
    throw new Error(`O modo ${expectedRole} não permaneceu ativo na sessão atual.`);
  }
  const freshAccount = await ensureSignedIn(account.email, expectedRole);
  try {
    const freshProfile = await readProfile(freshAccount);
    if (freshProfile.activeRole !== expectedRole || freshProfile.roleVersion !== current.roleVersion) {
      throw new Error(`O modo ${expectedRole} não persistiu após novo login.`);
    }
  } finally {
    await freshAccount.client.auth.signOut();
  }
}

async function assertDirectProfileUpdateDenied(
  account: { client: Client; userId: string },
) {
  const before = await readProfile(account);
  const nextRole = before.activeRole === "student" ? "advisor" : "student";
  const attemptedUpdate = await account.client
    .from("user_profiles")
    .update({ active_role: nextRole })
    .eq("user_id", account.userId)
    .select("active_role");
  if (!attemptedUpdate.error && (attemptedUpdate.data?.length ?? 0) > 0) {
    throw new Error("O modo ativo pôde ser alterado sem a RPC versionada.");
  }
  const after = await readProfile(account);
  if (after.activeRole !== before.activeRole || after.roleVersion !== before.roleVersion) {
    throw new Error("A tentativa direta alterou o perfil.");
  }
}

async function expectStaleRoleVersionDenied(
  account: { client: Client },
  staleRoleVersion: number,
) {
  const result = await account.client.rpc("switch_active_role", {
    expected_role_version: staleRoleVersion,
    next_role: "student",
    request_id: crypto.randomUUID(),
  });
  if (!result.error?.message.includes("role_version_conflict")) {
    throw new Error("Uma aba com role_version obsoleta não foi recusada.");
  }
}

function id() {
  return crypto.randomUUID();
}

function validElement(
  elementId: string,
  type: ValidatedElement["type"],
  content: string,
  referenceIds: string[] = [],
): ValidatedElement {
  return {
    approvedContent: content,
    id: elementId,
    proposedContent: content,
    referenceIds,
    revision: 1,
    sourceRevision: 1,
    status: "validated",
    studentJustification: "Justificativa registrada pelo estudante para validar esta decisão no mapa.",
    type,
    updatedBy: "user",
  };
}

function buildCompleteContent(projectId: string): ResearchWorkflowContent {
  const candidateIds = Array.from({ length: 6 }, () => id());
  const problemId = id();
  const generalId = id();
  const specificIds = [id(), id(), id()];
  const literatureIds = [id(), id(), id()];
  const developmentIds = [id(), id(), id()];
  const methodologyIds = [id(), id(), id(), id()];
  const titleId = id();
  const referenceIds = ["ref-arduino-1", "ref-physics-2", "ref-method-3"];
  const references = [
    {
      abstract: "Estudo sintético sobre atividades com Arduino e aprendizagem conceitual em Física.",
      authors: ["Ana Verificadora", "Bruno Docente"],
      doi: "10.1234/mapa.verify.1",
      journal: "Revista de Verificação Educacional",
      referenceId: referenceIds[0],
      source: "research_starter" as const,
      title: "Arduino e aprendizagem conceitual em Física escolar",
      url: "https://doi.org/10.1234/mapa.verify.1",
      volumeIssuePages: "12(1), 1-12",
      year: 2026,
    },
    {
      abstract: "Fonte sintética sobre investigação de compreensão conceitual no ensino médio.",
      authors: ["Carla Pesquisa"],
      doi: "10.1234/mapa.verify.2",
      journal: "Ensino de Ciências em Teste",
      referenceId: referenceIds[1],
      source: "research_starter" as const,
      title: "Compreensão de conceitos de Física no ensino médio",
      url: "https://doi.org/10.1234/mapa.verify.2",
      volumeIssuePages: "8(2), 20-34",
      year: 2025,
    },
    {
      abstract: "Fonte sintética sobre métodos mistos para avaliar intervenções educacionais.",
      authors: ["Daniel Método"],
      doi: null,
      journal: "Métodos em Educação",
      referenceId: referenceIds[2],
      source: "manual" as const,
      title: "Métodos mistos para avaliação de intervenções pedagógicas",
      url: "https://example.org/metodos-mistos",
      volumeIssuePages: "4(3), 44-60",
      year: 2024,
    },
  ];
  const problem = "Como o uso de atividades com Arduino influencia a compreensão de conceitos de Física no ensino médio?";
  const general = "Analisar como atividades com Arduino influenciam a compreensão de conceitos de Física no ensino médio.";
  const specifics = [
    "Identificar dificuldades conceituais de estudantes do ensino médio em tópicos de Física antes das atividades com Arduino.",
    "Planejar atividades experimentais com Arduino alinhadas aos conceitos de Física trabalhados no ensino médio.",
    "Avaliar mudanças na compreensão dos estudantes após a aplicação das atividades com Arduino em Física.",
  ];
  const literature = [
    "Aprendizagem conceitual em Física no ensino médio",
    "Uso de Arduino em atividades experimentais de ensino",
    "Avaliação de intervenções pedagógicas com tecnologias educacionais",
  ];
  const development = [
    "Apresentação do contexto escolar e da turma participante",
    "Sequência de atividades experimentais com Arduino",
    "Síntese da contribuição pedagógica para a compreensão de Física",
  ];

  const base = researchWorkflowContentSchema.parse({
    ...EMPTY_WORKFLOW_CONTENT,
    activeStep: null,
    discovery: {
      candidates: candidateIds.map((candidateId, index) => ({
        context: index === 0
          ? "Proposta mais próxima do pedido original, centrada em Arduino, Física e ensino médio."
          : `Alternativa ${index} para explorar recortes pedagógicos relacionados ao mesmo tema.`,
        id: candidateId,
        kind: index === 0 ? "exact" : "alternative",
        keywords: ["Arduino", "Física", "ensino médio"],
        knowledgeArea: "Ensino de Física",
        knowledgeAreaProposed: true,
        position: index + 1,
        problemQuestion: index === 0
          ? problem
          : `Como atividades com Arduino podem apoiar uma dimensão específica da aprendizagem de Física ${index}?`,
        referenceIds,
        title: index === 0 ? "Arduino e compreensão de Física" : `Alternativa Arduino ${index}`,
      })),
      generatedAt: new Date().toISOString(),
      interpreted: {
        keywords: ["Arduino", "ensino de Física", "ensino médio", "aprendizagem conceitual"],
        knowledgeArea: "Ensino de Física",
        knowledgeAreaProposed: true,
        researchQuery: "Arduino aprendizagem conceitual Física ensino médio",
        title: "Arduino e Física escolar",
      },
      originalPrompt: "Crie um mapa de pesquisa sobre o uso de Arduino para melhorar a compreensão de conceitos de Física no ensino médio.",
      references,
      reportId: `verify-${projectId}`,
      selectedCandidateId: candidateIds[0],
      warnings: [],
    },
    elements: [
      validElement(problemId, "problem_statement", problem, [referenceIds[0], referenceIds[1]]),
      validElement(generalId, "general_objective", general, [referenceIds[0], referenceIds[1]]),
      ...specificIds.map((specificId, index) => validElement(specificId, "specific_objective", specifics[index], [referenceIds[index % referenceIds.length]])),
      ...literatureIds.map((topicId, index) => validElement(topicId, "literature_topic", literature[index], [referenceIds[index % referenceIds.length]])),
      ...developmentIds.map((topicId, index) => validElement(topicId, "development_topic", development[index], [referenceIds[index % referenceIds.length]])),
      validElement(titleId, "research_title", "Arduino e compreensão de Física no ensino médio", [referenceIds[0], referenceIds[1]]),
    ],
    chapterTopicDetails: [
      ...literatureIds.map((topicId, index) => ({
        chapter: "literature" as const,
        exceptionJustification: null,
        generalObjectiveAligned: false,
        objectiveCoverage: [{ degree: "partial" as const, objectiveId: specificIds[index] }],
        order: index + 1,
        studentJustification: "Este tópico sustenta teoricamente uma decisão central do mapa.",
        topicId,
      })),
      {
        chapter: "development" as const,
        exceptionJustification: "O primeiro tópico apresenta o estudo de caso antes de vincular análises aos objetivos.",
        generalObjectiveAligned: false,
        objectiveCoverage: [],
        order: 1,
        studentJustification: "Este tópico contextualiza o estudo de caso para o orientador.",
        topicId: developmentIds[0],
      },
      {
        chapter: "development" as const,
        exceptionJustification: null,
        generalObjectiveAligned: false,
        objectiveCoverage: [{ degree: "full" as const, objectiveId: specificIds[1] }],
        order: 2,
        studentJustification: "Este tópico organiza a intervenção planejada com Arduino.",
        topicId: developmentIds[1],
      },
      {
        chapter: "development" as const,
        exceptionJustification: null,
        generalObjectiveAligned: true,
        objectiveCoverage: [{ degree: "full" as const, objectiveId: specificIds[2] }, { degree: "partial" as const, objectiveId: generalId }],
        order: 3,
        studentJustification: "Este tópico conecta a análise final ao objetivo geral.",
        topicId: developmentIds[2],
      },
    ],
    methodologyClassification: {
      analysisTechniques: ["Estatística descritiva (frequências, médias e desvio padrão)", "Análise documental", "Análise temática", "Triangulação mista"],
      approach: "Mista",
      ethicsWarnings: ["Será necessário consentimento informado dos estudantes e responsáveis quando aplicável."],
      instruments: ["Questionários", "Roteiro de observação", "Testes de compreensão"],
      nature: "Aplicada",
      objectives: ["Exploratória", "Descritiva"],
      procedures: ["Estudo de caso", "Pesquisa-ação", "Intervenção pedagógica"],
      rationale: "A classificação metodológica combina mensuração de compreensão e análise qualitativa da experiência pedagógica.",
      revision: 1,
      sourceRevision: 1,
      status: "validated",
      updatedBy: "user",
    },
    methodologyRows: [
      {
        analysisTreatment: "As respostas iniciais serão tratadas por estatística descritiva e categorização das principais dificuldades conceituais.",
        associatedTopicIds: [literatureIds[0], developmentIds[0]],
        dataCollection: "Serão aplicados questionários diagnósticos e testes de compreensão antes das atividades experimentais com Arduino.",
        expectedResult: "Espera-se identificar um panorama das dificuldades conceituais que orientará a intervenção pedagógica.",
        id: methodologyIds[0],
        objectiveId: specificIds[0],
        revision: 1,
        sourceRevision: 1,
        status: "validated",
        studentJustification: "Esta linha identifica a base diagnóstica necessária para o projeto.",
        updatedBy: "user",
        warnings: [],
      },
      {
        analysisTreatment: "O planejamento será analisado por análise documental, com matriz de categorias para verificar o alinhamento entre conceitos, sensores, atividades e objetivos didáticos.",
        associatedTopicIds: [literatureIds[1], developmentIds[1]],
        dataCollection: "Serão organizados planos de aula, roteiros de experimento e registros de preparação das atividades com Arduino.",
        expectedResult: "Espera-se produzir uma sequência de atividades coerente com os conceitos de Física selecionados.",
        id: methodologyIds[1],
        objectiveId: specificIds[1],
        revision: 1,
        sourceRevision: 1,
        status: "validated",
        studentJustification: "Esta linha mostra como a intervenção será estruturada antes da aplicação.",
        updatedBy: "user",
        warnings: [],
      },
      {
        analysisTreatment: "Os dados pós-intervenção serão analisados por comparação descritiva e análise temática das percepções dos estudantes.",
        associatedTopicIds: [literatureIds[2], developmentIds[2]],
        dataCollection: "Serão coletados testes pós-atividade, respostas abertas e registros de observação durante a aplicação das atividades.",
        expectedResult: "Espera-se avaliar mudanças na compreensão e registrar evidências pedagógicas associadas ao uso do Arduino.",
        id: methodologyIds[2],
        objectiveId: specificIds[2],
        revision: 1,
        sourceRevision: 1,
        status: "validated",
        studentJustification: "Esta linha avalia a mudança esperada após a intervenção.",
        updatedBy: "user",
        warnings: [],
      },
      {
        analysisTreatment: "Será realizada triangulação mista entre diagnóstico, planejamento e avaliação para produzir uma síntese interpretativa.",
        associatedTopicIds: [developmentIds[1], developmentIds[2]],
        dataCollection: "Serão integrados os registros do diagnóstico, da sequência didática e da avaliação posterior da compreensão conceitual.",
        expectedResult: "Espera-se consolidar uma interpretação geral sobre a influência das atividades com Arduino na compreensão de Física.",
        id: methodologyIds[3],
        objectiveId: generalId,
        revision: 1,
        sourceRevision: 1,
        status: "validated",
        studentJustification: "Esta linha sintetiza o objetivo geral do mapa.",
        updatedBy: "user",
        warnings: [],
      },
    ],
    referenceArchive: [references[2]],
    traceLinks: [
      { fromElementId: problemId, rule: "A problemática orienta o objetivo geral.", sourceRevision: 1, toElementId: generalId },
      ...specificIds.map((specificId) => ({ fromElementId: generalId, rule: "O objetivo específico contribui para o objetivo geral.", sourceRevision: 1, toElementId: specificId })),
      ...literatureIds.map((topicId, index) => ({ fromElementId: specificIds[index], rule: "O objetivo específico orienta tópico de literatura.", sourceRevision: 1, toElementId: topicId })),
      ...developmentIds.slice(1).map((topicId, index) => ({ fromElementId: specificIds[index + 1], rule: "O objetivo específico orienta tópico de desenvolvimento.", sourceRevision: 1, toElementId: topicId })),
    ],
  });

  const workflow: ResearchWorkflow = {
    content: base,
    ownerId: "00000000-0000-0000-0000-000000000001",
    projectId,
    revision: 1,
    schemaVersion: "2.0.0",
    sourceRevision: 1,
    stableState: "reviewing_map",
    state: "reviewing_map",
    updatedAt: new Date().toISOString(),
  };
  const finalMap = buildFinalMap(workflow);
  if (!canCompleteFinalMap(finalMap)) {
    throw new Error(`Conteúdo sintético inválido: ${finalMap.findings.map((finding) => finding.message).join(" | ")}`);
  }

  return researchWorkflowContentSchema.parse({
    ...base,
    elements: [
      ...base.elements,
      validElement(id(), "final_map", finalMapSummary(finalMap), referenceIds),
    ],
  });
}

async function assertFinalExports(
  project: ProjectVerificationRow,
  content: ResearchWorkflowContent,
) {
  const workflow: ResearchWorkflow = {
    content,
    ownerId: project.owner_id,
    projectId: project.id,
    revision: 1,
    schemaVersion: "2.0.0",
    sourceRevision: 1,
    stableState: "completed",
    state: "completed",
    updatedAt: new Date().toISOString(),
  };
  const finalMap = buildFinalMap(workflow);
  if (!canCompleteFinalMap(finalMap)) {
    throw new Error("O mapa sintético não ficou exportável.");
  }
  const input = {
    draft: false,
    exportedAt: new Date(),
    finalMap,
    project: {
      academic_level: "masters",
      keywords: ["C88", "alternância"],
      knowledge_area: "Validação de produto",
      problem_statement: "Como validar perfis alternáveis com isolamento e persistência?",
      theme: "Homologação de perfis alternáveis",
      title: project.title ?? "Homologação de perfis alternáveis",
    },
    revision: workflow.revision,
  };
  const [docx, pdf] = await Promise.all([
    createFinalMapDocxExport(input),
    createFinalMapPdfExport(input),
  ]);
  if (docx.subarray(0, 2).toString() !== "PK" || docx.byteLength < 4_000) {
    throw new Error("A exportação DOCX sintética ficou inválida.");
  }
  if (pdf.subarray(0, 4).toString() !== "%PDF" || pdf.byteLength < 4_000) {
    throw new Error("A exportação PDF sintética ficou inválida.");
  }
  return { docxBytes: docx.byteLength, pdfBytes: pdf.byteLength };
}

async function createProjectAndWorkflow(student: { client: Client; userId: string }) {
  const project = await requireData(
    "Criação do projeto do aluno",
    await student.client
      .from("projects")
      .insert({
        academic_level: "masters",
        keywords: ["Arduino", "Física", "ensino médio"],
        knowledge_area: "Ensino de Física",
        owner_id: student.userId,
        status: "draft",
        theme: "Arduino no ensino de Física",
        title: `Verificação orientador/aluno ${runId}`,
        workflow_version: 2,
      })
      .select("id,owner_id,title,authoring_role,advisor_id,advisor_email")
      .maybeSingle(),
  ) as ProjectVerificationRow;

  if (project.authoring_role !== "student") throw new Error("O projeto supervisionado não foi criado como Aluno.");
  const content = buildCompleteContent(project.id);
  const workflow = await requireData(
    "Criação do workflow do aluno",
    await student.client
      .from("research_workflows")
      .insert({
        content: content as unknown as Json,
        owner_id: student.userId,
        project_id: project.id,
        schema_version: "2.0.0",
        stable_state: "choosing_problem",
        state: "choosing_problem",
        validation_state: {},
      })
      .select("project_id, owner_id, schema_version, state, stable_state, revision, source_revision, content, updated_at")
      .maybeSingle(),
  ) as WorkflowVerificationRow;

  return {
    project,
    workflow: {
      content: researchWorkflowContentSchema.parse(workflow.content),
      ownerId: workflow.owner_id,
      projectId: workflow.project_id,
      revision: workflow.revision,
      schemaVersion: workflow.schema_version,
      sourceRevision: workflow.source_revision,
      stableState: workflow.stable_state,
      state: workflow.state,
      updatedAt: workflow.updated_at,
    } satisfies ResearchWorkflow,
  };
}

async function createRoleProject(
  account: { client: Client; userId: string },
  expectedRole: "advisor" | "student",
  modeLabel: "Mapa Avançado" | "Mapa Rápido",
) {
  const project = await requireData(
    `Criação de ${modeLabel} no modo ${expectedRole}`,
    await account.client
      .from("projects")
      .insert({
        academic_level: "masters",
        keywords: ["C88", "alternância", modeLabel],
        knowledge_area: "Validação de produto",
        owner_id: account.userId,
        status: "draft",
        theme: "Homologação de perfis alternáveis",
        title: `[C88 ${runId}] ${modeLabel} · ${expectedRole}`,
        workflow_version: 2,
      })
      .select("id,owner_id,title,authoring_role,advisor_id,advisor_email")
      .single(),
  ) as ProjectVerificationRow;
  if (project.authoring_role !== expectedRole) {
    throw new Error(`A autoria de ${modeLabel} não corresponde ao modo ${expectedRole}.`);
  }
  if (expectedRole === "advisor" && (project.advisor_id || project.advisor_email)) {
    throw new Error("O projeto próprio do Orientador não ficou autônomo.");
  }
  return project;
}

async function projectIsVisible(
  account: { client: Client },
  projectId: string,
) {
  const { data, error } = await account.client
    .from("projects")
    .select("id")
    .eq("id", projectId);
  if (error) throw new Error(`Leitura de visibilidade: ${error.message}`);
  return (data?.length ?? 0) === 1;
}

async function assertProjectVisibility(
  account: { client: Client },
  projectId: string,
  expected: boolean,
  label: string,
) {
  const visible = await projectIsVisible(account, projectId);
  if (visible !== expected) {
    throw new Error(`${label}: visibilidade esperada=${expected}, obtida=${visible}.`);
  }
}

async function saveWorkflow(
  actor: { client: Client },
  workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  state: WorkflowState,
  stableState: StableWorkflowState,
  sourceRevision = workflow.sourceRevision,
) {
  const nextRevision = workflow.revision + 1;
  // A margem evita que o relógio do runner fique alguns milissegundos atrás
  // do `created_at` gravado pelo Postgres na criação do workflow.
  const updatedAt = new Date(Date.now() + 5_000).toISOString();
  const saved = await requireData(
    "Atualização do workflow",
    await actor.client
      .from("research_workflows")
      .update({
        content: content as unknown as Json,
        revision: nextRevision,
        source_revision: sourceRevision,
        stable_state: stableState,
        state,
        updated_at: updatedAt,
      })
      .eq("project_id", workflow.projectId)
      .eq("owner_id", workflow.ownerId)
      .eq("revision", workflow.revision)
      .select("updated_at")
      .maybeSingle(),
  ) as WorkflowUpdatedRow;
  return {
    ...workflow,
    content,
    revision: nextRevision,
    sourceRevision,
    stableState,
    state,
    updatedAt: saved.updated_at,
  };
}

function activeStepForReview(step: AdvisorReviewStep): ResearchWorkflowContent["activeStep"] {
  return step === "final_map" ? null : step;
}

async function assertStudentProgressWithoutAdvisorDenied(
  student: { client: Client },
  workflow: ResearchWorkflow,
) {
  const attempted = await student.client
    .from("research_workflows")
    .update({
      content: { ...workflow.content, activeStep: "general_objective" } as unknown as Json,
      revision: workflow.revision + 1,
      stable_state: "validating_general_objective",
      state: "validating_general_objective",
      updated_at: new Date(Date.now() + 5_000).toISOString(),
    })
    .eq("project_id", workflow.projectId)
    .eq("owner_id", workflow.ownerId)
    .eq("revision", workflow.revision)
    .select("project_id");
  if (!attempted.error) {
    throw new Error("O aluno avançou diretamente sem informar e sem obter aprovação do orientador.");
  }

  const unchanged = await requireData(
    "Confirmação do bloqueio sem orientador",
    await student.client
      .from("research_workflows")
      .select("project_id,revision,state,stable_state")
      .eq("project_id", workflow.projectId)
      .maybeSingle(),
  ) as Pick<WorkflowVerificationRow, "project_id" | "revision" | "stable_state" | "state">;
  if (
    unchanged.revision !== workflow.revision
    || unchanged.state !== workflow.state
    || unchanged.stable_state !== workflow.stableState
  ) {
    throw new Error("A tentativa sem orientador alterou o workflow apesar da recusa.");
  }
}

async function submitStepForAdvisor(
  student: { client: Client },
  workflow: ResearchWorkflow,
  step: AdvisorReviewStep,
  transition: AdvisorTransition,
) {
  const sourceRevision = workflow.sourceRevision + 1;
  const content = withAdvisorReviewRequest(
    researchWorkflowContentSchema.parse({ ...workflow.content, activeStep: activeStepForReview(step) }),
    {
      advisorEmail,
      sourceRevision,
      step,
      studentEmail,
      transition,
    },
  );
  const saved = await saveWorkflow(student, workflow, content, workflow.state, workflow.stableState, sourceRevision);
  if (!pendingAdvisorReview(saved.content)) throw new Error(`A etapa ${step} não ficou pendente para o orientador.`);
  return saved;
}

async function advisorSaveComment(advisor: { client: Client; userId: string }, workflow: ResearchWorkflow) {
  const review = pendingAdvisorReview(workflow.content);
  if (!review) throw new Error("Nenhuma revisão pendente para comentar.");
  const content = withAdvisorReviewComment(workflow.content, {
    advisorComments: "Comentário de verificação salvo pelo orientador.",
    advisorId: advisor.userId,
    reviewId: review.id,
  });
  const saved = await saveWorkflow(advisor, workflow, content, workflow.state, workflow.stableState);
  const current = pendingAdvisorReview(saved.content);
  if (current?.advisorComments !== "Comentário de verificação salvo pelo orientador.") {
    throw new Error("Comentário do orientador não foi persistido.");
  }
  return saved;
}

async function advisorDecision(
  advisor: { client: Client; userId: string },
  workflow: ResearchWorkflow,
  status: "approved" | "changes_requested",
) {
  const review = pendingAdvisorReview(workflow.content);
  if (!review) throw new Error("Nenhuma revisão pendente para decisão.");
  const content = withAdvisorReviewDecision(workflow.content, {
    advisorComments: status === "approved" ? "Etapa validada no teste ponta-a-ponta." : "Solicitação de correção criada no teste.",
    advisorId: advisor.userId,
    reviewId: review.id,
    status,
  });
  const state = status === "approved" ? review.targetState : workflow.state;
  const stableState = status === "approved" ? review.targetStableState : workflow.stableState;
  const activeStep = status === "approved" ? review.targetActiveStep : workflow.content.activeStep;
  const saved = await saveWorkflow(
    advisor,
    workflow,
    researchWorkflowContentSchema.parse({ ...content, activeStep }),
    state,
    stableState,
  );
  const current = currentAdvisorReview(saved.content);
  if (status === "approved" && current?.status === "pending") throw new Error("A etapa aprovada continuou pendente.");
  if (status === "changes_requested" && current?.status !== "changes_requested") throw new Error("A solicitação de correção não foi registrada.");
  return saved;
}

async function cleanupProject(
  account: { client: Client; userId: string },
  projectId: string | null,
  authoringRole: "advisor" | "student",
) {
  if (!projectId) return;
  await ensureActiveRole(account, authoringRole);
  const workflowDeletion = await account.client.from("research_workflows").delete().eq("project_id", projectId);
  if (workflowDeletion.error) throw new Error("Limpeza do workflow temporário: " + workflowDeletion.error.message);
  const projectDeletion = await account.client.from("projects").delete().eq("id", projectId);
  if (projectDeletion.error) throw new Error("Limpeza do projeto temporário: " + projectDeletion.error.message);
  const remainingProject = await account.client.from("projects").select("id").eq("id", projectId).maybeSingle();
  if (remainingProject.error) throw new Error("Confirmação da limpeza temporária: " + remainingProject.error.message);
  if (remainingProject.data) throw new Error("O projeto temporário permaneceu após a limpeza.");
}

async function restoreOriginalRole(
  account: { client: Client; userId: string },
  originalRole: "advisor" | "student",
) {
  await ensureActiveRole(account, originalRole);
}

const accountA = await ensureSignedIn(studentEmail, "student");
const accountB = await ensureSignedIn(advisorEmail, "advisor");
const accountAOriginal = await readProfile(accountA);
const accountBOriginal = await readProfile(accountB);

let studentProjectId: string | null = null;
let accountAAdvisorProjectId: string | null = null;
let accountBStudentProjectId: string | null = null;
let accountBAdvisorProjectId: string | null = null;
let studentExportBytes: { docxBytes: number; pdfBytes: number } | null = null;
let advisorExportBytes: { docxBytes: number; pdfBytes: number } | null = null;
let failure: unknown = null;
const cleanupErrors: string[] = [];

try {
  await ensureActiveRole(accountA, "student");
  await assertActiveRolePersistsAcrossSession(accountA, "student");
  await assertDirectProfileUpdateDenied(accountA);

  await ensureActiveRole(accountB, "student");
  await assertActiveRolePersistsAcrossSession(accountB, "student");
  const accountBStudentProject = await createRoleProject(accountB, "student", "Mapa Rápido");
  accountBStudentProjectId = accountBStudentProject.id;

  const setup = await createProjectAndWorkflow(accountA);
  studentProjectId = setup.project.id;
  let workflow = setup.workflow;
  await assertProjectVisibility(accountB, studentProjectId, false, "Isolamento anterior ao vínculo");
  await assertStudentProgressWithoutAdvisorDenied(accountA, workflow);

  const linked = await requireData(
    "Vínculo do orientador",
    await accountA.client.rpc("set_project_advisor", {
      advisor_email_input: accountB.email,
      project_id_input: studentProjectId,
    }),
  );
  if (linked !== true) throw new Error("A conta B não foi vinculada como orientador.");

  await ensureActiveRole(accountB, "advisor");
  await assertActiveRolePersistsAcrossSession(accountB, "advisor");
  await assertProjectVisibility(accountB, accountBStudentProjectId, false, "Biblioteca estudantil da conta B no modo Orientador");

  await requireData("Claim do orientador", await accountB.client.rpc("claim_pending_advisor_projects"));
  const advisorProject = await requireData(
    "Leitura do projeto supervisionado",
    await accountB.client
      .from("projects")
      .select("id,owner_id,advisor_email,advisor_id,authoring_role")
      .eq("id", studentProjectId)
      .maybeSingle(),
  ) as ProjectVerificationRow;
  if (
    advisorProject.advisor_id !== accountB.userId
    || advisorProject.owner_id !== accountA.userId
    || advisorProject.authoring_role !== "student"
  ) {
    throw new Error("O projeto supervisionado não ficou visível/vinculado corretamente.");
  }

  const forbiddenProjectUpdate = await accountB.client
    .from("projects")
    .update({ title: "Atualização indevida do orientador" })
    .eq("id", studentProjectId)
    .select("id");
  if (!forbiddenProjectUpdate.error && (forbiddenProjectUpdate.data?.length ?? 0) > 0) {
    throw new Error("O orientador conseguiu alterar metadados acadêmicos do projeto do aluno.");
  }

  const transitions: Array<{ step: AdvisorReviewStep; transition: AdvisorTransition }> = [
    { step: "problem_statement", transition: { targetActiveStep: "general_objective", targetStableState: "validating_general_objective", targetState: "validating_general_objective" } },
    { step: "general_objective", transition: { targetActiveStep: "specific_objectives", targetStableState: "validating_specific_objectives", targetState: "validating_specific_objectives" } },
    { step: "specific_objectives", transition: { targetActiveStep: "literature_topics", targetStableState: "validating_literature", targetState: "validating_literature" } },
    { step: "literature_topics", transition: { targetActiveStep: "development_topics", targetStableState: "validating_development", targetState: "validating_development" } },
    { step: "development_topics", transition: { targetActiveStep: "methodology_matrix", targetStableState: "validating_methodology", targetState: "validating_methodology" } },
    { step: "methodology_matrix", transition: { targetActiveStep: null, targetStableState: "reviewing_map", targetState: "reviewing_map" } },
    { step: "final_map", transition: { targetActiveStep: null, targetStableState: "completed", targetState: "completed" } },
  ];

  workflow = await submitStepForAdvisor(accountA, workflow, transitions[0].step, transitions[0].transition);
  workflow = await advisorSaveComment(accountB, workflow);
  const studentCommentRead = await requireData(
    "Leitura do comentário pelo aluno",
    await accountA.client
      .from("research_workflows")
      .select("project_id,owner_id,content,revision,state")
      .eq("project_id", studentProjectId)
      .maybeSingle(),
  ) as AdvisorWorkflowReadRow;
  const observedReview = currentAdvisorReview(researchWorkflowContentSchema.parse(studentCommentRead.content));
  if (observedReview?.advisorComments !== "Comentário de verificação salvo pelo orientador.") {
    throw new Error("O comentário do orientador não ficou visível para o aluno.");
  }
  workflow = await advisorDecision(accountB, workflow, "changes_requested");
  if (currentAdvisorReview(workflow.content)?.status !== "changes_requested") {
    throw new Error("A solicitação de correção não ficou visível para o aluno.");
  }
  workflow = await submitStepForAdvisor(accountA, workflow, transitions[0].step, transitions[0].transition);
  workflow = await advisorDecision(accountB, workflow, "approved");

  for (const item of transitions.slice(1)) {
    workflow = await submitStepForAdvisor(accountA, workflow, item.step, item.transition);
    const advisorRead = await requireData(
      `Leitura do workflow pelo orientador em ${item.step}`,
      await accountB.client
        .from("research_workflows")
        .select("project_id,owner_id,content,revision,state")
        .eq("project_id", studentProjectId)
        .maybeSingle(),
    ) as AdvisorWorkflowReadRow;
    if (advisorRead.owner_id !== accountA.userId) {
      throw new Error(`O workflow supervisionado não pertence à conta A em ${item.step}.`);
    }
    workflow = await advisorDecision(accountB, workflow, "approved");
  }

  const finalMap = buildFinalMap(workflow);
  if (workflow.state !== "completed" || !canCompleteFinalMap(finalMap)) {
    throw new Error(`Fluxo não concluiu corretamente: ${finalMap.findings.map((finding) => finding.message).join(" | ")}`);
  }
  if (finalMap.references.length < 3) throw new Error("Referências não ficaram associadas ao mapa final.");
  if (workflow.content.advisorReviews.filter((review) => review.status === "approved").length !== transitions.length) {
    throw new Error("Nem todas as etapas foram aprovadas pelo orientador.");
  }
  if (!workflow.content.advisorReviews.some((review) => review.status === "changes_requested")) {
    throw new Error("O cenário de solicitação de correção não foi exercitado.");
  }
  studentExportBytes = await assertFinalExports(setup.project, workflow.content);

  const accountBAdvisorProject = await createRoleProject(accountB, "advisor", "Mapa Avançado");
  accountBAdvisorProjectId = accountBAdvisorProject.id;
  advisorExportBytes = await assertFinalExports(accountBAdvisorProject, buildCompleteContent(accountBAdvisorProject.id));
  await assertProjectVisibility(accountB, studentProjectId, true, "Projeto orientado no modo Orientador");

  const accountABeforeSwitch = await readProfile(accountA);
  const accountAAsAdvisor = await switchActiveRole(accountA, "advisor", accountABeforeSwitch.roleVersion);
  await expectStaleRoleVersionDenied(accountA, accountABeforeSwitch.roleVersion);
  await assertActiveRolePersistsAcrossSession(accountA, "advisor");
  await assertProjectVisibility(accountA, studentProjectId, false, "Projeto estudantil da conta A no modo Orientador");
  const accountAAdvisorProject = await createRoleProject(accountA, "advisor", "Mapa Avançado");
  accountAAdvisorProjectId = accountAAdvisorProject.id;
  await switchActiveRole(accountA, "student", accountAAsAdvisor.roleVersion);
  await assertActiveRolePersistsAcrossSession(accountA, "student");
  await assertProjectVisibility(accountA, studentProjectId, true, "Projeto estudantil restaurado na conta A");
  await assertProjectVisibility(accountA, accountAAdvisorProjectId, false, "Projeto autônomo oculto no modo Aluno");

  const accountBBeforeStudent = await readProfile(accountB);
  const accountBAsStudent = await switchActiveRole(accountB, "student", accountBBeforeStudent.roleVersion);
  await assertActiveRolePersistsAcrossSession(accountB, "student");
  await assertProjectVisibility(accountB, accountBStudentProjectId, true, "Projeto estudantil da conta B restaurado");
  await assertProjectVisibility(accountB, accountBAdvisorProjectId, false, "Projeto autônomo da conta B oculto no modo Aluno");
  await assertProjectVisibility(accountB, studentProjectId, false, "Projeto orientado oculto no modo Aluno");
  await switchActiveRole(accountB, "advisor", accountBAsStudent.roleVersion);
  await assertProjectVisibility(accountB, accountBStudentProjectId, false, "Projeto estudantil da conta B oculto no modo Orientador");
  await assertProjectVisibility(accountB, accountBAdvisorProjectId, true, "Projeto autônomo da conta B restaurado");
  await assertProjectVisibility(accountB, studentProjectId, true, "Projeto orientado restaurado");

  console.log(JSON.stringify({
    advisorReviews: workflow.content.advisorReviews.length,
    approvedReviews: workflow.content.advisorReviews.filter((review) => review.status === "approved").length,
    checked: [
      "login das duas contas sintéticas",
      "troca Aluno→Orientador→Aluno",
      "persistência do modo após novo login",
      "versão obsoleta recusada",
      "UPDATE direto do perfil recusado",
      "bibliotecas próprias isoladas por modo",
      "Mapa Rápido próprio como Aluno",
      "Mapa Avançado próprio como Orientador",
      "projeto autônomo sem supervisão",
      "isolamento anterior ao vínculo",
      "avanço sem orientador recusado sem alterar o workflow",
      "vínculo e leitura supervisionada",
      "bloqueio de edição acadêmica pelo orientador",
      "comentário e solicitação de correção",
      "aprovação de todas as etapas",
      "mapa final concluído",
      "referências associadas",
      "exportações PDF/DOCX válidas nos perfis Aluno e Orientador",
      "saída sem PII",
    ],
    exports: { advisor: advisorExportBytes, student: studentExportBytes },
    references: finalMap.references.length,
    status: "ok",
  }, null, 2));
} catch (error) {
  failure = error;
} finally {
  const cleanups: Array<[
    { client: Client; userId: string },
    string | null,
    "advisor" | "student",
  ]> = [
    [accountA, studentProjectId, "student"],
    [accountA, accountAAdvisorProjectId, "advisor"],
    [accountB, accountBStudentProjectId, "student"],
    [accountB, accountBAdvisorProjectId, "advisor"],
  ];
  for (const [account, projectId, role] of cleanups) {
    try {
      await cleanupProject(account, projectId, role);
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error.message : String(error));
    }
  }
  try {
    await restoreOriginalRole(accountA, accountAOriginal.activeRole);
  } catch (error) {
    cleanupErrors.push(error instanceof Error ? error.message : String(error));
  }
  try {
    await restoreOriginalRole(accountB, accountBOriginal.activeRole);
  } catch (error) {
    cleanupErrors.push(error instanceof Error ? error.message : String(error));
  }
  await accountA.client.auth.signOut().catch(() => {});
  await accountB.client.auth.signOut().catch(() => {});
}

if (failure) throw failure;
if (cleanupErrors.length > 0) throw new Error(cleanupErrors.join("; "));
