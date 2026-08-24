import type { Project } from "../modules/projects/types";
import { suggestResearchPrompts } from "../modules/generation/gemini";
import { discoverResearchProposals } from "../modules/research-workflow/discovery-service";
import type { ResearchIntake } from "../modules/projects/research-intake";

const now = new Date().toISOString();
const project = {
  academic_level: "masters",
  advisor_email: null,
  advisor_id: null,
  created_at: now,
  deleted_at: null,
  id: crypto.randomUUID(),
  keywords: ["Arduino", "ensino de Física", "aprendizagem conceitual"],
  knowledge_area: "Ensino de Física",
  owner_id: crypto.randomUUID(),
  problem_statement: "Como o uso de atividades com Arduino influencia a compreensão de conceitos de Física no ensino médio?",
  status: "draft",
  theme: "Arduino e aprendizagem conceitual em Física no ensino médio",
  title: "Arduino e aprendizagem conceitual em Física",
  updated_at: now,
  workflow_version: 2,
} satisfies Project;

const briefing: ResearchIntake = {
  problemContext: "O ensino médio apresenta dificuldades persistentes na compreensão de conceitos de Física.",
  observedSituation: "Atividades experimentais com Arduino parecem aumentar a participação, mas seus efeitos conceituais precisam ser examinados.",
  discrepancyConsequences: "Embora se espere aprendizagem mais significativa, ainda há dúvidas sobre a relação entre a atividade e a compreensão efetiva.",
  existingKnowledgeGap: "A literatura discute tecnologias educacionais, mas não esclarece suficientemente este recorte de aprendizagem conceitual.",
  delimitationQuestion: "Como atividades com Arduino influenciam a compreensão de conceitos de Física no ensino médio?",
  researchType: "dissertacao",
};

const quickSuggestions = await suggestResearchPrompts(
  "Quero investigar como atividades experimentais podem melhorar a aprendizagem de Física no ensino médio.",
);
if (quickSuggestions.length !== 3) {
  throw new Error(`Mapa Rápido retornou ${quickSuggestions.length} sugestões; eram esperadas 3.`);
}

const discovery = await discoverResearchProposals(project, briefing);
if (discovery.candidates.length !== 6) {
  throw new Error(`Mapa Avançado retornou ${discovery.candidates.length} cards; eram esperados 6.`);
}
if (discovery.candidates[0]?.kind !== "exact" || discovery.candidates.slice(1).some((candidate) => candidate.kind !== "alternative")) {
  throw new Error("A ordem/tipologia dos seis cards não respeita a proposta exata seguida de cinco alternativas.");
}
const positions = discovery.candidates.map((candidate) => candidate.position).join(",");
if (positions !== "1,2,3,4,5,6") throw new Error(`Posições inválidas nos cards: ${positions}.`);
const referenceIds = new Set(discovery.references.map((reference) => reference.referenceId));
const invalidReferenceIds = discovery.candidates.flatMap((candidate) => candidate.referenceIds)
  .filter((referenceId) => !referenceIds.has(referenceId));
if (invalidReferenceIds.length > 0) throw new Error(`Cards associaram referências não verificadas: ${[...new Set(invalidReferenceIds)].join(", ")}.`);

console.log(JSON.stringify({
  advancedCandidates: discovery.candidates.length,
  advancedReferences: discovery.references.length,
  exactCandidateTitle: discovery.candidates[0]?.title,
  quickSuggestions: quickSuggestions.length,
  reportId: discovery.reportId,
  status: "passed",
}));
