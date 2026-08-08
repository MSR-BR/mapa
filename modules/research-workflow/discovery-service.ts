import "server-only";

import {
  broadenResearchQuery,
  generateProblemCandidates,
  interpretResearchRequest,
} from "@/modules/generation/gemini";
import type { Project } from "@/modules/projects/types";
import { fetchResearchStarterReport } from "@/modules/research-starter/client";
import { proposalDiscoverySchema, type InterpretedDiscovery } from "./schema";

async function fetchVerifiedLiterature(
  project: Project,
  interpreted: InterpretedDiscovery,
) {
  let activeInterpretation = interpreted;
  let report = await fetchResearchStarterReport({
    includeMarkdown: false,
    maxReferences: 20,
    maxTopPapers: 10,
    publicationInterval: { kind: "last-5-years" },
    topic: activeInterpretation.researchQuery,
  });

  if (report.references.length === 0) {
    report = await fetchResearchStarterReport({
      includeMarkdown: false,
      maxReferences: 20,
      maxTopPapers: 10,
      publicationInterval: { kind: "last-10-years" },
      topic: activeInterpretation.researchQuery,
    });
  }

  if (report.references.length === 0) {
    const broaderQuery = await broadenResearchQuery(project, activeInterpretation.researchQuery);
    if (broaderQuery.toLocaleLowerCase("en") !== activeInterpretation.researchQuery.toLocaleLowerCase("en")) {
      report = await fetchResearchStarterReport({
        includeMarkdown: false,
        maxReferences: 20,
        maxTopPapers: 10,
        publicationInterval: { kind: "last-10-years" },
        topic: broaderQuery,
      });
      if (report.references.length > 0) {
        activeInterpretation = { ...activeInterpretation, researchQuery: broaderQuery };
      }
    }
  }

  if (report.references.length === 0) {
    throw new Error("Research Starter não encontrou referências verificáveis para este tema.");
  }

  return { interpreted: activeInterpretation, report };
}

export async function discoverResearchProposals(project: Project) {
  const originalPrompt = project.problem_statement?.trim() || project.theme?.trim() || project.title.trim();
  if (originalPrompt.length < 8) throw new Error("O tema da pesquisa é muito curto.");

  const initialInterpretation = await interpretResearchRequest(project);
  const { interpreted, report } = await fetchVerifiedLiterature(project, initialInterpretation);
  const candidates = await generateProblemCandidates(originalPrompt, interpreted, report);

  return proposalDiscoverySchema.parse({
    candidates,
    generatedAt: new Date().toISOString(),
    interpreted,
    originalPrompt,
    references: report.references.slice(0, 20).map(({ authors, doi, referenceId, title, url, year }) => ({
      authors: authors.slice(0, 8),
      doi,
      referenceId,
      title,
      url,
      year,
    })),
    reportId: report.reportId,
    selectedCandidateId: null,
    warnings: report.warnings.slice(0, 12),
  });
}
