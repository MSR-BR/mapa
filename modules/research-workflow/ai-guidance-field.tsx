"use client";

import { WorkflowAction } from "./workflow-action";
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
  onRegenerate?: () => void;
  disabled?: boolean;
};

export function AiGuidanceField({ className = "", context, contextPlaceholder, label, onContextChange, onRequestChange, request, requestPlaceholder, required = false, onRegenerate, disabled = false }: Props) {
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
          {helpOpen ? <span className="methodology-help-popover" role="tooltip"><strong>Como usar este campo</strong><span>Contexto: fica salvo com a página e orienta as próximas etapas depois da confirmação. Pedido para regenerar: usa o texto atual, sua orientação e a IA para reescrever somente este quadro. Ao trocar de opção, o texto digitado permanece. Revise o resultado antes de usar Próximo.</span></span> : null}
        </span>
      </div>
      <div aria-label={`Tipo de orientação para ${label}`} className="ai-guidance-tabs" role="group">
        <button disabled={disabled} aria-pressed={mode === "context"} onClick={() => { if (mode !== "context") onContextChange(request); setMode("context"); }} type="button">Contexto para próximas etapas</button>
        <button disabled={disabled} aria-pressed={mode === "request"} onClick={() => { if (mode !== "request" && context) onRequestChange(context); setMode("request"); }} type="button">Pedido para regenerar{request.trim() ? " •" : ""}</button>
      </div>
      {mode === "context" ? (
        <label htmlFor={`${id}-context`}><span className="sr-only">{label}: contexto acadêmico</span><textarea disabled={disabled} id={`${id}-context`} maxLength={1000} onChange={(event) => onContextChange(event.target.value)} placeholder={contextPlaceholder} value={context} /></label>
      ) : (
        <label htmlFor={`${id}-request`}><span className="sr-only">{label}: pedido para regenerar</span><textarea disabled={disabled} id={`${id}-request`} maxLength={1000} onChange={(event) => onRequestChange(event.target.value)} placeholder={requestPlaceholder} value={request} /></label>
      )}
      {required && mode === "context" ? <small>Contexto para revisão do orientador: pelo menos 10 caracteres recomendados.</small> : null}
      {mode === "request" && onRegenerate ? <div className="card-regeneration-action"><WorkflowAction className="definition-button secondary" disabled={disabled} onClick={onRegenerate} type="button" help="Salva a página e usa o texto atual deste quadro, seu pedido e a IA para gerar uma nova versão. Os outros quadros permanecem como estão. O resultado fica no rascunho até você confirmar em Próximo.">Regenerar com IA</WorkflowAction></div> : null}
    </div>
  );
}
