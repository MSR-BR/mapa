import "server-only";
import { assertOperationActive, emitProgress } from "@/modules/ai/operation";
import { reviewWorkflowProposal } from "@/modules/ai/review";
import { prepareWorkflowEdit, type WorkflowEdit } from "./workflow-edit";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { pendingAdvisorReview } from "./advisor-review";
import { type AdvisorReviewStep, type ResearchWorkflow } from "./schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import { applyWorkflowUnit } from "./versioned-context";
import { workflowForView, workflowNavigationPosition } from "./workflow-navigation";

export async function saveVersionedWorkflow(supabase: SupabaseClient<Database>, edit: WorkflowEdit) {
  let next;
  try { next = prepareWorkflowEdit(edit); } catch { return null; }
  const { base } = edit;
  if (next.unchanged) return workflowForView(base, edit.step);
  const review = await reviewWorkflowProposal(edit);
  if (review) {
    const bucket = ["regenerate", "optimize"].includes(edit.action) ? "stepProposals" : "stepDrafts";
    const proposal = next.content[bucket][edit.step];
    if (proposal) next.content[bucket][edit.step] = { ...proposal, aiReview: review };
  }
  assertOperationActive();
  emitProgress("saving");
  const revision = base.revision + 1;
  const { data, error } = await supabase.from("research_workflows").update({
    content: next.content as unknown as Json, revision,
    source_revision: next.sourceRevision, stable_state: next.stableState, state: next.state,
    updated_at: new Date().toISOString(),
  }).eq("project_id", base.projectId).eq("owner_id", base.ownerId).eq("revision", base.revision)
    .select("updated_at").maybeSingle();
  if (error) return null;
  if (!data) {
    // A late generation may be retained as a proposal of its old context. Never
    // replace a newer proposal, academic content, drafts or a pending submission.
    const proposal = next.content.stepProposals[edit.step];
    if (!["regenerate", "optimize"].includes(edit.action) || !proposal) return null;
    const latest = await loadResearchWorkflow(supabase, base.ownerId, base.projectId);
    if (!latest || pendingAdvisorReview(latest.content)
      || JSON.stringify(latest.content.stepProposals[edit.step]) !== JSON.stringify(base.content.stepProposals[edit.step])) return null;
    assertOperationActive();
    const lateContent = { ...latest.content, stepProposals: { ...latest.content.stepProposals, [edit.step]: proposal } };
    const { data: late, error: lateError } = await supabase.from("research_workflows").update({
      content: lateContent as unknown as Json, revision: latest.revision + 1, updated_at: new Date().toISOString(),
      source_revision: latest.sourceRevision, state: latest.state, stable_state: latest.stableState,
    }).eq("project_id", base.projectId).eq("owner_id", base.ownerId).eq("revision", latest.revision).select("updated_at").maybeSingle();
    return lateError || !late ? null : workflowForView({ ...latest, content: lateContent, revision: latest.revision + 1, updatedAt: late.updated_at }, edit.step);
  }
  const saved: ResearchWorkflow = { ...base, ...next, revision, updatedAt: data.updated_at };
  const target = ["validate", "complete"].includes(edit.action) && !pendingAdvisorReview(saved.content)
    ? workflowNavigationPosition({ content: edit.content, state: edit.state }) ?? edit.step : edit.step;
  return workflowForView(saved, target);
}

export function contentWithDraft(base: ResearchWorkflow, step: AdvisorReviewStep) {
  const draft = base.content.stepDrafts[step];
  return draft ? applyWorkflowUnit(base.content, step, draft.unit) : base.content;
}
