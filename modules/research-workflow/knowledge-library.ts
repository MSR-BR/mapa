import type { KnowledgeSuggestion } from "./schema";

export const KNOWLEDGE_LIBRARY_VERSION = "1.0.0";

const CONTROLLED_CONCEPTS = [
  {
    rationale: "Pode ampliar a leitura de governança ambiental, social e organizacional quando o tema tratar de sustentabilidade.",
    term: "ESG",
    triggers: ["sustentabilidade", "governança ambiental", "responsabilidade corporativa"],
  },
  {
    rationale: "Pode organizar a relação da pesquisa com metas globais de desenvolvimento sustentável, mediante validação do usuário.",
    term: "Objetivos de Desenvolvimento Sustentável (ODS)",
    triggers: ["sustentabilidade", "desenvolvimento sustentável", "agenda 2030"],
  },
  {
    rationale: "Pode oferecer vocabulário complementar para pesquisas sobre ciclos de materiais, resíduos e sustentabilidade.",
    term: "Economia circular",
    triggers: ["sustentabilidade", "resíduos", "reciclagem", "ciclo de vida"],
  },
] as const;

export function suggestControlledConcepts(keywords: string[], existing: KnowledgeSuggestion[] = []) {
  const searchable = keywords.join(" ").toLocaleLowerCase("pt-BR");
  const existingTerms = new Set(existing.map((suggestion) => suggestion.term.toLocaleLowerCase("pt-BR")));
  return CONTROLLED_CONCEPTS
    .filter((concept) => concept.triggers.some((trigger) => searchable.includes(trigger)))
    .filter((concept) => !existingTerms.has(concept.term.toLocaleLowerCase("pt-BR")))
    .map((concept): KnowledgeSuggestion => ({
      id: crypto.randomUUID(),
      libraryVersion: KNOWLEDGE_LIBRARY_VERSION,
      rationale: concept.rationale,
      status: "suggested",
      term: concept.term,
    }));
}
