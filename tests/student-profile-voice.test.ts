import assert from "node:assert/strict";
import { test } from "node:test";
import { parseStudentAcademicProfile } from "../modules/profile/student-academic-profile";
import { insertDictation } from "../modules/voice/voice-dictation";

test("student profile keeps multiple course levels and rejects missing data", () => {
  const form = new FormData();
  form.set("displayName", "  Ana  Silva  ");
  form.set("university", "Universidade Federal Fluminense");
  form.set("department", "Instituto de Física");
  form.set("courseName", "Física");
  form.append("studyLevels", "tcc");
  form.append("studyLevels", "academic_masters");
  assert.deepEqual(parseStudentAcademicProfile(form)?.study_levels, ["tcc", "academic_masters"]);
  assert.equal(parseStudentAcademicProfile(form)?.display_name, "Ana Silva");
  form.set("studyLevels", "unknown");
  assert.equal(parseStudentAcademicProfile(form), null);
});

test("dictation inserts at the caret without erasing text and respects the box limit", () => {
  assert.deepEqual(insertDictation("Texto escrito", " nova  frase ", 13, 18), { value: "Texto escrito nova", caret: 18, truncated: true });
  assert.deepEqual(insertDictation("Texto final", "novo", 6, 40), { value: "Texto novo final", caret: 10, truncated: false });
  assert.deepEqual(insertDictation("final", "novo", 0, 40), { value: "novo final", caret: 4, truncated: false });
  assert.deepEqual(insertDictation("texto", "", 3, 40), { value: "texto", caret: 3, truncated: false });
  assert.deepEqual(insertDictation("texto", "novo", 5, 5), { value: "texto", caret: 5, truncated: true });
});
