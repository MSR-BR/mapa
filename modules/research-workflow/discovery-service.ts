import "server-only";

import {
  broadenResearchQuery,
  generateProblemCandidates,
  interpretResearchRequest,
} from "@/modules/generation/gemini";
import type { Project } from "@/modules/projects/types";
import {
  fetchResearchStarterReport,
  ResearchStarterClientError,
} from "@/modules/research-starter/client";
import type { ResearchStarterSuccess } from "@/modules/research-starter/types";
import { DiscoveryError } from "./discovery-errors";
import { proposalDiscoverySchema, type DiscoveryReference, type InterpretedDiscovery } from "./schema";
import type { ResearchIntake } from "@/modules/projects/research-intake";

const DISCOVERY_DEADLINE_MS = 105_000;

function classifyGeminiError(error: unknown, stage: "interpreting" | "literature" | "proposals") {
  const message = error instanceof Error ? error.message : String(error);
  if (/prepayment credits are depleted|resource_exhausted|quota/i.test(message)) {
    return new DiscoveryError("Os créditos da IA estão esgotados. Recarregue a conta Gemini e tente novamente.", {
      code: "gemini-quota-exhausted",
      stage,
      retryable: false,
    });
  }
  return new DiscoveryError("O serviço de IA está temporariamente indisponível. Tente novamente em instantes.", {
    code: "gemini-unavailable",
    stage,
  });
}

function remainingTime(deadline: number) {
  const remaining = deadline - Date.now();
  if (remaining < 5_000) {
    throw new DiscoveryError("A busca bibliográfica excedeu o tempo disponível. Tente novamente.", {
      code: "research-starter-unavailable",
      stage: "literature",
    });
  }
  return Math.min(30_000, remaining - 1_000);
}

function safeUrl(value: string | null | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Older quick-mode projects could persist the same free-form prompt in all
 * five intake fields. Keep those projects usable without sending a duplicated
 * briefing to Gemini or showing the duplication back to the user.
 */
function compactOriginalPrompt(value: string) {
  const parts = value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.match(/^[^:\n]{2,100}:\s*([\s\S]+)$/)?.[1]?.trim() ?? null);
  if (parts.length >= 3 && parts.every((part): part is string => Boolean(part)) && new Set(parts).size === 1) {
    return parts[0];
  }
  return value.trim();
}

function normalizeReferences(report: ResearchStarterSuccess): DiscoveryReference[] {
  const topPapers = Array.isArray(report.topPapers) ? report.topPapers : [];
  const abstracts = new Map(
    topPapers
      .filter((paper) => paper.referenceId && paper.abstractSnippet)
      .map((paper) => [paper.referenceId, paper.abstractSnippet?.trim().slice(0, 5_000) ?? null]),
  );

  return report.references.flatMap((reference) => {
    const referenceId = String(reference.referenceId ?? reference.paperId ?? "").trim();
    if (!referenceId) return [];
    const title = typeof reference.title === "string" && reference.title.trim()
      ? reference.title.trim().slice(0, 500)
      : null;
    const authors = Array.isArray(reference.authors)
      ? reference.authors.filter((author): author is string => typeof author === "string" && author.trim().length > 0).slice(0, 8)
      : [];
    const year = typeof reference.year === "number" && Number.isInteger(reference.year) && reference.year >= 1400 && reference.year <= 2200
      ? reference.year
      : null;
    const venue = typeof reference.venue === "string" && reference.venue.trim()
      ? reference.venue.trim().slice(0, 240)
      : null;
    const doi = typeof reference.doi === "string" && reference.doi.trim()
      ? reference.doi.trim().slice(0, 240)
      : null;
    return [{
      abstract: abstracts.get(referenceId) ?? null,
      authors,
      doi,
      journal: venue,
      referenceId: referenceId.slice(0, 120),
      source: "research_starter" as const,
      title,
      url: safeUrl(reference.url),
      volumeIssuePages: null,
      year,
    } satisfies DiscoveryReference];
  });
}

function reportWithReferences(report: ResearchStarterSuccess, references: DiscoveryReference[]) {
  return {
    ...report,
    references: references.map((reference) => ({
      authors: reference.authors,
      citationCount: null,
      doi: reference.doi,
      openAccessStatus: "unknown",
      paperId: reference.referenceId,
      referenceId: reference.referenceId,
      sources: [],
      title: reference.title,
      url: reference.url,
      venue: reference.journal,
      year: reference.year,
    })),
  } satisfies ResearchStarterSuccess;
}

