import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { canonicalDoiUrl, normalizeDoi } from "@/modules/research-workflow/doi-reference";
import { metadataText, readBoundedJson } from "@/modules/research-workflow/doi-lookup";
import type { ResearchStarterRequest, ResearchStarterSuccess } from "./types";

export const CROSSREF_FALLBACK_WARNING = "A busca principal não respondeu adequadamente. Continuamos com metadados do Crossref; a cobertura é reduzida e as fontes precisam de revisão acadêmica.";

const recordSchema = z.object({
  DOI: z.string(), title: z.array(z.string()).min(1),
  author: z.array(z.object({ name: z.string().optional(), given: z.string().optional(), family: z.string().optional() })).default([]),
  "container-title": z.array(z.string()).default([]),
  published: z.object({ "date-parts": z.array(z.array(z.number().int())) }).optional(),
  issued: z.object({ "date-parts": z.array(z.array(z.number().int())) }).optional(),
  abstract: z.string().optional(),
  "is-referenced-by-count": z.number().int().nonnegative().optional(),
});
const envelopeSchema = z.object({ status: z.literal("ok"), message: z.object({ items: z.array(z.unknown()) }) });
const STOP_WORDS = new Set("a an and as at by for from in into of on or the to with without using use study studies research review effects impact analysis application applications e de da do das dos em para com uma um como relação sobre pesquisa revisão estudo estudos".split(" "));
function terms(value: string) {
  return [...new Set(metadataText(value).normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])]
    .filter(term => term.length > 2 && !STOP_WORDS.has(term)).map(term => term.replace(/s$/, ""));
}
function relevant(topic: string, title: string, abstract: string) {
  const query = [...new Set(terms(topic))];
  const evidence = new Set(terms(`${title} ${abstract}`));
  return query.length > 0 && query.filter(term => evidence.has(term)).length >= Math.min(query.length, Math.max(2, Math.ceil(query.length / 2)));
}

export function crossrefSearchUrl(input: ResearchStarterRequest, now = new Date()) {
  const interval = input.publicationInterval ?? { kind: "last-5-years" };
  const endDate = interval.kind === "custom" ? interval.endDate : now.toISOString().slice(0, 10);
  const start = new Date(now);
  start.setUTCFullYear(start.getUTCFullYear() - (interval.kind === "last-10-years" ? 10 : 5));
  const startDate = interval.kind === "custom" ? interval.startDate : start.toISOString().slice(0, 10);
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query.bibliographic", input.topic);
  url.searchParams.set("filter", `from-pub-date:${startDate},until-pub-date:${endDate}`);
  url.searchParams.set("rows", String(Math.min(80, Math.max(20, (input.maxReferences ?? 30) * 2))));
  return url;
}

/** Only catalogue metadata: no AI-written findings, abstracts, authors or DOIs. */
export function crossrefReport(payload: unknown, input: ResearchStarterRequest, now = new Date()): ResearchStarterSuccess {
  const items = envelopeSchema.parse(payload).message.items;
  const seen = new Set<string>();
  const records = items.flatMap(item => {
    const parsed = recordSchema.safeParse(item);
    if (!parsed.success) return [];
    const row = parsed.data;
    const doi = normalizeDoi(row.DOI);
    const title = metadataText(row.title[0]).slice(0, 500);
    const abstract = metadataText(row.abstract).slice(0, 5000);
    if (!doi || !title || seen.has(doi) || !relevant(input.topic, title, abstract)) return [];
    seen.add(doi);
    const year = (row.published ?? row.issued)?.["date-parts"]?.[0]?.[0];
    const referenceId = `crossref-${createHash("sha256").update(doi).digest("hex").slice(0, 32)}`;
    return [{
      referenceId, paperId: referenceId, doi, title, url: canonicalDoiUrl(doi),
      authors: row.author.map(person => metadataText(person.name ?? [person.given, person.family].filter(Boolean).join(" ")).slice(0, 160)).filter(Boolean).slice(0, 100),
      year: year && year >= 1400 && year <= 2200 ? year : null,
      venue: metadataText(row["container-title"][0]).slice(0, 240) || null,
      citationCount: row["is-referenced-by-count"] ?? null, openAccessStatus: "unknown", sources: ["crossref"],
      abstractSnippet: abstract || null, rankingScore: null,
    }];
  }).slice(0, input.maxReferences ?? 30);
  if (!records.length) throw new Error("crossref_no_relevant_references");
  const reportId = `crossref-${randomUUID()}`;
  return {
    ok: true, reportId, runId: reportId, generatedAt: now.toISOString(), retrievalProvider: "crossref",
    topic: input.topic, interpretedTopic: input.topic,
    publicationInterval: input.publicationInterval ?? { kind: "last-5-years" }, publicationIntervalLabel: "Intervalo solicitado na busca bibliográfica",
    status: "partial", confidenceLevel: "low", analysisProvider: "local", analysisModel: null,
    summary: { headline: "Referências recuperadas pelo Crossref", currentState: "Metadados bibliográficos; sem síntese científica do Research Starter.", overview: "Use as fontes para propor caminhos de pesquisa, sem inferir resultados a partir dos títulos." },
    markdown: null, keyFindings: [], researchDirections: [],
    limitations: ["Busca alternativa em uma única base. Relevância lexical não substitui leitura crítica; nenhuma conclusão científica foi gerada nesta recuperação."],
    warnings: [CROSSREF_FALLBACK_WARNING],
    references: records.map(row => ({ referenceId: row.referenceId, paperId: row.paperId, doi: row.doi, title: row.title, url: row.url, authors: row.authors, year: row.year, venue: row.venue, citationCount: row.citationCount, openAccessStatus: row.openAccessStatus, sources: row.sources })),
    topPapers: records.slice(0, input.maxTopPapers ?? 20),
    coverage: { sourceRecords: items.length, rankedPapers: records.length, productiveSources: 1, totalSources: 1, sourceStatuses: [{ source: "crossref", status: "success", records: records.length, requestedLimit: input.maxReferences ?? 30 }], searchQualityStatus: "fallback-metadata", searchQualitySummary: "DOI, título e correspondência lexical conferidos; revisão acadêmica necessária." },
    query: { originalTopic: input.topic, correctedTopic: null, interpretedTopic: input.topic, method: "crossref-fallback" },
  };
}

export async function fetchCrossrefReport(input: ResearchStarterRequest, signal: AbortSignal): Promise<ResearchStarterSuccess> {
  const response = await fetch(crossrefSearchUrl(input), {
    cache: "no-store", redirect: "error", signal,
    headers: { Accept: "application/json", "User-Agent": "MapaDaPesquisa/1.0 (https://mapadapesquisa.com.br)" },
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error("crossref_unavailable"); }
  return crossrefReport(await readBoundedJson(response), input);
}
