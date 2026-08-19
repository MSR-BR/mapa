import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";
import type { ResearchIntake } from "@/modules/projects/research-intake";
import { cloneResearchWorkflowContent } from "./clone";
import {
  EMPTY_WORKFLOW_CONTENT,
  RESEARCH_WORKFLOW_SCHEMA_VERSION,
  researchWorkflowContentSchema,
  researchWorkflowSchema,
  type ResearchWorkflow,
} from "./schema";

type StoredWorkflowRow = Pick<
  Database["public"]["Tables"]["research_workflows"]["Row"],
  | "content"
  | "owner_id"
  | "project_id"
  | "revision"
  | "schema_version"
  | "source_revision"
  | "stable_state"
  | "state"
  | "updated_at"
>;

function mapStoredWorkflow(row: StoredWorkflowRow): ResearchWorkflow {
  return researchWorkflowSchema.parse({
    content: researchWorkflowContentSchema.parse(row.content),
    ownerId: row.owner_id,
    projectId: row.project_id,
    revision: row.revision,
    schemaVersion: row.schema_version,
    sourceRevision: row.source_revision,
    stableState: row.stable_state,
    state: row.state,
    updatedAt: row.updated_at,
  });
}

export async function loadResearchWorkflow(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("research_workflows")
    .select("project_id, owner_id, schema_version, state, stable_state, revision, source_revision, content, updated_at")
    .eq("project_id", projectId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw new Error("Não foi possível carregar o fluxo da pesquisa.");
  return data ? mapStoredWorkflow(data) : null;
}

export async function createResearchWorkflow(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  projectId: string,
  initialBriefing: ResearchIntake | null = null,
) {
  const { data, error } = await supabase
    .from("research_workflows")
    .insert({
      content: { ...EMPTY_WORKFLOW_CONTENT, initialBriefing } as unknown as Json,
      owner_id: ownerId,
      project_id: projectId,
      schema_version: RESEARCH_WORKFLOW_SCHEMA_VERSION,
      stable_state: "draft_prompt",
      state: "draft_prompt",
      validation_state: {},
    })
    .select("project_id, owner_id, schema_version, state, stable_state, revision, source_revision, content, updated_at")
    .single();

  if (error) throw new Error("Não foi possível iniciar o fluxo da pesquisa.");
  return mapStoredWorkflow(data);
}

export async function duplicateResearchWorkflow(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  sourceProjectId: string,
  targetProjectId: string,
) {
  const source = await loadResearchWorkflow(supabase, ownerId, sourceProjectId);
  if (!source) throw new Error("Fluxo original não encontrado.");

  const state = source.state === "completed" ? "reviewing_map" : source.state;
  const stableState = source.stableState === "completed" ? "reviewing_map" : source.stableState;
  const { data, error } = await supabase
    .from("research_workflows")
    .insert({
      content: cloneResearchWorkflowContent(source.content) as unknown as Json,
      owner_id: ownerId,
      project_id: targetProjectId,
      schema_version: RESEARCH_WORKFLOW_SCHEMA_VERSION,
      source_revision: 1,
      stable_state: stableState,
      state,
      validation_state: {},
    })
    .select("project_id, owner_id, schema_version, state, stable_state, revision, source_revision, content, updated_at")
    .single();

  if (error) throw new Error("Não foi possível duplicar o fluxo da pesquisa.");
  return mapStoredWorkflow(data);
}
