"use client";

import { useActionState } from "react";

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
  const [state, formAction, pending] = useActionState(
    action,
    initialProjectActionState,
  );

  return (
    <form action={formAction} className="project-form">
      {project ? <input name="projectId" type="hidden" value={project.id} /> : null}
      <label>
        Título <span>obrigatório</span>
        <input defaultValue={project?.title} maxLength={160} name="title" required />
      </label>
      <label>
        Tema
        <textarea defaultValue={project?.theme ?? ""} maxLength={500} name="theme" rows={3} />
      </label>
      <label>
        Situação-problema
        <textarea
          defaultValue={project?.problem_statement ?? ""}
          maxLength={5000}
          name="problemStatement"
          rows={6}
        />
      </label>
      <label>
        Palavras-chave <span>separe por vírgulas; máximo de 12</span>
        <input defaultValue={project?.keywords.join(", ")} name="keywords" />
      </label>
      <div className="project-form-grid">
        <label>
          Área do conhecimento
          <input defaultValue={project?.knowledge_area ?? ""} maxLength={120} name="knowledgeArea" />
        </label>
        <label>
          Nível acadêmico
          <select defaultValue={project?.academic_level ?? ""} name="academicLevel">
            <option value="">Não informado</option>
            <option value="undergraduate">Graduação</option>
            <option value="specialization">Especialização</option>
            <option value="masters">Mestrado</option>
            <option value="doctorate">Doutorado</option>
            <option value="other">Outro</option>
          </select>
        </label>
      </div>
      {state.message ? (
        <p className={`form-message ${state.status}`} role="status">{state.message}</p>
      ) : null}
      <button disabled={pending} type="submit">{pending ? "Salvando…" : submitLabel}</button>
    </form>
  );
}
