import type { AnalyticsReasonCode } from "@/modules/analytics/analytics";

import { workflowClientFailure, workflowResponseFailure } from "./request-failure";

/** A discovery claim older than the route's maxDuration (120 s) plus margin cannot still be running. */
export const DISCOVERY_CLAIM_TTL_MS = 150_000;

export function isStaleDiscoveryClaim(updatedAt: string, now: number = Date.now()) {
  const claimedAt = Date.parse(updatedAt);
  return Number.isFinite(claimedAt) && now - claimedAt > DISCOVERY_CLAIM_TTL_MS;
}

const SERVER_REASONS: Readonly<Record<string, AnalyticsReasonCode>> = {
  "briefing-too-short": "validation",
  "research-starter-empty": "provider_invalid_response",
  "unverified-references": "provider_invalid_response",
  "proposal-shape-invalid": "provider_invalid_response",
  "research-starter-config": "provider_unavailable",
  "research-starter-unauthorized": "provider_unavailable",
  "research-starter-invalid-request": "provider_unavailable",
  "research-starter-unavailable": "provider_unavailable",
  "gemini-quota-exhausted": "provider_unavailable",
  "gemini-unavailable": "provider_unavailable",
};

/**
 * Reason code for a non-OK discovery response. Only a code the discover route
 * declared as a provider outcome is reported as one; authentication,
 * authorization, concurrency and unrecognised failures are not blamed on a provider.
 */
export function discoveryResponseReason(
  status: number,
  payload: { code?: unknown; errorCode?: unknown },
): AnalyticsReasonCode {
  if (typeof payload.errorCode === "string" && Object.hasOwn(SERVER_REASONS, payload.errorCode)) {
    return SERVER_REASONS[payload.errorCode];
  }
  if (payload.code === "profile_consent_required") return "consent_required";
  if (payload.code === "profile_mode_stale") return "revision_conflict";
  if (status === 409) return "duplicate_action";
  return workflowResponseFailure(status, null).reason;
}

/** A thrown failure never exposes its raw message (for example "Failed to fetch"); the user sees a fixed Portuguese text. */
export function discoveryClientFailure(error: unknown): { cancelled: boolean; message: string; reason: AnalyticsReasonCode } {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return {
      cancelled: false,
      message: "A busca demorou mais que o esperado. Tente novamente; seu briefing foi preservado.",
      reason: "provider_timeout",
    };
  }
  const failure = workflowClientFailure(error);
  return { cancelled: failure.code === "cancelled", message: failure.message, reason: failure.reason };
}