async function fetchVerifiedLiterature(
  project: Project,
  interpreted: InterpretedDiscovery,
  deadline: number,
) {
  let activeInterpretation = interpreted;
  const search = (topic: string, interval: "last-5-years" | "last-10-years") => fetchResearchStarterReport({
    includeMarkdown: false,
    maxReferences: 20,
    maxTopPapers: 10,
    publicationInterval: { kind: interval },
    topic,
  }, { maxAttempts: 2, timeoutMs: remainingTime(deadline) });

  let report: ResearchStarterSuccess;
  try {
    report = await search(activeInterpretation.researchQuery, "last-5-years");
  } catch (error) {
    if (error instanceof ResearchStarterClientError && error.code === "not-configured") {
      throw new DiscoveryError("O Research Starter não está configurado neste ambiente.", {
        code: "research-starter-config",
        stage: "literature",
        retryable: false,
      });
    }
    if (error instanceof ResearchStarterClientError && error.code === "unauthorized") {
      throw new DiscoveryError("A integração com o Research Starter recusou a credencial configurada. A equipe precisa atualizar essa integração antes de uma nova tentativa.", {
        code: "research-starter-unauthorized",
        stage: "literature",
        retryable: false,
      });
    }
    if (error instanceof ResearchStarterClientError && !error.retryable) throw error;
    throw new DiscoveryError("O Research Starter está temporariamente indisponível. Tente novamente.", {
      code: "research-starter-unavailable",
      stage: "literature",
    });
  }

  let references = normalizeReferences(report);
  if (references.length === 0) {
    report = await search(activeInterpretation.researchQuery, "last-10-years");
    references = normalizeReferences(report);
  }

  if (references.length === 0) {
    let broaderQuery: string;
    try {
      broaderQuery = await broadenResearchQuery(project, activeInterpretation.researchQuery);
    } catch (error) {
      throw classifyGeminiError(error, "literature");
    }
    if (broaderQuery.toLocaleLowerCase("en") !== activeInterpretation.researchQuery.toLocaleLowerCase("en")) {
      report = await search(broaderQuery, "last-10-years");
      references = normalizeReferences(report);
      if (references.length > 0) activeInterpretation = { ...activeInterpretation, researchQuery: broaderQuery };
    }
  }

  if (references.length === 0) {
    throw new DiscoveryError("Research Starter não encontrou referências verificáveis para este tema.", {
      code: "research-starter-empty",
      stage: "literature",
      retryable: true,
    });
  }

  return { interpreted: activeInterpretation, report: reportWithReferences(report, references), references };
}

export async function discoverResearchProposals(project: Project, initialBriefing: ResearchIntake | null = null) {
  const originalPrompt = compactOriginalPrompt(project.problem_statement?.trim() || project.theme?.trim() || project.title.trim());
  if (originalPrompt.length < 8) {
    throw new DiscoveryError("O briefing da pesquisa é muito curto para formar propostas.", {
      code: "briefing-too-short",
      stage: "interpreting",
      retryable: false,
    });
  }

  let initialInterpretation: InterpretedDiscovery;
  try {
    initialInterpretation = await interpretResearchRequest(project, { initialBriefing });
  } catch (error) {
    throw classifyGeminiError(error, "interpreting");
  }
  const { interpreted, report, references } = await fetchVerifiedLiterature(
    project,
    initialInterpretation,
    Date.now() + DISCOVERY_DEADLINE_MS,
  );
  let candidates;
  try {
    candidates = await generateProblemCandidates(originalPrompt, interpreted, report);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Referências não verificadas")) {
      throw new DiscoveryError("A IA associou uma fonte não verificada às propostas. Tente novamente.", {
        code: "unverified-references",
        stage: "proposals",
      });
    }
    const classified = classifyGeminiError(error, "proposals");
    if (classified.code === "gemini-quota-exhausted" || classified.code === "gemini-unavailable") throw classified;
    throw new DiscoveryError("A IA não devolveu seis propostas válidas. Tente novamente.", {
      code: "proposal-shape-invalid",
      stage: "proposals",
    });
  }

  return proposalDiscoverySchema.parse({
    candidates,
    generatedAt: new Date().toISOString(),
    interpreted,
    originalPrompt,
    references: references.slice(0, 20),
    reportId: report.reportId,
    selectedCandidateId: null,
    warnings: report.warnings.slice(0, 12),
  });
}
