import { NextResponse } from "next/server";

import { GENERATION_MODEL, mergeResearchStructures } from "@/modules/generation/gemini";
import { STRUCTURE_PROMPT_VERSION } from "@/modules/generation/prompts/structure-v1";
import { isResearchStructure, RESEARCH_STRUCTURE_SCHEMA_VERSION, type ResearchStructure } from "@/modules/generation/schema";
import { toJson, type StoredReference } from "@/modules/generation/types";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { buildFinalMap, finalMapSummary, topicsFromContent } from "@/modules/research-workflow/final-map";
import {
  researchWorkflowContentSchema,
  researchWorkflowSchema,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
  type ValidatedElement,
} from "@/modules/research-workflow/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const maxDuration = 120;

function readReferences(value: unknown): StoredReference[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StoredReference => Boolean(
    item
    && typeof item === "object"
    && "referenceId" in item
    && typeof item.referenceId === "string"
    && "authors" in item
    && Array.isArray(item.authors),
  ));
}

function prepareSource(
  structure: ResearchStructure,
  sourceIndex: number,
  sourceReferences: StoredReference[],
) {
  const usedReferenceIds = new Set(structure.chapters.flatMap((chapter) => (
    chapter.sections.flatMap((section) => section.referenceIds)
  )));
  const prioritizedReferences = [
    ...sourceReferences.filter((reference) => usedReferenceIds.has(reference.referenceId)),
    ...sourceReferences.filter((reference) => !usedReferenceIds.has(reference.referenceId)),
  ].slice(0, 10);
  const referenceMap = new Map(
    prioritizedReferences.map((reference, referenceIndex) => [
      reference.referenceId,
      `P${sourceIndex + 1}-R${String(referenceIndex + 1).padStart(3, "0")}`,
    ]),
  );
  const references = prioritizedReferences.map((reference) => ({
    ...reference,
    referenceId: referenceMap.get(reference.referenceId)!,
  }));
  const compactStructure: ResearchStructure = {
    ...structure,
    chapters: structure.chapters.map((chapter) => ({
      ...chapter,
      sections: chapter.sections.map((section) => ({
        ...section,
        content: section.content.slice(0, 3_000),
        referenceIds: section.referenceIds
          .map((referenceId) => referenceMap.get(referenceId))
          .filter((referenceId): referenceId is string => Boolean(referenceId)),
      })),
    })),
  };
  return { references, structure: compactStructure };
}

type ProjectForIntegration = {
  academic_level: string | null;
  id: string;
  keywords: string[];
  knowledge_area: string | null;
  problem_statement: string | null;
  theme: string | null;
  title: string;
  workflow_version: number;
};

type StoredWorkflowRow = {
  content: unknown;
  owner_id: string;
  project_id: string;
  revision: number;
  schema_version: string;
  source_revision: number;
  stable_state: string;
  state: string;
  updated_at: string;
};

function approvedText(element: ValidatedElement | null | undefined) {
  return element?.approvedContent?.trim() || element?.proposedContent.trim() || "";
}

function findElement(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.find((element) => element.type === type);
}

function findElements(content: ResearchWorkflowContent, type: ValidatedElement["type"]) {
  return content.elements.filter((element) => element.type === type);
}

function uniqueReferenceIds(referenceIds: string[]) {
  return [...new Set(referenceIds.map((referenceId) => referenceId.trim()).filter(Boolean))].slice(0, 12);
}

function uniqueReferences(references: StoredReference[]) {
  return references.filter((reference, index, all) => (
    all.findIndex((item) => item.referenceId === reference.referenceId) === index
  ));
}

function workflowReferences(content: ResearchWorkflowContent): StoredReference[] {
  return uniqueReferences([...(content.discovery?.references ?? []), ...content.referenceArchive].map((reference) => ({
    authors: reference.authors,
    doi: reference.doi,
    referenceId: reference.referenceId,
    title: reference.title,
    url: reference.url,
    year: reference.year,
  })));
}

function section(chapterIndex: number, sectionIndex: number, title: string, content: string, referenceIds: string[] = []) {
  return {
    content: (content.trim() || "Conteúdo salvo no Mapa da Pesquisa para integração.").slice(0, 12_000),
    id: `chapter-${chapterIndex}-section-${sectionIndex}`,
    optional: false,
    provenance: "suggestion" as const,
    referenceIds: uniqueReferenceIds(referenceIds),
    title: title.trim().slice(0, 160),
  };
}

function listLines(values: string[], fallback: string) {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.map((value) => `- ${value}`).join("\n") : fallback;
}

function parseWorkflow(row: StoredWorkflowRow | undefined) {
  if (!row) return null;
  const content = researchWorkflowContentSchema.safeParse(row.content);
  if (!content.success) return null;
  const workflow = researchWorkflowSchema.safeParse({
    content: content.data,
    ownerId: row.owner_id,
    projectId: row.project_id,
    revision: row.revision,
    schemaVersion: row.schema_version,
    sourceRevision: row.source_revision,
    stableState: row.stable_state,
    state: row.state,
    updatedAt: row.updated_at,
  });
  return workflow.success ? workflow.data : null;
}

