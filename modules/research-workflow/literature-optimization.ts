import type { ResearchStarterSuccess } from "@/modules/research-starter/types";

const STOPWORDS = new Set([
  "a",
  "as",
  "ao",
  "aos",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "sobre",
  "uma",
  "um",
]);

function unique(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clean(value: string, maxLength = 160) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength).trim();
}

function extractWords(value: string) {
  return value
    .normalize("NFC")
    .split(/[^\p{L}\p{N}-]+/u)
    .map((word) => clean(word, 40).toLocaleLowerCase("pt-BR"))
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word));
}

export function normalizeLiteratureSearchTerms(input: string | string[]) {
  const raw = Array.isArray(input) ? input.join("\n") : input;
  return unique(
    raw
      .split(/[,\n;]+/)
      .map((term) => clean(term))
      .filter((term) => term.length >= 2),
  ).slice(0, 10);
}

export function buildOptimizedResearchQuery(terms: string[]) {
  return clean(terms.join(" "), 240);
}

export function buildOptimizedDiscoveryKeywords(
  terms: string[],
  report: Pick<ResearchStarterSuccess, "interpretedTopic" | "query" | "summary" | "topic">,
  fallbackKeywords: string[] = [],
) {
  const reportText = [
    report.query.correctedTopic,
    report.query.interpretedTopic,
    report.interpretedTopic,
    report.topic,
    report.summary.headline,
  ].filter((value): value is string => Boolean(value));

  const candidates = unique([
    ...terms.map((term) => clean(term, 80)),
    ...reportText.flatMap(extractWords),
    "revisão da literatura",
    "evidências científicas",
    ...fallbackKeywords.map((keyword) => clean(keyword, 80)),
  ]).filter((keyword) => keyword.length >= 2);

  return candidates.slice(0, 10);
}
