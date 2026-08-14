import { z } from "zod";

export const chapterTopicInputSchema = z.object({
  exceptionJustification: z.string().trim().max(500).nullable().default(null),
  generalObjectiveAligned: z.boolean().default(false),
  id: z.string().uuid(),
  objectiveCoverage: z.array(z.object({
    degree: z.enum(["partial", "full"]),
    objectiveId: z.string().uuid(),
  })).max(7),
  referenceIds: z.array(z.string().trim().min(1).max(120)).max(20),
  studentJustification: z.string().trim().max(1_000).nullable().default(null),
  title: z.string().trim().min(3).max(180),
});

export const chapterTopicsInputSchema = z.array(chapterTopicInputSchema).min(3).max(6);
export type ChapterTopicInput = z.infer<typeof chapterTopicInputSchema>;

function normalized(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

export function validateChapterTopics(
  topics: ChapterTopicInput[],
  options: {
    allowedObjectiveIds: Set<string>;
    generalObjectiveId?: string | null;
    allowedReferenceIds: Set<string>;
    chapter: "literature" | "development";
  },
) {
  const parsed = chapterTopicsInputSchema.safeParse(topics);
  if (!parsed.success) return ["O capítulo deve conter entre três e seis tópicos válidos."];
  const errors: string[] = [];
  const titles = parsed.data.map((topic) => normalized(topic.title));
  if (new Set(titles).size !== titles.length) errors.push("Existem tópicos redundantes ou com o mesmo título.");
  parsed.data.forEach((topic, index) => {
    const unknownObjectives = topic.objectiveCoverage.filter((coverage) => !options.allowedObjectiveIds.has(coverage.objectiveId));
    if (unknownObjectives.length > 0) errors.push(`O tópico ${index + 1} aponta para objetivo inexistente.`);
    const studyCaseIntro = options.chapter === "development" && index === 0 && Boolean(topic.exceptionJustification?.trim());
    if (topic.objectiveCoverage.length === 0 && !studyCaseIntro) {
      errors.push(`O tópico ${index + 1} precisa estar ligado a pelo menos um objetivo ou justificar a apresentação do estudo de caso.`);
    }
    const unknownReferences = topic.referenceIds.filter((referenceId) => !options.allowedReferenceIds.has(referenceId));
    if (unknownReferences.length > 0) errors.push(`O tópico ${index + 1} contém referência não verificada.`);
    if (topic.referenceIds.length === 0) errors.push(`O tópico ${index + 1} precisa de ao menos uma referência verificável.`);
    if (/resultados? (?:encontrados?|obtidos?)/i.test(topic.title)) {
      errors.push(`O tópico ${index + 1} antecipa resultados que ainda não existem.`);
    }
  });
  if (options.chapter === "development") {
    const last = parsed.data.at(-1)!;
    const linkedToGeneral = options.generalObjectiveId
      ? last.objectiveCoverage.some((coverage) => coverage.objectiveId === options.generalObjectiveId)
      : false;
    if (!last.generalObjectiveAligned && !linkedToGeneral && !last.exceptionJustification?.trim()) {
      errors.push("O último tópico do Capítulo 4 deve se relacionar ao objetivo geral ou registrar justificativa metodológica.");
    }
  }
  return [...new Set(errors)];
}

export function validateCompleteObjectiveCoverage(
  literatureTopics: ChapterTopicInput[],
  developmentTopics: ChapterTopicInput[],
  objectiveIds: string[],
) {
  const errors: string[] = [];
  for (const objectiveId of objectiveIds) {
    const literature = literatureTopics.filter((topic) => topic.objectiveCoverage.some((coverage) => coverage.objectiveId === objectiveId));
    const development = developmentTopics.filter((topic) => topic.objectiveCoverage.some((coverage) => coverage.objectiveId === objectiveId));
    if (literature.length === 0 && development.length === 0) {
      errors.push(`Um objetivo específico está sem destino nos Capítulos 2 e 4: ${objectiveId}.`);
    }
  }
  return errors;
}

export function objectiveCoverageStatus(
  objectiveId: string,
  literatureTopics: ChapterTopicInput[],
  developmentTopics: ChapterTopicInput[],
) {
  const literature = literatureTopics.filter((topic) => topic.objectiveCoverage.some((coverage) => coverage.objectiveId === objectiveId));
  const development = developmentTopics.filter((topic) => topic.objectiveCoverage.some((coverage) => coverage.objectiveId === objectiveId));
  if (literature.length > 0 && development.length > 0) return "Atendido em ambos";
  if (development.length > 0) return "Atendido no Capítulo 4";
  if (literature.some((topic) => topic.objectiveCoverage.some((coverage) => coverage.objectiveId === objectiveId && coverage.degree === "full"))) {
    return "Atendido no Capítulo 2";
  }
  if (literature.length > 0) return "Parcialmente atendido";
  return "Não atendido";
}
