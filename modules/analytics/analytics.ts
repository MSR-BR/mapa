"use client";

/**
 * The analytics contract is deliberately small. Values are allow-listed
 * before they reach GA4 so prompts, project titles, e-mails and provider
 * errors can never accidentally become event parameters.
 */
export type AnalyticsEventName =
  | "consent_choice" | "login_started" | "login_success" | "login_failed" | "logout" | "profile_role_selected"
  | "project_start" | "project_draft_saved" | "project_resumed" | "generation_started" | "generation_completed"
  | "generation_failed" | "generation_retry" | "proposal_viewed" | "proposal_selected"
  | "stage_started" | "stage_saved" | "stage_submitted" | "stage_completed" | "stage_blocked" | "stage_revision_requested"
  | "advisor_link_started" | "advisor_link_succeeded" | "advisor_link_pending" | "advisor_review_opened"
  | "advisor_approved" | "advisor_correction_requested" | "literature_optimization_started"
  | "literature_optimization_completed" | "literature_optimization_failed" | "project_integration_started"
  | "project_integration_completed" | "project_integration_failed" | "project_completed" | "export_pdf_started"
  | "export_pdf_completed" | "export_pdf_failed" | "support_opened" | "support_submitted" | "bug_report_submitted";

export type AnalyticsAuthState = "anonymous" | "authenticated";
export type AnalyticsProfileRole = "student" | "advisor" | "unknown";
export type AnalyticsSource = "home" | "dashboard" | "resume" | "email" | "advisor_dashboard" | "unknown";
export type AnalyticsEntryMode = "quick" | "advanced" | "unknown";
export type AnalyticsProductType = "tcc" | "monograph" | "dissertation" | "thesis" | "article" | "other" | "unknown";
export type AnalyticsStage = "discovery" | "problem" | "definition" | "literature" | "methodology" | "final" | "unknown";
export type AnalyticsResult = "started" | "success" | "failed" | "blocked" | "retry" | "cancelled" | "accepted" | "rejected";
export type AnalyticsReasonCode =
  | "auth_required" | "validation" | "consent_required" | "provider_timeout" | "provider_unavailable"
  | "provider_invalid_response" | "rate_limited" | "network" | "advisor_pending" | "advisor_correction"
  | "duplicate_action" | "unknown";
export type AnalyticsReferenceBucket = "0" | "1_5" | "6_20" | "21_plus" | "unknown";
export type AnalyticsHasAdvisor = "yes" | "no" | "unknown";
export type AnalyticsStageNumber = "1" | "2" | "3" | "4" | "5" | "6" | "unknown";

export type AnalyticsEventParams = {
  auth_state?: AnalyticsAuthState;
  profile_role?: AnalyticsProfileRole;
  source?: AnalyticsSource;
  entry_mode?: AnalyticsEntryMode;
  product_type?: AnalyticsProductType;
  stage?: AnalyticsStage;
  result?: AnalyticsResult;
  reason_code?: AnalyticsReasonCode;
  reference_count_bucket?: AnalyticsReferenceBucket;
  has_advisor?: AnalyticsHasAdvisor;
  stage_number?: AnalyticsStageNumber;
};

export type AnalyticsContext = Pick<AnalyticsEventParams, "auth_state" | "profile_role" | "source" | "entry_mode" | "product_type" | "stage" | "has_advisor">;
export const ANALYTICS_CONSENT_KEY = "mapa.analytics-consent.v1";

const ENUMS: Record<keyof AnalyticsEventParams, readonly string[]> = {
  auth_state: ["anonymous", "authenticated"],
  profile_role: ["student", "advisor", "unknown"],
  source: ["home", "dashboard", "resume", "email", "advisor_dashboard", "unknown"],
  entry_mode: ["quick", "advanced", "unknown"],
  product_type: ["tcc", "monograph", "dissertation", "thesis", "article", "other", "unknown"],
  stage: ["discovery", "problem", "definition", "literature", "methodology", "final", "unknown"],
  result: ["started", "success", "failed", "blocked", "retry", "cancelled", "accepted", "rejected"],
  reason_code: ["auth_required", "validation", "consent_required", "provider_timeout", "provider_unavailable", "provider_invalid_response", "rate_limited", "network", "advisor_pending", "advisor_correction", "duplicate_action", "unknown"],
  reference_count_bucket: ["0", "1_5", "6_20", "21_plus", "unknown"],
  has_advisor: ["yes", "no", "unknown"],
  stage_number: ["1", "2", "3", "4", "5", "6", "unknown"],
};

let context: AnalyticsContext = { auth_state: "anonymous", profile_role: "unknown", source: "unknown" };

export function setAnalyticsContext(next: AnalyticsContext) {
  context = { ...context, ...next };
}

export function getReferenceCountBucket(count: number | null | undefined): AnalyticsReferenceBucket {
  if (!Number.isFinite(count) || count == null || count < 0) return "unknown";
  if (count === 0) return "0";
  if (count <= 5) return "1_5";
  if (count <= 20) return "6_20";
  return "21_plus";
}

function sanitize(params: AnalyticsEventParams): Record<string, string> {
  const safe: Record<string, string> = {};
  (Object.keys(ENUMS) as Array<keyof AnalyticsEventParams>).forEach((key) => {
    const value = params[key];
    if (typeof value !== "string") return;
    safe[key] = ENUMS[key].includes(value) ? value : "unknown";
  });
  return safe;
}

export function trackAnalyticsEvent(name: AnalyticsEventName, params: AnalyticsEventParams = {}) {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "accepted") return;
  } catch {
    return;
  }
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;
  gtag("event", name, sanitize({ ...context, ...params }));
}
