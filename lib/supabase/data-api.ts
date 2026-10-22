/** A bounded retry belongs to a SELECT, never to a mutation or an AI operation. */
type DataError = { code?: string; message?: string; status?: number };
type DataResult = { error: DataError | null; status?: number };
export const DATA_READ_BUDGET_MS = 5_000;
export const DATA_RETRY_AFTER_SECONDS = 2;

export function isTransientDataError(error: DataError | null, status?: number) {
  if (!error) return false;
  return (error.code === "PGRST303" && error.message?.includes("JWT issued at future") === true)
    || ["PGRST000", "PGRST001", "PGRST002", "PGRST003", "53300", "57P01", "57P02", "57P03"].includes(error.code ?? "")
    || error.code?.startsWith("08") === true
    || (status ?? error.status ?? 0) >= 500
    || (!error.code && /fetch failed|Failed to fetch|NetworkError|network request failed|AbortError/i.test(error.message ?? ""));
}

export class DataApiError extends Error {
  readonly code = "persistence_failed";
  readonly status: number;
  constructor(error: DataError, status?: number) {
    super("Não foi possível confirmar os dados salvos. Aguarde e confira a versão salva antes de tentar novamente.", { cause: error });
    this.name = "DataApiError";
    this.status = isTransientDataError(error, status) ? 503 : 500;
  }
}

export class DataRevisionConflict extends Error {
  readonly code = "revision_conflict";
  readonly status = 409;
  constructor() {
    super("Esta gravação não foi confirmada. Reabra a versão salva antes de tentar novamente.");
    this.name = "DataRevisionConflict";
  }
}

/** Checks a single result. In particular this NEVER repeats a write/RPC. */
export function checkDataResult<T extends DataResult>(result: T): T {
  if (result.error) throw new DataApiError(result.error, result.status);
  return result;
}

export function requireAffectedRow<T>(result: { data: T | null; error: DataError | null; status?: number }): T {
  checkDataResult(result);
  if (result.data === null || result.data === undefined) throw new DataRevisionConflict();
  return result.data;
}

type ReadOptions = {
  wait?: (milliseconds: number) => Promise<void>;
  now?: () => number;
  budgetMs?: number;
};

// Shared with the profile batch adapter. The callback must build a fresh GET/HEAD
// query with .retry(false).abortSignal(signal): disable the SDK retry to avoid
// nested attempts. All requests consume the same deadline.
export async function retryDataRead<T>(
  read: (signal: AbortSignal) => PromiseLike<T>,
  shouldRetry: (result: T) => boolean,
  options: ReadOptions = {},
): Promise<T> {
  const now = options.now ?? (() => performance.now());
  const wait = options.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const deadline = now() + Math.min(options.budgetMs ?? DATA_READ_BUDGET_MS, DATA_READ_BUDGET_MS);
  for (let attempt = 0; attempt < 3; attempt++) {
    const remaining = deadline - now();
    if (remaining <= 0) break;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let result: T;
    try {
      result = await Promise.race([
        Promise.resolve().then(() => read(controller.signal)),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new DataApiError({ code: "PGRST003" }));
          }, remaining);
        }),
      ]);
    } finally { clearTimeout(timer); }
    if (!shouldRetry(result) || attempt === 2) return result;
    const delay = [500, 1500][attempt];
    if (now() + delay >= deadline) return result;
    await wait(delay);
  }
  throw new DataApiError({ code: "PGRST003" });
}

export async function loadOrThrow<T extends DataResult>(
  read: (signal: AbortSignal) => PromiseLike<T>,
  options?: ReadOptions,
): Promise<T> {
  return checkDataResult(await retryDataRead(read, (result) => isTransientDataError(result.error, result.status), options));
}

export function dataApiErrorResponse(error: unknown): Response | null {
  if (!(error instanceof DataApiError || error instanceof DataRevisionConflict)) return null;
  return Response.json({ code: error.code, error: error.message }, {
    status: error.status,
    headers: {
      "Cache-Control": "private, no-store",
      ...(error.status === 503 ? { "Retry-After": String(DATA_RETRY_AFTER_SECONDS) } : {}),
    },
  });
}

export function withDataApiErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try { return await handler(...args); }
    catch (error) {
      const response = dataApiErrorResponse(error);
      if (response) return response;
      throw error;
    }
  };
}
