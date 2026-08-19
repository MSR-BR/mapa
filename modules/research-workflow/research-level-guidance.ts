import { z } from "zod";

export const RESEARCH_PRODUCT_TYPES = [
  {
    id: "tcc",
    label: "TCC / Graduação",
    shortDescription: "Investigação delimitada, com revisão e método proporcionais ao trabalho de conclusão.",
    dimensions: {
      finalidade: "Demonstrar domínio dos fundamentos e responder a uma questão delimitada.",
      publico: "Banca e comunidade acadêmica de graduação.",
      problema: "Claro, específico e viável no tempo e nos recursos disponíveis.",
      lacuna: "Lacuna prática ou explicativa pontual; não exige originalidade forte.",
      originalidade: "Aplicação, sistematização ou análise de um recorte conhecido.",
      literatura: "Seleção essencial de conceitos e estudos diretamente relacionados.",
      metodologia: "Método coerente, descrito com clareza e sem complexidade desnecessária.",
      dados: "Conjunto suficiente para sustentar a resposta, com limites explicitados.",
      analise: "Análise descritiva ou interpretativa compatível com a pergunta.",
      discussao: "Relaciona os resultados à literatura e reconhece limitações.",
      contribuicao: "Resposta consistente ao problema e aprendizagem metodológica.",
    },
  },
  {
    id: "monografia",
    label: "Monografia / Especialização",
    shortDescription: "Aprofunda um problema profissional ou aplicado com fundamentação e análise consistente.",
    dimensions: {
      finalidade: "Aprofundar uma questão de uma área de especialização e aplicar conhecimentos.",
      publico: "Banca e profissionais da área.",
      problema: "Delimitado, contextualizado e conectado a uma necessidade profissional ou social.",
      lacuna: "Limite de conhecimento ou de aplicação que o estudo pode esclarecer.",
      originalidade: "Recorte aplicado, adaptação de abordagem ou síntese crítica.",
      literatura: "Revisão seletiva e crítica, com conceitos e evidências suficientes.",
      metodologia: "Procedimentos detalhados e justificativa das escolhas.",
      dados: "Evidências adequadas ao contexto, à população ou ao caso investigado.",
      analise: "Interpretação fundamentada, podendo combinar técnicas qualitativas e quantitativas.",
      discussao: "Compara achados e implicações com a literatura e o contexto profissional.",
      contribuicao: "Recomendação, modelo, diagnóstico ou síntese útil ao campo.",
    },
  },
  {
    id: "dissertacao",
    label: "Dissertação / Mestrado",
    shortDescription: "Constrói uma resposta original e metodologicamente rigorosa para uma lacuna delimitada.",
    dimensions: {
      finalidade: "Demonstrar capacidade de investigação e produzir conhecimento defensável.",
      publico: "Banca e pesquisadores da área.",
      problema: "Questão relevante, precisa e sustentada por contexto e literatura.",
      lacuna: "Lacuna teórica, empírica ou metodológica claramente demonstrada.",
      originalidade: "Avanço incremental, evidência nova, comparação ou aplicação justificada.",
      literatura: "Revisão crítica, atualizada e organizada por conceitos e debates.",
      metodologia: "Desenho justificável, replicável em princípio e atento a validade e ética.",
      dados: "Dados suficientes, documentados e tratados de modo transparente.",
      analise: "Análise aprofundada, alinhada à pergunta e às limitações dos dados.",
      discussao: "Interpreta contribuições, alternativas e limites em diálogo com a literatura.",
      contribuicao: "Contribuição original delimitada e implicações para pesquisa ou prática.",
    },
  },
  {
    id: "tese",
    label: "Tese / Doutorado",
    shortDescription: "Desenvolve contribuição original, robusta e relevante para uma agenda de pesquisa.",
    dimensions: {
      finalidade: "Produzir contribuição original e relevante para o avanço do conhecimento.",
      publico: "Banca especializada e comunidade internacional de pesquisa.",
      problema: "Questão complexa, relevante e situada em uma agenda científica.",
      lacuna: "Lacuna robustamente demonstrada e conectada a debates de fronteira.",
      originalidade: "Contribuição substantiva em teoria, método, evidência ou aplicação.",
      literatura: "Revisão abrangente, crítica, atualizada e capaz de posicionar a tese.",
      metodologia: "Desenho rigoroso, justificável e transparente quanto a validade, limites e ética.",
      dados: "Evidências amplas ou profundas, com documentação e análise de robustez.",
      analise: "Análises avançadas, testes de alternativas e interpretação cuidadosa.",
      discussao: "Integra resultados, teoria, limites e consequências para a agenda de pesquisa.",
      contribuicao: "Avanço original, defensável e comunicável para o campo.",
    },
  },
  {
    id: "artigo-evento",
    label: "Artigo de evento acadêmico",
    shortDescription: "Comunica uma contribuição delimitada, clara e adequada ao espaço e ao prazo do evento.",
    dimensions: {
      finalidade: "Apresentar uma contribuição ou resultado em formato conciso.",
      publico: "Participantes e avaliadores do evento.",
      problema: "Foco estreito, com pergunta e mensagem central evidentes.",
      lacuna: "Lacuna ou oportunidade apresentada de forma objetiva.",
      originalidade: "Ideia, resultado preliminar, aplicação ou síntese relevante.",
      literatura: "Referências essenciais para situar a contribuição sem excesso.",
      metodologia: "Método resumido, suficiente para compreender a evidência.",
      dados: "Evidência diretamente ligada à mensagem principal.",
      analise: "Análise enxuta e convincente para o limite de páginas.",
      discussao: "Implicações e limites em linguagem direta.",
      contribuicao: "Mensagem ou resultado que justifica a apresentação.",
    },
  },
  {
    id: "artigo-periodico",
    label: "Artigo de periódico de alto impacto",
    shortDescription: "Exige pergunta forte, método transparente, evidência robusta e contribuição posicionada internacionalmente.",
    dimensions: {
      finalidade: "Comunicar contribuição nova, relevante e publicável para a comunidade científica.",
      publico: "Editores, revisores e pesquisadores especializados.",
      problema: "Pergunta forte, atual e explicitamente relevante para o debate.",
      lacuna: "Lacuna convincente, demonstrada por revisão crítica e atualizada.",
      originalidade: "Novidade clara em teoria, método, dados, mecanismo ou implicação.",
      literatura: "Revisão seletiva e crítica, com posicionamento internacional.",
      metodologia: "Método transparente, robusto, reprodutível quando aplicável e eticamente adequado.",
      dados: "Evidência de alta qualidade, com controles, incertezas e limitações.",
      analise: "Análise rigorosa, incluindo verificações de robustez quando pertinentes.",
      discussao: "Interpretação equilibrada, comparação com trabalhos anteriores e implicações.",
      contribuicao: "Avanço explícito e relevante, com limites e próximos passos.",
    },
  },
] as const;

export type ResearchProductType = (typeof RESEARCH_PRODUCT_TYPES)[number]["id"];
export const researchProductTypeSchema = z.enum(RESEARCH_PRODUCT_TYPES.map((item) => item.id) as [ResearchProductType, ...ResearchProductType[]]);
export type ResearchProductGuidance = (typeof RESEARCH_PRODUCT_TYPES)[number];

export function getResearchProductGuidance(type: ResearchProductType | null | undefined) {
  return RESEARCH_PRODUCT_TYPES.find((item) => item.id === type) ?? null;
}

export function formatResearchProductGuidance(type: ResearchProductType | null | undefined) {
  const item = getResearchProductGuidance(type);
  if (!item) return null;
  return [
    `Produto acadêmico selecionado: ${item.label}.`,
    `Nível de aprofundamento: ${item.shortDescription}`,
    ...Object.entries(item.dimensions).map(([dimension, instruction]) => `${dimension}: ${instruction}`),
  ].join(" ");
}
