/** UTF-16 code units, shared with HTML maxLength and Zod string validation. */
export const FIELD_LIMITS = {
  problem: 500,
  objective: 700,
  topic: 180,
  title: 240,
  dataCollection: 1_200,
  analysisTreatment: 1_200,
  expectedResult: 1_000,
  rationale: 800,
  classificationItem: 120,
  ethicsWarning: 400,
  studentJustification: 1_000,
  exceptionJustification: 500,
} as const;

export const CLASSIFICATION_LIST_COUNTS = {
  procedures: 8,
  instruments: 8,
  analysisTechniques: 6,
  ethicsWarnings: 6,
} as const;

/** One item per line: commas inside an item must survive the edit/save round trip. */
export function classificationListText(items: string[]) { return items.join("\n"); }
export function parseClassificationList(text: string) {
  return text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}
export function classificationListMaxLength(field: keyof typeof CLASSIFICATION_LIST_COUNTS) {
  const count = CLASSIFICATION_LIST_COUNTS[field];
  return count * (field === "ethicsWarnings" ? FIELD_LIMITS.ethicsWarning : FIELD_LIMITS.classificationItem) + count - 1;
}

/** Let an existing oversized legacy draft be saved for regeneration, never expanded.
 * Confirmation and new AI output still use the strict problem limit. */
export function problemDraftLimit(previous = "") {
  return Math.max(FIELD_LIMITS.problem, Math.min(previous.length, 12_000));
}

/** Keep server limits aligned with HTML maxLength after Zod switched to code points.
 * No Unicode flag: each match consumes one UTF-16 code unit, including newlines.
 */
export function utf16MaxLengthPattern(limit: number) {
  return new RegExp(`^[\\s\\S]{0,${limit}}$`);
}
