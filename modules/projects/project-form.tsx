"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { Project } from "./types";
import {
  initialProjectActionState,
  type ProjectActionState,
} from "./types";

type ProjectFormProps = {
  action: (
    state: ProjectActionState,
    formData: FormData,
  ) => Promise<ProjectActionState>;
  project?: Project;
  submitLabel: string;
};

export function ProjectForm({ action, project, submitLabel }: ProjectFormProps) {
  const [dirty, setDirty] = useState(false);
  const submitting = useRef(false);
  const trackedAction = async (state: ProjectActionState, formData: FormData) => {
    try {
      const nextState = await action(state, formData);
      if (nextState.status === "success") setDirty(false);
      return nextState;
    } finally {
      submitting.current = false;
    }
  };
  const [state, formAction, pending] = useActionState(
    trackedAction,
    initialProjectActionState,
  );

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirty || submitting.current) return;
      event.preventDefault();
    };
    const confirmLinkNavigation = (event: MouseEvent) => {
      if (!dirty || submitting.current || event.defaultPrevented) return;
      const target = event.target as Element | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (link && link.origin === window.location.origin && !window.confirm("Descartar alterações não salvas?")) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    document.addEventListener("click", confirmLinkNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      document.removeEventListener("click", confirmLinkNavigation, true);
    };
  }, [dirty]);

  const errorFor = (field: keyof NonNullable<ProjectActionState["fieldErrors"]>) =>
    state.fieldErrors?.[field];
  const fieldA11y = (field: keyof NonNullable<ProjectActionState["fieldErrors"]>) => ({
    "aria-describedby": errorFor(field) ? `${field}-error` : undefined,
    "aria-invalid": Boolean(errorFor(field)),
  });
  const validateKeywords = (input: HTMLInputElement) => {
    const keywords = [...new Set(input.value.split(",").map((value) => value.trim()).filter(Boolean))];
    if (keywords.length > 12) input.setCustomValidity("Informe no máximo 12 palavras-chave.");
    else if (keywords.some((keyword) => keyword.length > 60)) input.setCustomValidity("Cada palavra-chave pode ter no máximo 60 caracteres.");
    else input.setCustomValidity("");
  };

  return (
    <form
      action={formAction}
      className="project-form"
      onChange={() => setDirty(true)}
      onSubmit={() => { submitting.current = true; }}
    >
      {project ? <input name="projectId" type="hidden" value={project.id} /> : null}
      <label>
        Título <span>obrigatório</span>
        <input defaultValue={project?.title} maxLength={160} name="title" required {...fieldA11y("title")} />
        {errorFor("title") ? <small className="field-error" id="title-error">{errorFor("title")}</small> : null}
      </label>
      <label>
        Tema
        <textarea defaultValue={project?.theme ?? ""} maxLength={500} name="theme" rows={3} {...fieldA11y("theme")} />
        {errorFor("theme") ? <small className="field-error" id="theme-error">{errorFor("theme")}</small> : null}
      </label>
      <label>
        Situação-problema
        <textarea
          defaultValue={project?.problem_statement ?? ""}
          maxLength={5000}
          name="problemStatement"
          rows={6}
          {...fieldA11y("problemStatement")}
        />
        {errorFor("problemStatement") ? <small className="field-error" id="problemStatement-error">{errorFor("problemStatement")}</small> : null}
      </label>
      <label>
        Palavras-chave <span>separe por vírgulas; máximo de 12</span>
        <input
          defaultValue={project?.keywords.join(", ")}
          name="keywords"
          onInput={(event) => validateKeywords(event.currentTarget)}
          {...fieldA11y("keywords")}
        />
        {errorFor("keywords") ? <small className="field-error" id="keywords-error">{errorFor("keywords")}</small> : null}
      </label>
      <div className="project-form-grid">
        <label>
          Área do conhecimento
          <input defaultValue={project?.knowledge_area ?? ""} maxLength={120} name="knowledgeArea" {...fieldA11y("knowledgeArea")} />
          {errorFor("knowledgeArea") ? <small className="field-error" id="knowledgeArea-error">{errorFor("knowledgeArea")}</small> : null}
        </label>
        <label>
          Nível acadêmico
          <select defaultValue={project?.academic_level ?? ""} name="academicLevel" {...fieldA11y("academicLevel")}>
            <option value="">Não informado</option>
            <option value="undergraduate">Graduação</option>
            <option value="specialization">Especialização</option>
            <option value="masters">Mestrado</option>
            <option value="doctorate">Doutorado</option>
            <option value="other">Outro</option>
          </select>
          {errorFor("academicLevel") ? <small className="field-error" id="academicLevel-error">{errorFor("academicLevel")}</small> : null}
        </label>
      </div>
      {dirty ? <p className="unsaved-indicator" role="status">Alterações não salvas</p> : null}
      {state.message ? (
        <p className={`form-message ${state.status}`} role="status">{state.message}</p>
      ) : null}
      <button disabled={pending} type="submit">{pending ? "Salvando…" : submitLabel}</button>
    </form>
  );
}
