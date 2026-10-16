import { z } from "zod";

// Research Starter v1 (2026-10-02.c96). Keep legacy saved queries readable;
// enforce the external limit here, without ever rewriting the student's brief.
export const RESEARCH_QUERY_MAX_LENGTH = 180;
export function boundedResearchQuery(value: string) {
  const query = value.replace(/\s+/g, " ").trim();
  if (query.length <= RESEARCH_QUERY_MAX_LENGTH) return query;
  const prefix = query.slice(0, RESEARCH_QUERY_MAX_LENGTH);
  const boundary = prefix.lastIndexOf(" ");
  return (boundary > 0 ? prefix.slice(0, boundary) : prefix).trim();
}

export const researchStarterRequestSchema = z.object({
  topic: z.string().transform(boundedResearchQuery).pipe(z.string().min(1).max(RESEARCH_QUERY_MAX_LENGTH)),
  publicationInterval: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("last-5-years") }),
    z.object({ kind: z.literal("last-10-years") }),
    z.object({ kind: z.literal("custom"), startDate: z.iso.date(), endDate: z.iso.date() })
      .refine(value => value.startDate <= value.endDate),
  ]).default({ kind: "last-5-years" }),
  maxReferences: z.number().int().min(1).max(80).default(30),
  maxTopPapers: z.number().int().min(1).max(50).default(20),
  includeMarkdown: z.boolean().default(false),
});
