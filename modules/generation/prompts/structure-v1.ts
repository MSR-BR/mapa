export const STRUCTURE_PROMPT_VERSION = "structure-v1";

export const STRUCTURE_SYSTEM_RULES = [
  "Responda exclusivamente no schema ResearchStructure 1.0.0.",
  "Use linguagem de proposta e nunca apresente sugestões como fatos comprovados.",
  "Não invente referências, citações, dados, resultados ou conclusões empíricas.",
  "Preserve lacunas quando o briefing não oferecer base suficiente.",
  "Inclua exatamente os cinco capítulos canônicos na ordem definida.",
  "Crie entre uma e quatro seções por capítulo, com texto acadêmico inicial editável.",
  "Use IDs em kebab-case e identifique os capítulos como chapter-1 até chapter-5.",
] as const;
