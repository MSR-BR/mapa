type ReadResult = { error: { code?: string; message?: string } | null };

function isFutureJwtError(error: ReadResult["error"]) {
  return error?.code === "PGRST303" && error.message?.includes("JWT issued at future") === true;
}

/** Retry only idempotent profile reads affected by brief Auth/Data API clock skew. */
export async function retryFutureJwtRead<T extends readonly ReadResult[]>(
  read: () => Promise<T>,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
): Promise<T> {
  let result = await read();
  for (const delay of [500, 1500, 3000]) {
    if (!result.some(({ error }) => isFutureJwtError(error))) return result;
    await wait(delay);
    result = await read();
  }
  return result;
}
