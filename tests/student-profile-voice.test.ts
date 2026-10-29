import assert from "node:assert/strict";
import { test } from "node:test";
import { parseStudentAcademicProfile } from "../modules/profile/student-academic-profile";
import { appendDictation } from "../modules/voice/voice-dictation";

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

test("dictation appends without erasing text and respects the box limit", () => {
  assert.deepEqual(appendDictation("Texto escrito", " nova  frase ", 18), { value: "Texto escrito nova", truncated: true });
  assert.deepEqual(appendDictation("", " nova  frase ", 40), { value: "nova frase", truncated: false });
  assert.deepEqual(appendDictation("texto", "", 40), { value: "texto", truncated: false });
});
