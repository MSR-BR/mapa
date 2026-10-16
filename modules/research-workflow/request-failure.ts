import type { AnalyticsReasonCode } from "@/modules/analytics/analytics";

const failures = {
  revision_conflict: [409, "O mapa foi alterado em outra aba. Suas edições continuam nesta tela; confira a versão salva antes de recarregar.", "revision_conflict"],
  context_stale: [409, "Uma etapa anterior mudou. Salve suas edições e confirme a revisão do contexto no painel Versões e contexto do projeto antes de usar Próximo.", "context_stale"],
  prerequisite_required: [409, "Revise e confirme os objetivos e capítulos anteriores. Você pode salvar este rascunho e voltar às etapas pelo menu superior.", "prerequisite_required"],
  advisor_pending: [409, "Esta etapa está aguardando a revisão do orientador.", "advisor_pending"],
  persistence_failed: [503, "Não foi possível salvar agora. Suas edições continuam nesta tela. Tente salvar novamente.", "persistence_failed"],
  invalid_workflow: [422, "Não foi possível organizar a metodologia. Revise os campos indicados; suas edições continuam nesta tela.", "validation"],
  provider_invalid_response: [502, "A IA não conseguiu produzir uma sugestão válida. O conteúdo salvo foi preservado; tente novamente.", "provider_invalid_response"],
  provider_unavailable: [503, "A IA está indisponível agora. O conteúdo salvo foi preservado; tente novamente.", "provider_unavailable"],
  provider_timeout: [504, "A IA não concluiu dentro do prazo. O conteúdo salvo foi preservado; tente novamente.", "provider_timeout"],
  cancelled: [409, "Solicitação cancelada. Confira a versão salva antes de tentar novamente.", "cancelled"],
  network: [0, "A conexão foi interrompida. Suas edições continuam nesta tela; confira a versão salva antes de tentar novamente.", "network"],
  response_invalid: [502, "A resposta do servidor não pôde ser lida. Suas edições continuam nesta tela; confira a versão salva antes de tentar novamente.", "response_invalid"],
  unknown: [500, "Não foi possível concluir. Suas edições continuam nesta tela; tente novamente.", "unknown"],
} as const;
export type WorkflowFailureCode = keyof typeof failures;

export class WorkflowRequestError extends Error {
  readonly status: number;
  readonly reason: AnalyticsReasonCode;
  constructor(readonly code: WorkflowFailureCode) {
    const [status, message, reason] = failures[code];
    super(message); this.name = "WorkflowRequestError"; this.status = status; this.reason = reason;
  }
}

export function workflowClientFailure(error: unknown) {
  if (error instanceof WorkflowRequestError) return error;
  if (error instanceof Error && error.name === "AbortError") return new WorkflowRequestError("cancelled");
  if (error instanceof TypeError) return new WorkflowRequestError("network");
  return new WorkflowRequestError("unknown");
}

export function workflowResponseFailure(status: number, code: unknown): { reason: AnalyticsReasonCode; code: WorkflowFailureCode | null } {
  if (typeof code === "string" && Object.hasOwn(failures, code)) {
    const failure = new WorkflowRequestError(code as WorkflowFailureCode);
    return { reason: failure.reason, code: failure.code };
  }
  return { code: null, reason: status === 401 ? "auth_required" : status === 403 ? "permission_denied" : status === 422 || status === 400 ? "validation" : status === 429 ? "rate_limited" : "unknown" };
}

/** A malformed or truncated response is a transport failure, not proof of an AI failure. */
export async function readWorkflowPayload<T>(response: Response): Promise<T> {
  try { return await response.json() as T; }
  catch { throw new WorkflowRequestError("response_invalid"); }
}
