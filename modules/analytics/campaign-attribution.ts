export const PUBLIC_CAMPAIGN_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "gbraid", "wbraid", "utm_term", "utm_id",
] as const;
export type PublicSearchParams = Record<string, string | string[] | undefined>;
export type PublicCampaign = Partial<Record<typeof PUBLIC_CAMPAIGN_KEYS[number], string>>;
export const CAMPAIGN_STORAGE_KEY = "mapa.pending-campaign.v1";

export function isSafeCampaignValue(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim() || value.length > 250) return false;
  // Permit campaign punctuation, but not URLs, email addresses, controls or encoded bypasses.
  let decoded = value;
  for (let depth = 0; depth < 4; depth++) {
    if (!/^[a-zA-Z0-9_.% -]+$/.test(decoded)) return false;
    const next = decoded.replace(/%([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
    if (next === decoded) return true;
    decoded = next;
  }
  return false;
}

export function sanitizeCampaign(params: PublicSearchParams): PublicCampaign {
  const safe: PublicCampaign = {};
  for (const key of PUBLIC_CAMPAIGN_KEYS) {
    const value = params[key];
    if (isSafeCampaignValue(value)) safe[key] = value;
  }
  return safe;
}

export function campaignFromUrl(href: string): PublicCampaign {
  try {
    const url = new URL(href);
    if (!["/", "/mapa"].includes(url.pathname)) return {};
    const params: PublicSearchParams = {};
    for (const key of PUBLIC_CAMPAIGN_KEYS) {
      const values = url.searchParams.getAll(key);
      if (values.length === 1) params[key] = values[0];
    }
    return sanitizeCampaign(params);
  } catch { return {}; }
}

export function hasPublicCampaignAttribution(params: PublicSearchParams): boolean {
  return ["utm_source", "gclid", "gbraid", "wbraid"].some((key) => isSafeCampaignValue(params[key]));
}

/** Local per-tab attribution only. No URL, title, project content, identifiers or network call. */
export function rememberPublicCampaign(href: string): void {
  if (typeof window === "undefined") return;
  const campaign = campaignFromUrl(href);
  if (!Object.keys(campaign).length) return;
  try {
    // Keep the first pending entry across internal navigation and OAuth redirects.
    if (!window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)) window.sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaign));
  } catch { /* Attribution is best effort when browser storage is disabled. */ }
}

export function readPendingCampaign(): PublicCampaign {
  if (typeof window === "undefined") return {};
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY) ?? "null");
    return value && typeof value === "object" && !Array.isArray(value) ? sanitizeCampaign(value as PublicSearchParams) : {};
  } catch { return {}; }
}

export function clearPendingCampaign(): void {
  try { window.sessionStorage.removeItem(CAMPAIGN_STORAGE_KEY); } catch { /* best effort */ }
}
