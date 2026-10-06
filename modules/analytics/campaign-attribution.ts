export const PUBLIC_CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "gbraid", "wbraid"] as const;

export type PublicSearchParams = Record<string, string | string[] | undefined>;

export function isSafeCampaignValue(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,250}$/.test(value);
}

/** A campaign entry must render before an authenticated visitor resumes a private project. */
export function hasPublicCampaignAttribution(params: PublicSearchParams): boolean {
  return ["utm_source", "gclid", "gbraid", "wbraid"].some((key) => isSafeCampaignValue(params[key]));
}