function workflowToResearchStructure(workflow: ResearchWorkflow, project: ProjectForIntegration): ResearchStructure {
  const content = workflow.content;
  const selectedCandidate = content.discovery?.candidates.find((candidate) => candidate.id === content.discovery?.selectedCandidateId);
  const problem = findElement(content, "problem_statement");
  const general = findElement(content, "general_objective");
  const title = findElement(content, "research_title");
  const finalMap = findElement(content, "final_map");
  const specificObjectives = findElements(content, "specific_objective");
  const literatureTopics = topicsFromContent(content, "literature");
  const developmentTopics = topicsFromContent(content, "development");
  const objectiveById = new Map(specificObjectives.map((objective) => [objective.id, approvedText(objective)]));
  const classification = content.methodologyClassification;
  const methodologyRows = content.methodologyRows;
  const objectiveReferenceIds = specificObjectives.flatMap((objective) => objective.referenceIds);
  const methodologyTopicReferenceIds = new Set(
    [...literatureTopics, ...developmentTopics]
      .filter((topic) => methodologyRows.some((row) => row.associatedTopicIds.includes(topic.id)))
      .flatMap((topic) => topic.referenceIds),
  );
  const finalMapText = finalMap?.status === "validated"
    ? approvedText(finalMap)
    : finalMapSummary(buildFinalMap(workflow));

  return {
    chapters: [
      {
        id: "chapter-1",
        number: 1,
        sections: [
          section(1, 1, "Problemática da pesquisa", approvedText(problem) || selectedCandidate?.problemQuestion || project.problem_statement || project.title, problem?.referenceIds ?? selectedCandidate?.referenceIds ?? []),
          section(1, 2, "Objetivo geral", approvedText(general) || `Objetivo geral em consolidação para: ${project.title}.`, general?.referenceIds ?? []),
          section(1, 3, "Objetivos específicos", listLines(specificObjectives.map(approvedText), "Objetivos específicos em consolidação no mapa salvo."), objectiveReferenceIds),
        ],
        title: "Introdução",
      },
      {
        id: "chapter-2",
        number: 2,
        sections: literatureTopics.length > 0
          ? literatureTopics.map((topic, index) => section(2, index + 1, topic.title, `${topic.label}. ${topic.title}`, topic.referenceIds))
          : [section(2, 1, "Revisão da literatura", `Tópicos de literatura em consolidação para: ${project.title}.`, objectiveReferenceIds)],
        title: "Revisão da Literatura",
      },
      {
        id: "chapter-3",
        number: 3,
        sections: [
          section(3, 1, "Classificação metodológica", [
            classification ? `Natureza: ${classification.nature}.` : "",
            classification ? `Abordagem: ${classification.approach}.` : "",
            classification ? `Objetivos metodológicos: ${classification.objectives.join(", ")}.` : "",
            classification ? `Procedimentos: ${classification.procedures.join(", ")}.` : "",
            classification ? `Instrumentos: ${classification.instruments.join(", ")}.` : "",
            classification ? `Técnicas de análise: ${classification.analysisTechniques.join(", ")}.` : "",
            classification ? `Justificativa: ${classification.rationale}` : "Matriz metodológica em consolidação no mapa salvo.",
          ].filter(Boolean).join("\n"), [...methodologyTopicReferenceIds]),
          section(3, 2, "Matriz metodológica", methodologyRows.length > 0 ? methodologyRows.map((row, index) => [
            `M${index + 1}. Objetivo: ${objectiveById.get(row.objectiveId) ?? row.objectiveId}`,
            `Levantamento: ${row.dataCollection}`,
            `Análise: ${row.analysisTreatment}`,
            `Resultado esperado: ${row.expectedResult}`,
          ].join("\n")).join("\n\n") : "Matriz metodológica em consolidação no mapa salvo.", [...methodologyTopicReferenceIds]),
        ],
        title: "Metodologia Científica",
      },
      {
        id: "chapter-4",
        number: 4,
        sections: developmentTopics.length > 0
          ? developmentTopics.map((topic, index) => section(4, index + 1, topic.title, `${topic.label}. ${topic.title}`, topic.referenceIds))
          : [section(4, 1, "Desenvolvimento da pesquisa", `Tópicos de desenvolvimento em consolidação para: ${project.title}.`, [...methodologyTopicReferenceIds])],
        title: "Desenvolvimento da Pesquisa",
      },
      {
        id: "chapter-5",
        number: 5,
        sections: [
          section(5, 1, "Resultados esperados e síntese", methodologyRows.length > 0
            ? listLines(methodologyRows.map((row) => row.expectedResult), finalMapText)
            : finalMapText, [...new Set([...objectiveReferenceIds, ...methodologyTopicReferenceIds])]),
        ],
        title: "Conclusões",
      },
    ],
    schemaVersion: RESEARCH_STRUCTURE_SCHEMA_VERSION,
    title: (approvedText(title) || selectedCandidate?.title || project.title).slice(0, 160),
    warnings: [
      "Fonte convertida automaticamente de um mapa v2 salvo para integração com IA.",
      ...content.coherenceFindings.filter((finding) => finding.severity !== "suggestion").map((finding) => finding.message),
    ].slice(0, 12),
  };
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const projectIds = body && typeof body === "object" && "projectIds" in body && Array.isArray(body.projectIds)
    ? [...new Set(body.projectIds.map(String))]
    : [];
  if (projectIds.length < 2 || projectIds.length > 4 || projectIds.some((id) => !UUID.test(id))) {
    return NextResponse.json({ error: "Selecione de 2 a 4 projetos válidos." }, { status: 400 });
  }

  const { supabase, userId } = await requireAuthenticatedUser();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, theme, problem_statement, keywords, knowledge_area, academic_level, workflow_version")
    .in("id", projectIds)
    .eq("owner_id", userId)
    .is("deleted_at", null);
  if (!projects || projects.length !== projectIds.length) {
    return NextResponse.json({ error: "Um dos projetos não foi encontrado." }, { status: 404 });
  }
  const orderedProjects = projectIds
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is ProjectForIntegration => Boolean(project));
  const sourceTitles = orderedProjects.map((project) => project.title);

  const [{ data: storedStructures }, { data: storedWorkflows }] = await Promise.all([
    supabase
      .from("research_structures")
      .select("project_id, content, references_data")
      .in("project_id", projectIds)
      .eq("owner_id", userId),
    supabase
      .from("research_workflows")
      .select("project_id, owner_id, schema_version, state, stable_state, revision, source_revision, content, updated_at")
      .in("project_id", projectIds)
      .eq("owner_id", userId),
  ]);

  const storedByProject = new Map((storedStructures ?? []).map((stored) => [stored.project_id, stored]));
  const workflowByProject = new Map((storedWorkflows ?? []).map((workflow) => [workflow.project_id, workflow as StoredWorkflowRow]));
  const sources: Array<{ structure: ResearchStructure; title: string }> = [];
  const references: StoredReference[] = [];
  for (const [sourceIndex, project] of orderedProjects.entries()) {
    const stored = storedByProject.get(project.id);
    const workflow = parseWorkflow(workflowByProject.get(project.id));
    const structure = workflow
      ? workflowToResearchStructure(workflow, project)
      : stored && isResearchStructure(stored.content)
        ? stored.content
        : null;
    const sourceReferences = workflow
      ? workflowReferences(workflow.content)
      : stored
        ? readReferences(stored.references_data)
        : [];
    if (!structure) {
      return NextResponse.json({ error: "Todos os projetos precisam ter um mapa salvo antes da integração." }, { status: 409 });
    }
    const prepared = prepareSource(structure, sourceIndex, sourceReferences);
    sources.push({ structure: prepared.structure, title: project.title });
    references.push(...prepared.references);
  }

  try {
    const structure = await mergeResearchStructures(sources, references);
    const theme = orderedProjects.map((project) => project.theme).filter(Boolean).join(" · ").slice(0, 500) || null;
    const problemStatement = `Integração dos projetos: ${sourceTitles.join("; ")}`.slice(0, 5_000);
    const keywords = [...new Set(orderedProjects.flatMap((project) => project.keywords))].slice(0, 12);
    const knowledgeArea = [...new Set(orderedProjects.map((project) => project.knowledge_area).filter(Boolean))].join(" / ").slice(0, 120) || null;
    const academicLevel = orderedProjects.map((project) => project.academic_level).find(Boolean) ?? null;
    const { data: integrated, error: projectError } = await supabase
      .from("projects")
      .insert({
        academic_level: academicLevel,
        keywords,
        knowledge_area: knowledgeArea,
        owner_id: userId,
        problem_statement: problemStatement,
        status: "generated",
        theme,
        title: structure.title,
      })
      .select("id")
      .single();
    if (projectError || !integrated) throw new Error("Não foi possível criar o projeto integrado.");

    const { error: structureError } = await supabase.from("research_structures").insert({
      content: toJson(structure),
      model: GENERATION_MODEL,
      owner_id: userId,
      project_id: integrated.id,
      prompt_version: `${STRUCTURE_PROMPT_VERSION}-merge`,
      references_data: toJson(references),
      schema_version: RESEARCH_STRUCTURE_SCHEMA_VERSION,
      warnings: structure.warnings,
    });
    if (structureError) {
      const now = new Date().toISOString();
      await supabase.from("projects").update({ deleted_at: now, updated_at: now }).eq("id", integrated.id).eq("owner_id", userId);
      throw new Error("Não foi possível salvar a estrutura integrada.");
    }
    return NextResponse.json({ projectId: integrated.id, sourceTitles });
  } catch (error) {
    console.error("project_integration_failed", {
      message: error instanceof Error ? error.message : "unknown-error",
      projectCount: projectIds.length,
      userId,
    });
    return NextResponse.json({ error: "Não foi possível integrar os projetos agora." }, { status: 502 });
  }
}
