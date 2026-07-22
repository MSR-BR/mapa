import type { ProjectField, ProjectFormValues } from "./types";

const ACADEMIC_LEVELS = new Set([
  "undergraduate",
  "specialization",
  "masters",
  "doctorate",
  "other",
]);

const FIELD_LIMITS = {
  knowledgeArea: 120,
  problemStatement: 5000,
  theme: 500,
  title: 160,
} as const;

function readText(formData: FormData, name: ProjectField) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function readProjectFormValues(formData: FormData): ProjectFormValues {
  return {
    academicLevel: readText(formData, "academicLevel"),
    knowledgeArea: readText(formData, "knowledgeArea"),
    keywords: readText(formData, "keywords"),
    problemStatement: readText(formData, "problemStatement"),
    theme: readText(formData, "theme"),
    title: readText(formData, "title"),
  };
}

export function parseProjectForm(formData: FormData) {
  const values = readProjectFormValues(formData);
  const title = values.title.trim();
  const keywords = [
    ...new Set(
      values.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  ];
  const fieldErrors: Partial<Record<ProjectField, string>> = {};

  if (!title) fieldErrors.title = "Informe um título para o projeto.";
  else if (title.length > FIELD_LIMITS.title) fieldErrors.title = "Use no máximo 160 caracteres.";

  if (values.theme.trim().length > FIELD_LIMITS.theme) {
    fieldErrors.theme = "Use no máximo 500 caracteres.";
  }
  if (values.problemStatement.trim().length > FIELD_LIMITS.problemStatement) {
    fieldErrors.problemStatement = "Use no máximo 5.000 caracteres.";
  }
  if (keywords.length > 12) fieldErrors.keywords = "Informe no máximo 12 palavras-chave.";
  else if (keywords.some((keyword) => keyword.length > 60)) {
    fieldErrors.keywords = "Cada palavra-chave pode ter no máximo 60 caracteres.";
  }
  if (values.knowledgeArea.trim().length > FIELD_LIMITS.knowledgeArea) {
    fieldErrors.knowledgeArea = "Use no máximo 120 caracteres.";
  }
  if (values.academicLevel && !ACADEMIC_LEVELS.has(values.academicLevel)) {
    fieldErrors.academicLevel = "Selecione um nível acadêmico válido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, success: false as const, values };
  }

  return {
    data: {
      academic_level: values.academicLevel || null,
      knowledge_area: values.knowledgeArea.trim() || null,
      keywords,
      problem_statement: values.problemStatement.trim() || null,
      theme: values.theme.trim() || null,
      title,
    },
    success: true as const,
  };
}

export function readProjectId(formData: FormData) {
  const value = formData.get("projectId");
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}
