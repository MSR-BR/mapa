"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveStudentAcademicProfile, type StudentAcademicSaveState } from "./student-academic-actions";
import { STUDY_LEVELS, type StudyLevel } from "./student-academic-profile";

type Fields = {
  displayName: string;
  university: string;
  department: string;
  courseName: string;
  studyLevels: StudyLevel[];
};

const initialActionState: StudentAcademicSaveState = { status: "idle" };

export function StudentAcademicForm({ initial }: { initial: Fields }) {
  const [fields, setFields] = useState(initial);
  const [state, formAction, pending] = useActionState(saveStudentAcademicProfile, initialActionState);
  const setField = (field: keyof Omit<Fields, "studyLevels">, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
  };
  const toggleLevel = (level: StudyLevel, checked: boolean) => {
    setFields((current) => ({
      ...current,
      studyLevels: checked
        ? [...current.studyLevels, level]
        : current.studyLevels.filter((item) => item !== level),
    }));
  };

  return <form action={formAction} className="student-profile-form">
    {state.status !== "idle" ? <p role="alert" className="error-state">
      {state.status === "invalid" ? "Revise os campos obrigatórios e marque pelo menos um nível de curso." : "Não foi possível salvar agora. Seus dados continuam aqui; tente novamente."}
    </p> : null}
    <label>Seu nome <input name="displayName" autoComplete="name" value={fields.displayName} onChange={(event) => setField("displayName", event.target.value)} minLength={2} maxLength={120} required /></label>
    <label>Universidade ou instituição <input name="university" autoComplete="organization" value={fields.university} onChange={(event) => setField("university", event.target.value)} minLength={2} maxLength={160} required /></label>
    <label>Instituto ou departamento <input name="department" value={fields.department} onChange={(event) => setField("department", event.target.value)} minLength={2} maxLength={160} required /></label>
    <label>Curso ou programa <input name="courseName" value={fields.courseName} onChange={(event) => setField("courseName", event.target.value)} minLength={2} maxLength={160} required /></label>
    <fieldset><legend>Nível do curso</legend><p>Marque as opções que descrevem seus vínculos atuais.</p>
      {STUDY_LEVELS.map((item) => <label key={item.value}><input type="checkbox" name="studyLevels" value={item.value} checked={fields.studyLevels.includes(item.value)} onChange={(event) => toggleLevel(item.value, event.target.checked)} />{item.label}</label>)}
    </fieldset>
    <div className="student-profile-actions"><button className="primary-button" disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar dados"}</button><Link href="/dashboard">Preencher depois</Link></div>
  </form>;
}
