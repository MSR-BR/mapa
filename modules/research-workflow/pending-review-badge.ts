import { pendingAdvisorReview } from "./advisor-review";
import type { ResearchWorkflowContent } from "./schema";

const DAY_MS = 24 * 60 * 60 * 1_000;

export function pendingReviewBadge(content: ResearchWorkflowContent, now: number) {
  const review = pendingAdvisorReview(content);
  if (!review) return null;

  const requestedAt = Date.parse(review.requestedAt);
  if (!Number.isFinite(requestedAt) || !Number.isFinite(now)) {
    return { tone: "unknown" as const, label: "Validação pendente · data indisponível" };
  }

  const elapsed = Math.max(0, now - requestedAt);
  const tone = elapsed <= 3 * DAY_MS ? "green" : elapsed <= 5 * DAY_MS ? "yellow" : "red";
  const age = tone === "green" ? "até 3 dias" : tone === "yellow" ? "mais de 3 dias" : "mais de 5 dias";
  return { tone, label: `Validação pendente · ${age}` };
}
