export const STUDY_LEVELS = [
  { value: "tcc", label: "TCC / graduação" },
  { value: "academic_masters", label: "Mestrado acadêmico" },
  { value: "professional_masters", label: "Mestrado profissional" },
  { value: "doctorate", label: "Doutorado" },
  { value: "other", label: "Outro" },
] as const;

export type StudyLevel = (typeof STUDY_LEVELS)[number]["value"];

export function parseStudentAcademicProfile(formData: FormData) {
  const read = (key: string, max: number) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max + 1) : "";
  };
  const displayName = read("displayName", 120);
  const university = read("university", 160);
  const department = read("department", 160);
  const courseName = read("courseName", 160);
  const studyLevels = formData.getAll("studyLevels").filter((value): value is string => typeof value === "string");
  if ([displayName, university, department, courseName].some((value) => value.length < 2)
    || displayName.length > 120 || university.length > 160 || department.length > 160 || courseName.length > 160
    || studyLevels.length < 1 || studyLevels.length > STUDY_LEVELS.length
    || new Set(studyLevels).size !== studyLevels.length
    || !studyLevels.every((value) => STUDY_LEVELS.some((item) => item.value === value))) return null;
  return { display_name: displayName, university, department, course_name: courseName, study_levels: studyLevels as StudyLevel[] };
}
