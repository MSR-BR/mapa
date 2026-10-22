import { WorkflowRequestError } from "@/modules/research-workflow/request-failure";
import { progressEventSchema, type AiProgressEvent } from "./contract";

export async function readProgressResponse(response: Response, onProgress: (event: AiProgressEvent) => void): Promise<Response> {
  if (!response.headers.get("Content-Type")?.includes("application/x-ndjson")) return response;
  if (!response.body) throw new WorkflowRequestError("network");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "", operationId: string | null = null, sequence = -1;
  let result: Response | null = null;
  const parseLine = (line: string) => {
    if (!line.trim()) return;
    const data = JSON.parse(line);
    if (data.type === "progress") {
      const event = progressEventSchema.parse(data.event);
      operationId ??= event.operationId;
      if (event.operationId !== operationId || event.sequence <= sequence) return;
      sequence = event.sequence; onProgress(event);
    } else if (data.type === "result") {
      if (data.operationId !== operationId || !Number.isInteger(data.sequence) || data.sequence <= sequence || data.status < 200 || data.status > 599) return;
      sequence = data.sequence;
      result = Response.json(data.body, {
        status: data.status,
        headers: typeof data.retryAfter === "string" && /^\d{1,5}$/.test(data.retryAfter)
          ? { "Retry-After": data.retryAfter } : {},
      });
    }
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { pending += decoder.decode(); if (pending.trim()) parseLine(pending); break; }
      pending += decoder.decode(value, { stream: true });
      if (pending.length > 2_000_000) throw new WorkflowRequestError("response_invalid");
      let end;
      while ((end = pending.indexOf("\n")) >= 0) { parseLine(pending.slice(0, end)); pending = pending.slice(end + 1); }
    }
  } catch (error) {
    if (error instanceof WorkflowRequestError || error instanceof TypeError || error instanceof Error && error.name === "AbortError") throw error;
    throw new WorkflowRequestError("response_invalid");
  } finally { reader.releaseLock(); }
  if (!result) throw new WorkflowRequestError("network");
  return result;
}
