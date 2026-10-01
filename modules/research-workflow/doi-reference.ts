import { z } from "zod";

/** DOI names are case-insensitive. Punctuation in the suffix is significant. */
export function normalizeDoi(input: string): string | null {
  let value = input.trim().replace(/^doi:\s*/i, "");
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (!["doi.org", "dx.doi.org"].includes(url.hostname.toLowerCase()) || url.username || url.password || url.port) return null;
      value = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return null;
    }
  }
  if (value.length > 240 || !/^10\.\d{4,9}\/[^\s<>"\\]+$/i.test(value) || /[\u0000-\u001f\u007f]/.test(value)) return null;
  return value.toLowerCase();
}

export function canonicalDoiUrl(doi: string) {
  return `https://doi.org/${doi.split("/").map(encodeURIComponent).join("/")}`;
}

export const referenceDraftSchema = z.object({
  abstract: z.string().trim().max(5_000).default(""),
  authors: z.string().trim().max(1_200).default(""),
  doi: z.string().trim().max(300).default(""),
  journal: z.string().trim().max(240).default(""),
  title: z.string().trim().max(500).default(""),
  volumeIssuePages: z.string().trim().max(240).default(""),
});

export const doiLookupProvenanceSchema = z.object({
  doi: z.string().max(240),
  provider: z.enum(["Crossref", "DataCite"]),
  retrievedAt: z.string().datetime(),
});

export const doiLookupResultSchema = z.object({
  metadata: referenceDraftSchema,
  provenance: doiLookupProvenanceSchema,
  warnings: z.array(z.string().max(240)).max(8),
});

export type ReferenceDraft = z.infer<typeof referenceDraftSchema>;
export type DoiLookupResult = z.infer<typeof doiLookupResultSchema>;

export const EMPTY_REFERENCE_DRAFT: ReferenceDraft = {
  abstract: "", authors: "", doi: "", journal: "", title: "", volumeIssuePages: "",
};

/** Fill blanks only, including when the user edited a field during the request. */
export function fillReferenceBlanks(current: ReferenceDraft, incoming: ReferenceDraft): ReferenceDraft {
  const next = { ...current };
  for (const field of Object.keys(next) as (keyof ReferenceDraft)[]) {
    if (!current[field].trim()) next[field] = incoming[field];
  }
  return next;
}

export function sameReferenceDoi(a: string | null, b: string | null) {
  const normalized = a ? normalizeDoi(a) : null;
  return normalized !== null && normalized === (b ? normalizeDoi(b) : null);
}
