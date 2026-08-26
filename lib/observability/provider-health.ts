export type ProviderHealth = "configured" | "not_configured";

export type ProviderHealthSnapshot = {
  gemini: ProviderHealth;
  resend: ProviderHealth;
  researchStarter: ProviderHealth;
  supabase: ProviderHealth;
};

function configured(...names: string[]) {
  return names.every((name) => Boolean(process.env[name]?.trim()));
}

function configuredAny(...names: string[]) {
  return names.some((name) => Boolean(process.env[name]?.trim()));
}

export function getProviderHealth(): ProviderHealthSnapshot {
  return {
    gemini: configured("GEMINI_API_KEY") ? "configured" : "not_configured",
    resend: configured("RESEND_API_KEY") ? "configured" : "not_configured",
    researchStarter: configuredAny("RESEARCH_STARTER_MAPA_API_KEY", "RESEARCH_STARTER_API_KEY")
      ? "configured"
      : "not_configured",
    supabase: configured(
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_PROJECT_REF",
    ) ? "configured" : "not_configured",
  };
}
