import { isTransientDataError, retryDataRead } from "../../lib/supabase/data-api";

type ReadResult = { error: { code?: string; message?: string } | null; status?: number };

/** Profile and consent GETs share one five-second deadline and at most three attempts. */
export async function retryFutureJwtRead<T extends readonly ReadResult[]>(
  read: (signal: AbortSignal) => Promise<T>,
  wait?: (milliseconds: number) => Promise<void>,
): Promise<T> {
  return retryDataRead(read, (results) => results.some(({ error, status }) => isTransientDataError(error, status)), { wait });
}
