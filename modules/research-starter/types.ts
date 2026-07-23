export type PublicationInterval =
  | { kind: "last-5-years" }
  | { kind: "last-10-years" }
  | { kind: "custom"; startDate: string; endDate: string };

export type ResearchStarterRequest = {
  topic: string;
  publicationInterval?: PublicationInterval;
  maxReferences?: number;
  maxTopPapers?: number;
  includeMarkdown?: boolean;
};

export type ResearchStarterReference = {
  referenceId: string;
  paperId: string;
  title: string | null;
  authors: string[];
  year: number | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  citationCount: number | null;
  openAccessStatus: string;
  sources: string[];
};

export type ResearchStarterSuccess = {
  ok: true;
  reportId: string;
  runId: string;
  generatedAt: string;
  topic: string;
  interpretedTopic: string;
  publicationInterval: PublicationInterval;
  publicationIntervalLabel: string;
  status: "completed" | "partial" | "failed";
  confidenceLevel: "high" | "medium" | "low" | "unavailable";
  analysisProvider: "gemini" | "openai" | "local";
  analysisModel: string | null;
  summary: { headline: string; currentState: string; overview: string };
  markdown: string | null;
  keyFindings: Array<{ title: string; analysis: string; referenceIds: string[] }>;
  researchDirections: Array<{ title: string; rationale: string; nextStep: string; referenceIds: string[] }>;
  limitations: string[];
  warnings: string[];
  references: ResearchStarterReference[];
  topPapers: Array<ResearchStarterReference & { rankingScore: number | null; abstractSnippet: string | null }>;
  coverage: {
    sourceRecords: number;
    rankedPapers: number;
    productiveSources: number;
    totalSources: number;
    sourceStatuses: Array<{ source: string; status: string; records: number; requestedLimit: number }>;
    searchQualityStatus: string | null;
    searchQualitySummary: string | null;
  };
  query: { originalTopic: string; correctedTopic: string | null; interpretedTopic: string; method: string | null };
};

export type ResearchStarterFailure = {
  ok: false;
  code: "api-not-configured" | "unauthorized" | "invalid-request" | "search-failed" | "internal-error";
  errors: string[];
};

export type ResearchStarterResponse = ResearchStarterSuccess | ResearchStarterFailure;
