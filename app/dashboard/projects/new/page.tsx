import Link from "next/link";

import { createProject } from "@/modules/projects/actions";
import { ProjectForm } from "@/modules/projects/project-form";

export default function NewProjectPage() {
  return (
    <main className="workspace-shell narrow-workspace">
      <Link className="back-link" href="/dashboard">← Voltar aos projetos</Link>
      <p className="eyebrow">Novo projeto</p>
      <h1>Comece pelo contexto da pesquisa</h1>
      <p className="auth-summary">Você poderá revisar essas informações a qualquer momento.</p>
      <ProjectForm action={createProject} submitLabel="Criar projeto" />
    </main>
  );
}
