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
    const prompt = String(formData.get("prompt") ?? "").trim();
    if (!prompt) return;

    sessionStorage.setItem(PENDING_PROJECT_KEY, JSON.stringify({
      prompt,
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
        maxLength={5_000}
        name="prompt"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Crie um mapa de tese de mestrado a respeito do uso de inteligência artificial no ensino superior"
        required
        rows={3}
      />
      <div className="quick-start-toolbar quick-start-toolbar-simple">
        <span>Enter para gerar · Shift + Enter para nova linha</span>
        <button disabled={continuing} type="submit">{continuing ? "Continuando…" : "Gerar mapa"}<span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}
