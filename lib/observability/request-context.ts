const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,100}$/;
const SAFE_LOG_FIELDS = new Set([
  "attempt",
  "code",
  "durationMs",
  "errorCode",
  "httpStatus",
  "jobId",
  "projectId",
  "queryLength",
  "rankedPapers",
  "searchQualityStatus",
  "sourceRecords",
  "stage",
  "status",
]);

export type RequestContext = {
  requestId: string;
  startedAt: number;
};

function isSafeRequestId(value: string | null) {
  return Boolean(value && REQUEST_ID_PATTERN.test(value));
}

function sanitizeFields(fields: Record<string, string | number | boolean | null | undefined>) {
  return Object.fromEntries(
    Object.entries(fields).filter(([key, value]) => SAFE_LOG_FIELDS.has(key) && value !== undefined),
  );
}

export function getRequestId(request: Request) {
  const supplied = request.headers.get(REQUEST_ID_HEADER)?.trim() ?? null;
  return isSafeRequestId(supplied) ? supplied! : crypto.randomUUID();
}

export function startRequest(request: Request): RequestContext {
  return { requestId: getRequestId(request), startedAt: performance.now() };
}

export function attachRequestId(response: Response, requestId: string) {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export function logOperationalEvent(
  event: string,
  context: Pick<RequestContext, "requestId">,
  fields: Record<string, string | number | boolean | null | undefined> = {},
) {
  // Keep this allow-list payload deliberately free of prompts, documents,
  // e-mail addresses, tokens and provider response bodies.
  const safeFields = sanitizeFields(fields);
  console.info(JSON.stringify({
    event,
    requestId: context.requestId,
    timestamp: new Date().toISOString(),
    ...safeFields,
  }));
}

export function logOperationalFailure(
  event: string,
  context: Pick<RequestContext, "requestId">,
  fields: Record<string, string | number | boolean | null | undefined> = {},
) {
  const safeFields = sanitizeFields(fields);
  console.error(JSON.stringify({
    event,
    requestId: context.requestId,
    timestamp: new Date().toISOString(),
    ...safeFields,
  }));
}

export function elapsedMs(context: RequestContext) {
  return Math.max(0, Math.round(performance.now() - context.startedAt));
}

export { REQUEST_ID_HEADER };
