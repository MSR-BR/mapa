"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type PromptSuggestion = {
  kind: "tema" | "formulacao" | "recorte";
  text: string;
};

type ResearchPromptInputProps = {
  id: string;
  onChange: (value: string) => void;
  onEnter: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  value: string;
};

const MINIMUM_SUGGESTION_LENGTH = 8;
const AI_SUGGESTION_LENGTH = 18;

function cleanPromptForSuggestion(prompt: string) {
  const cleaned = prompt
    .replace(/\s+/g, " ")
    .replace(/^(?:eu\s+)?(?:quero|preciso|gostaria de|crie|criar|elabore|elaborar|desenvolva|desenvolver|fazer|faça)\s+/i, "")
    .replace(/^(?:um|uma)\s+(?:roteiro|plano|projeto|pesquisa|estudo)\s+(?:de|sobre)\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();

  return (cleaned || prompt.trim()).slice(0, 220);
}

function buildLocalPromptSuggestions(prompt: string): PromptSuggestion[] {
  const subject = cleanPromptForSuggestion(prompt);
  return [
    {
      kind: "tema",
      text: `Tema de pesquisa: ${subject}, com delimitação de contexto, público e período relevantes.`,
    },
    {
      kind: "formulacao",
      text: `Investigar ${subject}, com foco na relação central e nas evidências que sustentam a situação-problema.`,
    },
    {
      kind: "recorte",
      text: `Analisar ${subject} para identificar padrões, lacunas da literatura e implicações para a pesquisa.`,
    },
  ];
}

export function ResearchPromptInput({
  id,
  onChange,
  onEnter,
  value,
}: ResearchPromptInputProps) {
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [suggestionsForPrompt, setSuggestionsForPrompt] = useState("");
  const [loadingPrompt, setLoadingPrompt] = useState("");
  const lastRequestedPrompt = useRef("");
  const normalizedPrompt = value.trim();
  const localSuggestions = normalizedPrompt.length >= MINIMUM_SUGGESTION_LENGTH
    ? buildLocalPromptSuggestions(normalizedPrompt)
    : [];
  const visibleSuggestions = suggestionsForPrompt === normalizedPrompt && suggestions.length > 0
    ? suggestions
    : localSuggestions;
  const loading = normalizedPrompt.length >= AI_SUGGESTION_LENGTH && loadingPrompt === normalizedPrompt;

  useEffect(() => {
    const prompt = value.trim();
    if (prompt.length < AI_SUGGESTION_LENGTH) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      if (prompt === lastRequestedPrompt.current) return;
      lastRequestedPrompt.current = prompt;
      setLoadingPrompt(prompt);

      try {
        const response = await fetch("/api/prompt-suggestions", {
          body: JSON.stringify({ prompt }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("suggestion-request-failed");
        const payload = await response.json() as { suggestions?: PromptSuggestion[] };
        setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions.slice(0, 3) : []);
        setSuggestionsForPrompt(prompt);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
          setSuggestionsForPrompt(prompt);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingPrompt("");
      }
    }, 650);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [value]);

  return (
    <>
      <textarea
        autoComplete="off"
        autoFocus
        id={id}
        maxLength={5_000}
        name="prompt"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onEnter}
        placeholder="Crie um roteiro de tese de mestrado sobre o uso de inteligência artificial no ensino superior"
        required
        rows={3}
        value={value}
      />
      {visibleSuggestions.length > 0 ? (
        <div className="prompt-suggestions" aria-live="polite">
          <p>
            Sugestões para consolidar o mapa
            {loading ? <small>Refinando com IA…</small> : null}
          </p>
          <div className="prompt-suggestion-list">
            {visibleSuggestions.map((suggestion) => (
              <button
                key={`${suggestion.kind}-${suggestion.text}`}
                onClick={() => {
                  onChange(suggestion.text);
                  setSuggestions([]);
                  setSuggestionsForPrompt("");
                  lastRequestedPrompt.current = suggestion.text.trim();
                }}
                type="button"
              >
                <span>
                  {suggestion.kind === "tema"
                    ? "Tema"
                    : suggestion.kind === "recorte"
                      ? "Recorte"
                      : "Formulação"}
                </span>
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
