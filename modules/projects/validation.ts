const ACADEMIC_LEVELS = new Set([
  "undergraduate",
  "specialization",
  "masters",
  "doctorate",
  "other",
]);

function optionalText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maxLength
    ? normalized
    : null;
}

export function parseProjectForm(formData: FormData) {
  const titleValue = formData.get("title");
  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const academicLevelValue = formData.get("academicLevel");
  const academicLevel =
    typeof academicLevelValue === "string" && ACADEMIC_LEVELS.has(academicLevelValue)
      ? academicLevelValue
      : null;
  const keywordsValue = formData.get("keywords");
  const keywords = [
    ...new Set(
      (typeof keywordsValue === "string" ? keywordsValue : "")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  ];

  if (
    title.length < 1 ||
    title.length > 160 ||
    keywords.length > 12 ||
    keywords.some((keyword) => keyword.length > 60)
  ) {
    return null;
  }

  return {
    academic_level: academicLevel,
    knowledge_area: optionalText(formData, "knowledgeArea", 120),
    keywords,
    problem_statement: optionalText(formData, "problemStatement", 5000),
    theme: optionalText(formData, "theme", 500),
    title,
  };
}

export function readProjectId(formData: FormData) {
  const value = formData.get("projectId");
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}
