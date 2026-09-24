"use client";

/**
 * The analytics contract is deliberately small. Values are allow-listed
 * before they reach GA4 so prompts, project titles, e-mails and provider
 * errors can never accidentally become event parameters.
 */
export type AnalyticsEventName =
  | "consent_choice" | "login_started" | "login_success" | "login_failed" | "logout" | "profile_role_selected" | "profile_mode_changed"
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
export type AnalyticsSurface = "home" | "dashboard" | "resume" | "email" | "advisor_dashboard" | "google" | "unknown";
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
export type AnalyticsMacroStage = "1" | "2" | "3" | "4" | "unknown";
export type AnalyticsStep =
  | "discovery"
  | "problem_statement"
  | "general_objective"
  | "specific_objectives"
  | "literature_topics"
  | "development_topics"
  | "methodology_matrix"
  | "final_map"
  | "unknown";

export type AnalyticsEventParams = {
  app_auth_state?: AnalyticsAuthState;
  app_role?: AnalyticsProfileRole;
  app_surface?: AnalyticsSurface;
  app_entry_mode?: AnalyticsEntryMode;
  app_product_type?: AnalyticsProductType;
  app_stage?: AnalyticsStage;
  app_result?: AnalyticsResult;
  app_reason_code?: AnalyticsReasonCode;
  app_reference_count_bucket?: AnalyticsReferenceBucket;
  app_has_advisor?: AnalyticsHasAdvisor;
  app_macro_stage?: AnalyticsMacroStage;
  app_step?: AnalyticsStep;
};

export type AnalyticsContext = Pick<AnalyticsEventParams, "app_auth_state" | "app_role" | "app_surface" | "app_entry_mode" | "app_product_type" | "app_stage" | "app_has_advisor" | "app_macro_stage" | "app_step">;
export type AnalyticsWorkflowPosition = Pick<AnalyticsEventParams, "app_stage" | "app_macro_stage" | "app_step">;
export const ANALYTICS_CONSENT_KEY = "mapa.analytics-consent.v1";

const ENUMS: Record<keyof AnalyticsEventParams, readonly string[]> = {
  app_auth_state: ["anonymous", "authenticated"],
  app_role: ["student", "advisor", "unknown"],
  app_surface: ["home", "dashboard", "resume", "email", "advisor_dashboard", "google", "unknown"],
  app_entry_mode: ["quick", "advanced", "unknown"],
  app_product_type: ["tcc", "monograph", "dissertation", "thesis", "article", "other", "unknown"],
  app_stage: ["discovery", "problem", "definition", "literature", "methodology", "final", "unknown"],
  app_result: ["started", "success", "failed", "blocked", "retry", "cancelled", "accepted", "rejected"],
  app_reason_code: ["auth_required", "validation", "consent_required", "provider_timeout", "provider_unavailable", "provider_invalid_response", "rate_limited", "network", "advisor_pending", "advisor_correction", "duplicate_action", "unknown"],
  app_reference_count_bucket: ["0", "1_5", "6_20", "21_plus", "unknown"],
  app_has_advisor: ["yes", "no", "unknown"],
  app_macro_stage: ["1", "2", "3", "4", "unknown"],
  app_step: ["discovery", "problem_statement", "general_objective", "specific_objectives", "literature_topics", "development_topics", "methodology_matrix", "final_map", "unknown"],
};

let context: AnalyticsContext = { app_auth_state: "anonymous", app_role: "unknown", app_surface: "unknown" };

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

export function getAnalyticsWorkflowPosition(step: AnalyticsStep): AnalyticsWorkflowPosition {
  switch (step) {
    case "discovery":
      return { app_stage: "discovery", app_macro_stage: "unknown", app_step: step };
    case "problem_statement":
      return { app_stage: "problem", app_macro_stage: "1", app_step: step };
    case "general_objective":
    case "specific_objectives":
      return { app_stage: "definition", app_macro_stage: "2", app_step: step };
    case "literature_topics":
    case "development_topics":
      return { app_stage: "literature", app_macro_stage: "3", app_step: step };
    case "methodology_matrix":
      return { app_stage: "methodology", app_macro_stage: "4", app_step: step };
    case "final_map":
      return { app_stage: "final", app_macro_stage: "4", app_step: step };
    default:
      return { app_stage: "unknown", app_macro_stage: "unknown", app_step: "unknown" };
  }
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
