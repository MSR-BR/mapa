import { z } from "zod";

const reference = z.object({
  referenceId: z.string().min(1).max(240), paperId: z.string(), title: z.string().nullable(),
  authors: z.array(z.string()), year: z.number().int().nullable(), venue: z.string().nullable(),
  doi: z.string().nullable(), url: z.string().nullable(), citationCount: z.number().nullable(),
  openAccessStatus: z.string(), sources: z.array(z.string()),
});
const interval = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("last-5-years") }), z.object({ kind: z.literal("last-10-years") }),
  z.object({ kind: z.literal("custom"), startDate: z.string(), endDate: z.string() }),
]);
export const researchStarterResponseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(false), code: z.enum(["api-not-configured", "unauthorized", "invalid-request", "upstream-rate-limited", "upstream-timeout", "search-failed", "internal-error"]), errors: z.array(z.string()), retryable: z.boolean().optional() }),
  z.object({
    ok: z.literal(true), reportId: z.string(), runId: z.string(), generatedAt: z.string(), topic: z.string(), interpretedTopic: z.string(),
    publicationInterval: interval, publicationIntervalLabel: z.string(), status: z.enum(["completed", "partial", "failed"]), confidenceLevel: z.enum(["high", "medium", "low", "unavailable"]), analysisProvider: z.enum(["gemini", "openai", "local"]), analysisModel: z.string().nullable(),
    summary: z.object({ headline: z.string(), currentState: z.string(), overview: z.string() }), markdown: z.string().nullable(),
    keyFindings: z.array(z.object({ title: z.string(), analysis: z.string(), referenceIds: z.array(z.string()) })),
    researchDirections: z.array(z.object({ title: z.string(), rationale: z.string(), nextStep: z.string(), referenceIds: z.array(z.string()) })),
    limitations: z.array(z.string()), warnings: z.array(z.string()), references: z.array(reference).max(80),
    topPapers: z.array(reference.extend({ rankingScore: z.number().nullable(), abstractSnippet: z.string().nullable() })).max(50),
    coverage: z.object({ sourceRecords: z.number(), rankedPapers: z.number(), productiveSources: z.number(), totalSources: z.number(), sourceStatuses: z.array(z.object({ source: z.string(), status: z.string(), records: z.number(), requestedLimit: z.number() })), searchQualityStatus: z.string().nullable(), searchQualitySummary: z.string().nullable() }),
    query: z.object({ originalTopic: z.string(), correctedTopic: z.string().nullable(), interpretedTopic: z.string(), method: z.string().nullable() }),
  }),
]);
