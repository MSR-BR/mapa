import { NextResponse } from "next/server";

import { GENERATION_MODEL, mergeResearchStructures } from "@/modules/generation/gemini";
import { STRUCTURE_PROMPT_VERSION } from "@/modules/generation/prompts/structure-v1";
import { isResearchStructure, RESEARCH_STRUCTURE_SCHEMA_VERSION, type ResearchStructure } from "@/modules/generation/schema";
import { toJson, type StoredReference } from "@/modules/generation/types";
import { requireAuthenticatedUser } from "@/modules/projects/auth";

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
  const referenceMap = new Map(
    sourceReferences.slice(0, 10).map((reference, referenceIndex) => [
      reference.referenceId,
      `P${sourceIndex + 1}-R${String(referenceIndex + 1).padStart(3, "0")}`,
    ]),
  );
  const references = sourceReferences.slice(0, 10).map((reference) => ({
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
    .select("id, title, theme, problem_statement, keywords, knowledge_area, academic_level")
    .in("id", projectIds)
    .eq("owner_id", userId)
    .is("deleted_at", null);
  if (!projects || projects.length !== projectIds.length) {
    return NextResponse.json({ error: "Um dos projetos não foi encontrado." }, { status: 404 });
  }

  const { data: storedStructures } = await supabase
    .from("research_structures")
    .select("project_id, content, references_data")
    .in("project_id", projectIds)
    .eq("owner_id", userId);
  if (!storedStructures || storedStructures.length !== projectIds.length) {
    return NextResponse.json({ error: "Todos os projetos precisam ter uma estrutura salva." }, { status: 409 });
  }

  const storedByProject = new Map(storedStructures.map((stored) => [stored.project_id, stored]));
  const sources: Array<{ structure: ResearchStructure; title: string }> = [];
  const references: StoredReference[] = [];
  for (const [sourceIndex, project] of projects.entries()) {
    const stored = storedByProject.get(project.id);
    if (!stored || !isResearchStructure(stored.content)) {
      return NextResponse.json({ error: "Uma das estruturas salvas é inválida." }, { status: 409 });
    }
    const prepared = prepareSource(stored.content, sourceIndex, readReferences(stored.references_data));
    sources.push({ structure: prepared.structure, title: project.title });
    references.push(...prepared.references);
  }

  try {
    const structure = await mergeResearchStructures(sources, references);
    const theme = projects.map((project) => project.theme).filter(Boolean).join(" · ").slice(0, 500) || null;
    const problemStatement = `Integração dos projetos: ${projects.map((project) => project.title).join("; ")}`.slice(0, 5_000);
    const keywords = [...new Set(projects.flatMap((project) => project.keywords))].slice(0, 12);
    const knowledgeArea = [...new Set(projects.map((project) => project.knowledge_area).filter(Boolean))].join(" / ").slice(0, 120) || null;
    const academicLevel = projects.map((project) => project.academic_level).find(Boolean) ?? null;
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
    return NextResponse.json({ projectId: integrated.id });
  } catch (error) {
    console.error("project_integration_failed", {
      message: error instanceof Error ? error.message : "unknown-error",
      projectCount: projectIds.length,
      userId,
    });
    return NextResponse.json({ error: "Não foi possível integrar os projetos agora." }, { status: 502 });
  }
}
