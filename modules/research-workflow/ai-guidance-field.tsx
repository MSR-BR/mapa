"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  className?: string;
  context: string;
  contextPlaceholder: string;
  label: string;
  onContextChange: (value: string) => void;
  onRequestChange: (value: string) => void;
  request: string;
  requestPlaceholder: string;
  required?: boolean;
};

export function AiGuidanceField({ className = "", context, contextPlaceholder, label, onContextChange, onRequestChange, request, requestPlaceholder, required = false }: Props) {
  const [mode, setMode] = useState<"context" | "request">("context");
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!helpOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !helpRef.current?.contains(event.target)) setHelpOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelpOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [helpOpen]);

  return (
    <div className={`student-justification ai-guidance-field ${className}`}>
      <div className="ai-guidance-heading">
        <strong>{label}{required ? " *" : " (opcional)"}</strong>
        <span className="methodology-help" ref={helpRef}>
          <button aria-expanded={helpOpen} aria-label={`Como usar ${label}`} className="methodology-help-button" onClick={() => setHelpOpen(!helpOpen)} type="button">i</button>
          {helpOpen ? <span className="methodology-help-popover" role="tooltip"><strong>Como usar este campo</strong><span>Contexto acadêmico: fica salvo no mapa, orienta as próximas etapas e pode ser visto na revisão. Pedido para regenerar: orienta somente a próxima geração da IA; não é salvo como justificativa nem aparece no projeto final. Revise a sugestão antes de validar.</span></span> : null}
        </span>
      </div>
      <div aria-label={`Tipo de orientação para ${label}`} className="ai-guidance-tabs" role="group">
        <button aria-pressed={mode === "context"} onClick={() => setMode("context")} type="button">Contexto para próximas etapas</button>
        <button aria-pressed={mode === "request"} onClick={() => setMode("request")} type="button">Pedido para regenerar{request.trim() ? " •" : ""}</button>
      </div>
      {mode === "context" ? (
        <label htmlFor={`${id}-context`}><span className="sr-only">{label}: contexto acadêmico</span><textarea id={`${id}-context`} maxLength={1000} onChange={(event) => onContextChange(event.target.value)} placeholder={contextPlaceholder} value={context} /></label>
      ) : (
        <label htmlFor={`${id}-request`}><span className="sr-only">{label}: pedido para regenerar</span><textarea id={`${id}-request`} maxLength={1000} onChange={(event) => onRequestChange(event.target.value)} placeholder={requestPlaceholder} value={request} /></label>
      )}
    </div>
  );
}
