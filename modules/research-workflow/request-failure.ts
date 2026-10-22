import { STUDENT_ADVISOR_REQUIRED_MESSAGE } from "./advisor-requirement";
import type { AnalyticsReasonCode } from "@/modules/analytics/analytics";

const failures = {
  student_advisor_required: [409, STUDENT_ADVISOR_REQUIRED_MESSAGE, "prerequisite_required"],
  active_step_required: [409, "Abra a etapa indicada no menu superior do projeto. Preserve suas edições em Salvar rascunho antes de mudar de etapa.", "prerequisite_required"],
  literature_required: [409, "Volte à Revisão da literatura e use Próximo para preparar o desenvolvimento. Preserve antes suas edições em Salvar rascunho.", "prerequisite_required"],
  auth_required: [401, "Sua sessão precisa ser renovada. Guarde uma cópia do texto ainda não salvo e entre novamente no app.", "auth_required"],
  profile_consent_required: [403, "Abra seu perfil e confira os termos de uso pendentes antes de continuar. Preserve uma cópia das edições ainda não salvas.", "permission_denied"],
  profile_required: [403, "Escolha seu perfil no app para continuar. O conteúdo digitado continua nesta tela.", "permission_denied"],
  profile_mode_mismatch: [403, "Mude para o perfil usado neste projeto (Aluno ou Orientador) para continuar. O conteúdo digitado continua nesta tela.", "permission_denied"],
  profile_mode_stale: [409, "Seu perfil mudou em outra aba. Guarde uma cópia das edições ainda não salvas e reabra o projeto no perfil correto.", "permission_denied"],

  revision_conflict: [409, "O mapa foi alterado em outra aba. Suas edições continuam nesta tela; confira a versão salva antes de recarregar.", "revision_conflict"],
  context_stale: [409, "Uma etapa anterior mudou. Salve suas edições e confirme a revisão do contexto no painel Versões e contexto do projeto antes de usar Próximo.", "context_stale"],
  prerequisite_required: [409, "Revise e confirme as etapas anteriores pelo menu superior. Você pode salvar este rascunho antes de voltar.", "prerequisite_required"],
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
  if (error instanceof WorkflowRequestError || error instanceof WorkflowHttpError) return error;
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
  try {
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new WorkflowRequestError("response_invalid");
    return payload as T;
  } catch {
    if (!response.ok) throw new WorkflowHttpError(response.status);
    throw new WorkflowRequestError("response_invalid");
  }
}

/** Preserve the HTTP classification through the catch boundary without raw server messages. */
export class WorkflowHttpError extends Error {
  readonly code: WorkflowFailureCode;
  readonly reason: AnalyticsReasonCode;
  constructor(readonly status: number, code?: unknown) {
    const failure = workflowResponseFailure(status, code);
    const fallbackMessages: Record<number, string> = {
      401: failures.auth_required[1],
      403: "Você não tem permissão para esta ação no perfil atual. Confira o perfil e o vínculo com o projeto; suas edições continuam nesta tela.",
      409: "O estado do projeto mudou. Guarde uma cópia das edições ainda não salvas e confira a etapa, a revisão do orientador e a versão salva antes de continuar.",
      400: "Confira os campos indicados antes de continuar. Suas edições continuam nesta tela.",
      422: "Confira os campos indicados antes de continuar. Suas edições continuam nesta tela.",
      429: "Há muitas solicitações em pouco tempo. Aguarde antes de repetir; você pode continuar editando o texto.",
      503: "O serviço está temporariamente indisponível. Suas edições continuam nesta tela; aguarde e confira o que foi salvo antes de tentar novamente.",
    };
    super(failure.code ? new WorkflowRequestError(failure.code).message : fallbackMessages[status] ?? failures.unknown[1]);
    this.name = "WorkflowHttpError";
    this.code = failure.code ?? "unknown";
    this.reason = failure.reason;
  }
}
