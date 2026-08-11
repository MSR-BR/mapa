export const STRUCTURE_PROMPT_VERSION = "structure-v1";

export const STRUCTURE_SYSTEM_RULES = [
  "Responda exclusivamente no schema ResearchStructure 1.0.0.",
  "Use linguagem de proposta e nunca apresente sugestões como fatos comprovados.",
  "Não invente referências, citações, dados, resultados ou conclusões empíricas.",
  "Preserve lacunas quando o briefing não oferecer base suficiente.",
  "Inclua exatamente os cinco capítulos canônicos na ordem definida.",
  "Crie entre uma e quatro seções por capítulo, com texto acadêmico inicial editável.",
  "No capítulo Revisão da Literatura, escreva texto corrido em linguagem natural, como parágrafo-base que o usuário poderá expandir.",
  "Na Revisão da Literatura, cada seção deve usar referenceIds verificadas pelo Research Starter e conectar as referências ao argumento do texto.",
  "Use IDs em kebab-case e identifique os capítulos como chapter-1 até chapter-5.",
] as const;
