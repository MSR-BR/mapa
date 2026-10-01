import "server-only";

import {
  doiLookupResultSchema,
  normalizeDoi,
  type DoiLookupResult,
  type ReferenceDraft,
} from "./doi-reference";

const MAX_RESPONSE_BYTES = 1_048_576;
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 256;
type Provider = DoiLookupResult["provenance"]["provider"];
type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }

// Metadata is displayed only as plain text, never inserted as HTML.
export function metadataText(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return String(value)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code: string) => {
      if (!code.startsWith("#")) return entities[code.toLowerCase()] ?? entity;
      const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : "";
    })
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ").trim();
}

function publicationYear(value: unknown) {
  const year = typeof value === "number" ? value : Number(value);
  return Number.isInteger(year) && year >= 1400 && year <= 2200 ? String(year) : "";
}

export class DoiLookupError extends Error {
  constructor(public readonly code: "invalid_doi" | "doi_not_found" | "doi_unavailable") {
    super(code);
  }
}

export function mapDoiMetadata(provider: Provider, payload: unknown, doi: string, now = new Date()): DoiLookupResult {
  const root = object(payload);
  const record = provider === "Crossref" ? object(root.message) : object(object(root.data).attributes);
  if (normalizeDoi(String(record[provider === "Crossref" ? "DOI" : "doi"] ?? "")) !== doi) {
    throw new DoiLookupError("doi_unavailable");
  }
  const warnings: string[] = [];
  function bounded(value: unknown, max: number, label: string) {
    const text = metadataText(value);
    if (text.length > max) warnings.push(`${label}: texto limitado a ${max} caracteres. Confira a publicação original.`);
    return text.slice(0, max);
  }
  const crossref = provider === "Crossref";
  const people = array(record[crossref ? "author" : "creators"]);
  const names = people.map((item) => {
    const person = object(item);
    return metadataText(person.name) || [person[crossref ? "given" : "givenName"], person[crossref ? "family" : "familyName"]].map(metadataText).filter(Boolean).join(" ");
  }).filter(Boolean);
  const authors: string[] = [];
  for (const name of names) {
    if (name.length > 160 || [...authors, name].join("; ").length > 1200 || authors.length >= 100) {
      warnings.push("A lista de autores excede o espaço do formulário. Confira e complete manualmente.");
      break;
    }
    authors.push(name);
  }
  const container = object(record.container);
  const dates = ["published", "published-print", "published-online", "issued"];
  const year = crossref
    ? dates.map((key) => publicationYear(array(array(object(record[key])["date-parts"])[0])[0])).find(Boolean) ?? ""
    : publicationYear(record.publicationYear);
  const title = crossref ? array(record.title)[0] : object(array(record.titles)[0]).title;
  const abstract = crossref ? record.abstract : object(array(record.descriptions).find((item) => object(item).descriptionType === "Abstract")).description;
  const volume = metadataText(crossref ? record.volume : container.volume);
  const issue = metadataText(crossref ? record.issue : container.issue);
  const pages = crossref ? metadataText(record.page) : [container.firstPage, container.lastPage].map(metadataText).filter(Boolean).join("–");
  const articleNumber = crossref ? metadataText(record["article-number"]) : "";
  const journal = crossref ? array(record["container-title"])[0] : (container.type === "Journal" ? container.title : "");
  const metadata: ReferenceDraft = {
    abstract: bounded(abstract, 5000, "Abstract"),
    authors: authors.join("; "),
    doi,
    journal: bounded(journal, 240, "Revista"),
    title: bounded(title, 500, "Título"),
    volumeIssuePages: bounded([
      volume && `v. ${volume}`, issue && `n. ${issue}`, year,
      pages ? `p. ${pages}` : articleNumber && `art. ${articleNumber}`,
    ].filter(Boolean).join(", "), 240, "Volume, ano, páginas"),
  };
  return doiLookupResultSchema.parse({ metadata, provenance: { doi, provider, retrievedAt: now.toISOString() }, warnings });
}

export async function readBoundedJson(response: Pick<Response, "body" | "headers">, limit = MAX_RESPONSE_BYTES) {
  if (Number(response.headers.get("content-length")) > limit || !response.body) {
    await response.body?.cancel();
    throw new DoiLookupError("doi_unavailable");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > limit) throw new DoiLookupError("doi_unavailable");
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Only public bibliographic metadata is cached; authorization runs before use. */
export function createDoiLookup(fetcher: typeof fetch = fetch, now: () => number = Date.now) {
  const cache = new Map<string, { expires: number; value: DoiLookupResult }>();
  const pending = new Map<string, Promise<DoiLookupResult>>();

  async function retrieve(doi: string) {
    let unavailable = false;
    const providers: Provider[] = ["Crossref", "DataCite"];
    for (const provider of providers) {
      // Fixed hosts, encoded path and no redirects: never fetch a user-supplied URL.
      const url = provider === "Crossref"
        ? `https://api.crossref.org/works/${encodeURIComponent(doi)}`
        : `https://api.datacite.org/dois/${encodeURIComponent(doi)}`;
      try {
        const response = await fetcher(url, {
          cache: "no-store",
          headers: { Accept: "application/json", "User-Agent": "MapaDaPesquisa/1.0 (https://mapadapesquisa.com.br)" },
          redirect: "error",
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) {
          await response.body?.cancel();
          if (response.status !== 404) unavailable = true;
          continue;
        }
        const value = mapDoiMetadata(provider, await readBoundedJson(response), doi, new Date(now()));
        if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
        cache.set(doi, { expires: now() + CACHE_TTL_MS, value });
        return value;
      } catch {
        unavailable = true;
      }
    }
    throw new DoiLookupError(unavailable ? "doi_unavailable" : "doi_not_found");
  }

  return async (input: string): Promise<DoiLookupResult> => {
    const doi = normalizeDoi(input);
    if (!doi) throw new DoiLookupError("invalid_doi");
    const cached = cache.get(doi);
    if (cached && cached.expires > now()) return structuredClone(cached.value);
    const active = pending.get(doi);
    if (active) return structuredClone(await active);
    // Bound concurrent cache entries as well as completed ones.
    if (pending.size >= MAX_CACHE_ENTRIES) throw new DoiLookupError("doi_unavailable");
    const task = retrieve(doi);
    pending.set(doi, task);
    try { return structuredClone(await task); }
    finally { pending.delete(doi); }
  };
}

export const lookupDoi = createDoiLookup();
