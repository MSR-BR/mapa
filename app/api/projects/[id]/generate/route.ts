import { NextResponse } from "next/server";

import {
  broadenResearchQuery,
  GENERATION_MODEL,
  generateResearchStructure,
  interpretResearchRequest,
} from "@/modules/generation/gemini";
import { STRUCTURE_PROMPT_VERSION } from "@/modules/generation/prompts/structure-v1";
import { RESEARCH_STRUCTURE_SCHEMA_VERSION } from "@/modules/generation/schema";
import { loadGenerationSnapshot } from "@/modules/generation/storage";
import { toJson } from "@/modules/generation/types";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { fetchResearchStarterReport } from "@/modules/research-starter/client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const maxDuration = 120;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const idempotencyKey = body && typeof body === "object" && "idempotencyKey" in body
    ? String(body.idempotencyKey)
    : "";
  const keywordOverrides = body && typeof body === "object" && "keywords" in body && Array.isArray(body.keywords)
    ? [...new Set(body.keywords.map((keyword) => String(keyword).trim()).filter(Boolean))]
    : [];
  if (!UUID.test(id) || !UUID.test(idempotencyKey)) {
    return NextResponse.json({ error: "Requisição de geração inválida." }, { status: 400 });
  }
  if (keywordOverrides.length > 10 || keywordOverrides.some((keyword) => keyword.length < 2 || keyword.length > 80)) {
    return NextResponse.json({ error: "Informe até 10 palavras-chave válidas." }, { status: 400 });
  }

  const { supabase, userId } = await requireAuthenticatedUser();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });

  const { data: existing } = await supabase
    .from("generation_jobs")
    .select("id, status")
    .eq("owner_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing) {
    const snapshot = await loadGenerationSnapshot(supabase, userId, id);
    return NextResponse.json(snapshot, { status: existing.status === "completed" ? 200 : 409 });
  }

  const { data: job, error: jobError } = await supabase
    .from("generation_jobs")
    .insert({ idempotency_key: idempotencyKey, owner_id: userId, project_id: id, status: "researching" })
    .select("id")
    .single();
  if (jobError || !job) return NextResponse.json({ error: "Não foi possível iniciar a geração." }, { status: 500 });

  await supabase.from("projects").update({ status: "generating", updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", userId);
  try {
    const alreadyInterpreted = keywordOverrides.length === 0
      && project.status !== "failed"
      && project.theme
      && project.keywords.length >= 3
      && project.title !== project.problem_statement;
    const interpreted = alreadyInterpreted
      ? {
          knowledgeArea: project.knowledge_area?.replace(/^Área proposta:\s*/i, "") || "Interdisciplinar",
          knowledgeAreaProposed: project.knowledge_area?.startsWith("Área proposta:") ?? true,
          keywords: project.keywords,
          researchQuery: project.theme!,
          title: project.title,
        }
      : await interpretResearchRequest(
          {
            ...project,
            keywords: keywordOverrides.length > 0 ? keywordOverrides : project.keywords,
            theme: keywordOverrides.length > 0 ? null : project.theme,
          },
          keywordOverrides.length > 0 ? { replacementKeywords: keywordOverrides } : {},
        );
    const knowledgeArea = interpreted.knowledgeAreaProposed
      ? `Área proposta: ${interpreted.knowledgeArea}`.slice(0, 120)
      : interpreted.knowledgeArea;
    let interpretedProject = {
      ...project,
      keywords: interpreted.keywords,
      knowledge_area: knowledgeArea,
      theme: interpreted.researchQuery,
      title: interpreted.title,
    };
    const { error: interpretationSaveError } = await supabase
      .from("projects")
      .update({
        keywords: interpreted.keywords,
        knowledge_area: knowledgeArea,
        theme: interpreted.researchQuery,
        title: interpreted.title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("owner_id", userId);
    if (interpretationSaveError) throw interpretationSaveError;

    let report = await fetchResearchStarterReport({
      includeMarkdown: false,
      maxReferences: 20,
      maxTopPapers: 10,
      publicationInterval: { kind: "last-5-years" },
      topic: interpreted.researchQuery,
    });
    if (report.references.length === 0) {
      console.warn("research_starter_retry_broader_interval", {
        projectId: id,
        rankedPapers: report.coverage.rankedPapers,
        searchQualityStatus: report.coverage.searchQualityStatus,
        sourceRecords: report.coverage.sourceRecords,
      });
      report = await fetchResearchStarterReport({
        includeMarkdown: false,
        maxReferences: 20,
        maxTopPapers: 10,
        publicationInterval: { kind: "last-10-years" },
        topic: interpreted.researchQuery,
      });
    }
    if (report.references.length === 0) {
      const broaderQuery = await broadenResearchQuery(
        interpretedProject,
        interpreted.researchQuery,
      );
      if (broaderQuery.toLocaleLowerCase("en") !== interpreted.researchQuery.toLocaleLowerCase("en")) {
        console.warn("research_starter_retry_broader_query", {
          projectId: id,
          queryLength: broaderQuery.length,
        });
        report = await fetchResearchStarterReport({
          includeMarkdown: false,
          maxReferences: 20,
          maxTopPapers: 10,
          publicationInterval: { kind: "last-10-years" },
          topic: broaderQuery,
        });
        if (report.references.length > 0) {
          interpretedProject = { ...interpretedProject, theme: broaderQuery };
          const { error: broaderQuerySaveError } = await supabase
            .from("projects")
            .update({ theme: broaderQuery, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("owner_id", userId);
          if (broaderQuerySaveError) throw broaderQuerySaveError;
        }
      }
    }
    if (report.references.length === 0) {
      throw new Error("Research Starter não encontrou referências verificáveis para este tema.");
    }

    await supabase.from("generation_jobs").update({ report_id: report.reportId, status: "generating", updated_at: new Date().toISOString() }).eq("id", job.id).eq("owner_id", userId);
    const structure = await generateResearchStructure(
      interpretedProject,
      report,
      { replacementFocus: keywordOverrides.length > 0 },
    );
    const references = report.references.slice(0, 20).map(({ authors, doi, referenceId, title, url, year }) => ({ authors, doi, referenceId, title, url, year }));
    const now = new Date().toISOString();

    const { error: saveError } = await supabase.from("research_structures").upsert({
      content: toJson(structure),
      model: GENERATION_MODEL,
      owner_id: userId,
      project_id: id,
      prompt_version: STRUCTURE_PROMPT_VERSION,
      references_data: toJson(references),
      schema_version: RESEARCH_STRUCTURE_SCHEMA_VERSION,
      updated_at: now,
      warnings: [...report.warnings, ...structure.warnings].slice(0, 12),
    }, { onConflict: "project_id" });
    if (saveError) throw saveError;

    await Promise.all([
      supabase.from("generation_jobs").update({ completed_at: now, status: "completed", updated_at: now }).eq("id", job.id).eq("owner_id", userId),
      supabase.from("projects").update({ status: "generated", title: structure.title, updated_at: now }).eq("id", id).eq("owner_id", userId),
    ]);
    return NextResponse.json(await loadGenerationSnapshot(supabase, userId, id));
  } catch (error) {
    const errorCode = error instanceof Error && error.message.includes("não encontrou referências")
      ? "research-starter-empty"
      : error instanceof Error && error.message.includes("Referências não verificadas")
        ? "unverified-references"
        : "generation-failed";
    console.error("generation_job_failed", {
      errorCode,
      jobId: job.id,
      message: error instanceof Error ? error.message : "unknown-error",
      projectId: id,
    });
    const now = new Date().toISOString();
    await Promise.all([
      supabase.from("generation_jobs").update({ error_code: errorCode, status: "failed", updated_at: now }).eq("id", job.id).eq("owner_id", userId),
      supabase.from("projects").update({ status: "failed", updated_at: now }).eq("id", id).eq("owner_id", userId),
    ]);
    return NextResponse.json({
      error: errorCode === "research-starter-empty"
        ? "O Research Starter não encontrou fontes verificáveis. Ajuste o tema ou tente novamente."
        : "A geração falhou sem alterar a estrutura salva.",
      errorCode,
    }, { status: 502 });
  }
}
