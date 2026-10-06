import "server-only";
import { prepareWorkflowEdit, type WorkflowEdit } from "./workflow-edit";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { pendingAdvisorReview } from "./advisor-review";
import { type AdvisorReviewStep, type ResearchWorkflow } from "./schema";
import { applyWorkflowUnit } from "./versioned-context";
import { workflowForView, workflowNavigationPosition } from "./workflow-navigation";

export async function saveVersionedWorkflow(supabase: SupabaseClient<Database>, edit: WorkflowEdit) {
  let next;
  try { next = prepareWorkflowEdit(edit); } catch { return null; }
  const { base } = edit;
  if (next.unchanged) return workflowForView(base, edit.step);
  const revision = base.revision + 1;
  const { data, error } = await supabase.from("research_workflows").update({
    content: next.content as unknown as Json, revision,
    source_revision: next.sourceRevision, stable_state: next.stableState, state: next.state,
    updated_at: new Date().toISOString(),
  }).eq("project_id", base.projectId).eq("owner_id", base.ownerId).eq("revision", base.revision)
    .select("updated_at").maybeSingle();
  if (error || !data) return null;
  const saved: ResearchWorkflow = { ...base, ...next, revision, updatedAt: data.updated_at };
  const target = ["validate", "complete"].includes(edit.action) && !pendingAdvisorReview(saved.content)
    ? workflowNavigationPosition({ content: edit.content, state: edit.state }) ?? edit.step : edit.step;
  return workflowForView(saved, target);
}

export function contentWithDraft(base: ResearchWorkflow, step: AdvisorReviewStep) {
  const draft = base.content.stepDrafts[step];
  return draft ? applyWorkflowUnit(base.content, step, draft.unit) : base.content;
}
