"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export const PENDING_PROJECT_KEY = "mapa.pending-project.v1";

export function PublicStartForm() {
  const router = useRouter();
  const [continuing, setContinuing] = useState(false);

  function continueToLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;

    sessionStorage.setItem(PENDING_PROJECT_KEY, JSON.stringify({
      academicLevel: String(formData.get("academicLevel") ?? ""),
      knowledgeArea: String(formData.get("knowledgeArea") ?? "").trim(),
      title,
    }));
    setContinuing(true);
    router.push("/login?next=%2Fdashboard%3Fresume%3D1");
  }

  return (
    <form className="quick-start-form public-start-form" onSubmit={continueToLogin}>
      <label className="sr-only" htmlFor="public-project-title">Título provisório ou pergunta de pesquisa</label>
      <textarea
        autoFocus
        id="public-project-title"
        maxLength={160}
        name="title"
        placeholder="Descreva o que você quer pesquisar…"
        required
        rows={3}
      />
      <div className="quick-start-toolbar">
        <details className="quick-settings">
          <summary aria-label="Abrir configurações iniciais"><span aria-hidden="true">⚙</span><span>Configurar</span></summary>
          <div className="quick-settings-panel">
            <label>Área do conhecimento<input maxLength={120} name="knowledgeArea" placeholder="Ex.: Educação" /></label>
            <label>Nível acadêmico
              <select defaultValue="" name="academicLevel">
                <option value="">Não informado</option>
                <option value="undergraduate">Graduação</option>
                <option value="specialization">Especialização</option>
                <option value="masters">Mestrado</option>
                <option value="doctorate">Doutorado</option>
                <option value="other">Outro</option>
              </select>
            </label>
          </div>
        </details>
        <button disabled={continuing} type="submit">{continuing ? "Continuando…" : "Criar mapa"}<span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}
