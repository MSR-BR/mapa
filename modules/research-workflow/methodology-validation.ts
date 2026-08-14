import { z } from "zod";

import {
  methodologyClassificationSchema,
  methodologyRowSchema,
  type MethodologyClassification,
  type MethodologyRow,
} from "./schema";

export const methodologyClassificationInputSchema = methodologyClassificationSchema.omit({
  revision: true,
  sourceRevision: true,
  status: true,
  updatedBy: true,
});

export const methodologyRowInputSchema = methodologyRowSchema.omit({
  revision: true,
  sourceRevision: true,
  status: true,
  updatedBy: true,
  warnings: true,
}).extend({
  studentJustification: z.string().trim().max(1_000).nullable().default(null),
  warnings: z.array(z.string().trim().min(1).max(500)).max(6).default([]),
});

export const methodologyPlanInputSchema = z.object({
  classification: methodologyClassificationInputSchema,
  rows: z.array(methodologyRowInputSchema).min(3).max(7),
  title: z.string().trim().min(3).max(120),
});

export type MethodologyPlanInput = z.infer<typeof methodologyPlanInputSchema>;

function normalized(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function includesAny(value: string, terms: string[]) {
  const text = normalized(value);
  return terms.some((term) => text.includes(normalized(term)));
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function methodologyRowLabel(
  index: number,
  row?: MethodologyRow | MethodologyPlanInput["rows"][number],
  options?: { allowedObjectiveIds?: Set<string>; generalObjectiveId?: string | null },
) {
  if (row && options?.generalObjectiveId && row.objectiveId === options.generalObjectiveId) return "OEG (objetivo geral)";
  if (row && options?.allowedObjectiveIds) {
    const objectiveIndex = [...options.allowedObjectiveIds].findIndex((objectiveId) => objectiveId === row.objectiveId);
    if (objectiveIndex >= 0) return `OE${objectiveIndex + 1} (objetivo específico ${objectiveIndex + 1})`;
  }
  return `OE${index + 1} (objetivo específico ${index + 1})`;
}

function likelyInstrument(row: MethodologyRow | MethodologyPlanInput["rows"][number]) {
  const collection = row.dataCollection;
  if (includesAny(collection, ["entrevista", "grupo focal", "relato"])) return "qualitative";
  if (includesAny(collection, ["questionário", "survey", "escala", "base de dados", "dados secundários"])) return "quantitative";
  if (includesAny(collection, ["documento", "bibliográfica", "literatura", "normativa", "documental"])) return "documentary";
  if (includesAny(collection, ["observação", "observacao", "diário de campo"])) return "observational";
  if (includesAny(collection, ["experimento", "medição", "medicao", "ensaio", "sensor"])) return "measurement";
  return "unknown";
}

function likelyAnalysis(row: MethodologyRow | MethodologyPlanInput["rows"][number]) {
  const analysis = row.analysisTreatment;
  if (includesAny(analysis, ["análise de conteúdo", "análise temática", "codificação", "categorias"])) return "qualitative";
  if (includesAny(analysis, ["estatística", "regressão", "inferencial", "descritiva", "correlação"])) return "quantitative";
  if (includesAny(analysis, ["análise documental", "análise bibliométrica", "revisão", "síntese narrativa"])) return "documentary";
  if (includesAny(analysis, ["triangulação", "mista"])) return "mixed";
  return "unknown";
}

export function methodologyCompatibilityWarnings(
  rows: Array<MethodologyRow | MethodologyPlanInput["rows"][number]>,
  classification: MethodologyClassification | MethodologyPlanInput["classification"],
  options: { allowedObjectiveIds?: Set<string>; generalObjectiveId?: string | null } = {},
) {
  const warnings: string[] = [];
  const approach = classification.approach;

  for (const [index, row] of rows.entries()) {
    const instrument = likelyInstrument(row);
    const analysis = likelyAnalysis(row);
    const label = methodologyRowLabel(index, row, options);

    if (instrument === "qualitative" && analysis === "quantitative") {
      warnings.push(`${label}: entrevistas ou relatos geralmente pedem análise qualitativa ou mista; confirme se haverá quantificação adequada.`);
    }
    if (instrument === "quantitative" && analysis === "qualitative") {
      warnings.push(`${label}: questionários, escalas ou bases numéricas geralmente pedem tratamento estatístico ou justificativa mista.`);
    }
    if (instrument === "documentary" && analysis === "quantitative" && !includesAny(row.analysisTreatment, ["bibliométrica", "frequência", "estatística descritiva"])) {
      warnings.push(`${label}: dados documentais com estatística precisam indicar unidade de contagem ou codificação.`);
    }
    if (analysis === "unknown") {
      warnings.push(`${label}: a técnica de análise ainda está genérica; vale explicitar como os dados serão tratados.`);
    }
  }

  if (approach === "Qualitativa" && classification.analysisTechniques.some((technique) => includesAny(technique, ["estatística inferencial", "regressão"]))) {
    warnings.push("A abordagem qualitativa está combinada com técnica estatística inferencial; confirme se a abordagem deveria ser mista ou quantitativa.");
  }
  if (approach === "Quantitativa" && classification.instruments.some((instrument) => includesAny(instrument, ["entrevista", "grupo focal"]))) {
    warnings.push("A abordagem quantitativa usa instrumento qualitativo; indique codificação/quantificação ou ajuste a abordagem.");
  }

  return unique(warnings);
}

export function validateMethodologyPlan(
  input: MethodologyPlanInput,
  options: {
    allowedObjectiveIds: Set<string>;
    allowedTopicIds: Set<string>;
    generalObjective: string;
    generalObjectiveId?: string | null;
  },
) {
  const parsed = methodologyPlanInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      errors: ["A matriz metodológica precisa estar completa e respeitar os limites de texto."],
      warnings: [],
    };
  }

  const errors: string[] = [];
  const objectiveIds = parsed.data.rows.map((row) => row.objectiveId);
  const objectiveSet = new Set(objectiveIds);
  const generalObjectiveRows = options.generalObjectiveId
    ? parsed.data.rows.filter((row) => row.objectiveId === options.generalObjectiveId)
    : [];

  if (objectiveSet.size !== objectiveIds.length) {
    errors.push("Cada objetivo deve aparecer em uma única linha da matriz.");
  }
  for (const objectiveId of options.allowedObjectiveIds) {
    if (!objectiveSet.has(objectiveId)) errors.push("Todo objetivo específico validado precisa ter uma linha metodológica.");
  }
  if (options.generalObjectiveId && !objectiveSet.has(options.generalObjectiveId)) {
    errors.push("O objetivo geral (OEG) precisa ter uma linha metodológica de síntese.");
  }
  for (const objectiveId of objectiveSet) {
    if (!options.allowedObjectiveIds.has(objectiveId) && objectiveId !== options.generalObjectiveId) {
      errors.push("A matriz aponta para objetivo inexistente.");
    }
  }
  if (generalObjectiveRows.length > 1) {
    errors.push("O objetivo geral deve aparecer no máximo uma vez na matriz.");
  }

  parsed.data.rows.forEach((row, index) => {
    const unknownTopics = row.associatedTopicIds.filter((topicId) => !options.allowedTopicIds.has(topicId));
    const label = methodologyRowLabel(index, row, options);
    if (unknownTopics.length > 0) errors.push(`${label} aponta para tópico de capítulo inexistente.`);
    if (row.associatedTopicIds.length === 0) errors.push(`${label} precisa estar ligado a ao menos um tópico dos capítulos 2 ou 4.`);
    if (includesAny(row.expectedResult, [
      "foi encontrado",
      "foram encontrados",
      "foi observado",
      "foram observados",
      "foi obtido",
      "foram obtidos",
      "demonstrou que",
      "comprovou que",
      "verificou-se",
      "constatou-se",
      "resultados encontrados",
      "resultados obtidos",
    ])) {
      errors.push(`${label} descreve achados como se a pesquisa já tivesse sido executada.`);
    }
  });

  if (parsed.data.title.length > 100) {
    errors.push("O título final deve ser curto o bastante para identificar o projeto.");
  }
  if (!includesAny(parsed.data.title, options.generalObjective.split(/\s+/).filter((word) => word.length > 5).slice(0, 6))) {
    errors.push("O título final precisa derivar semanticamente do objetivo geral validado.");
  }

  return {
    errors: unique(errors),
    warnings: methodologyCompatibilityWarnings(parsed.data.rows, parsed.data.classification, {
      allowedObjectiveIds: options.allowedObjectiveIds,
      generalObjectiveId: options.generalObjectiveId,
    }),
  };
}
