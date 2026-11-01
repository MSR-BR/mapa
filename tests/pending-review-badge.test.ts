import assert from "node:assert/strict";
import { test } from "node:test";
import { pendingReviewBadge } from "../modules/research-workflow/pending-review-badge";
import { EMPTY_WORKFLOW_CONTENT, type AdvisorReview } from "../modules/research-workflow/schema";

const start = Date.parse("2026-11-01T12:00:00Z");
const day = 86_400_000;
const review: AdvisorReview = {
  id: "00000000-0000-4000-8000-000000000001", requestedAt: new Date(start).toISOString(),
  reviewedAt: null, advisorComments: null, advisorEmail: null, advisorId: null,
  sourceRevision: 1, status: "pending", step: "problem_statement", studentEmail: null,
  targetActiveStep: null, targetStableState: "draft_prompt", targetState: "draft_prompt",
};
const content = { ...EMPTY_WORKFLOW_CONTENT, advisorReviews: [review] };

test("pending validation changes color exactly after three and five elapsed days", () => {
  for (const [elapsed, tone] of [[0, "green"], [3 * day, "green"], [3 * day + 1, "yellow"], [5 * day, "yellow"], [5 * day + 1, "red"]] as const) {
    assert.equal(pendingReviewBadge(content, start + elapsed)?.tone, tone);
  }
});

test("resolved validation disappears and resubmission restarts the waiting period", () => {
  assert.equal(pendingReviewBadge(EMPTY_WORKFLOW_CONTENT, start), null);
  for (const status of ["approved", "changes_requested"] as const) {
    assert.equal(pendingReviewBadge({ ...content, advisorReviews: [{ ...review, status }] }, start), null);
  }
  const resubmitted = { ...review, requestedAt: new Date(start + 10 * day).toISOString() };
  assert.equal(pendingReviewBadge({ ...content, advisorReviews: [{ ...review, status: "approved" }, resubmitted] }, start + 11 * day)?.tone, "green");
});

test("equivalent time zones, future dates and invalid timestamps are handled explicitly", () => {
  assert.equal(pendingReviewBadge({ ...content, advisorReviews: [{ ...review, requestedAt: "2026-11-01T09:00:00-03:00" }] }, start + 3 * day)?.tone, "green");
  assert.equal(pendingReviewBadge(content, start - day)?.tone, "green");
  assert.equal(pendingReviewBadge({ ...content, advisorReviews: [{ ...review, requestedAt: "invalid" }] }, start)?.tone, "unknown");
});
