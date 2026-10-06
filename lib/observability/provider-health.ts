export type ProviderHealth = "configured" | "not_configured";

export type ProviderHealthSnapshot = {
  gemini: ProviderHealth;
  openai: ProviderHealth | "disabled";
  resend: ProviderHealth;
  researchStarter: ProviderHealth;
  supabase: ProviderHealth;
};

function configured(...names: string[]) {
  return names.every((name) => Boolean(process.env[name]?.trim()));
}

export function getProviderHealth(): ProviderHealthSnapshot {
  return {
    openai: process.env.MAPA_OPENAI_ENABLED !== "true" ? "disabled" : configured("OPENAI_API_KEY", "MAPA_AI_BUDGET_SECRET") ? "configured" : "not_configured",
    gemini: configured("GEMINI_API_KEY") ? "configured" : "not_configured",
    resend: configured("RESEND_API_KEY") ? "configured" : "not_configured",
    researchStarter: configured("RESEARCH_STARTER_MAPA_API_KEY")
      ? "configured"
      : "not_configured",
    supabase: configured(
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_PROJECT_REF",
    ) ? "configured" : "not_configured",
  };
}
