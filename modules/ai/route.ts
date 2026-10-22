import "server-only";
import { dataApiErrorResponse } from "@/lib/supabase/data-api";
import { AiError } from "./failure";
import { aiOperation, createOperation, emitProgress } from "./operation";
import { AI_LIMITS } from "./policy";

// Do not commit HTTP 200 just for "preparing": authentication/data preflight
// failures can then return their actual status and Retry-After. Once progress
// has started, HTTP headers are immutable; the terminal envelope carries status.
export function withAiProgress<C>(handler: (request: Request, context: C) => Promise<Response>, totalMs: number = AI_LIMITS.totalMs) {
  return async (request: Request, context: C): Promise<Response> => {
    const abort = new AbortController();
    const signal = AbortSignal.any([request.signal, abort.signal, AbortSignal.timeout(totalMs)]);
    const wantsStream = request.headers.get("Accept") === "application/x-ndjson";
    const handle = async () => {
      try { return await handler(request, context); }
      catch (error) {
        return dataApiErrorResponse(error) ?? Response.json({ error: error instanceof AiError ? error.message : "Não foi possível concluir. Confira a versão salva antes de tentar novamente." }, { status: error instanceof AiError && error.code === "cancelled" ? 409 : 502 });
      }
    };
    if (!wantsStream) return aiOperation.run(createOperation(signal, undefined, totalMs), handle);
    const encoder = new TextEncoder();
    let closed = false;
    let committed = false;
    let resolveResponse: (response: Response) => void;
    const responseReady = new Promise<Response>((resolve) => { resolveResponse = resolve; });
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        function send(value: unknown) { if (!closed) controller.enqueue(encoder.encode(JSON.stringify(value) + "\n")); }
        const operation = createOperation(signal, (event) => {
          send({ type: "progress", event });
          if (event.phase !== "preparing" && !committed) {
            committed = true;
            resolveResponse(streamResponse);
          }
        }, totalMs);
        // Defer the handler so streamResponse exists before progress can start.
        await Promise.resolve();
        await aiOperation.run(operation, async () => {
          try {
            emitProgress("preparing");
            const response = await handle();
            if (!committed) {
              // No substantive progress yet: cached results/preflight failures
              // remain normal JSON with the real HTTP status and headers.
              resolveResponse(response);
              return;
            }
            const body = await response.json();
            if (!closed) {
              emitProgress(response.ok ? "completed" : "failed");
              send({ type: "result", operationId: operation.id, sequence: ++operation.sequence, status: response.status, retryAfter: response.headers.get("Retry-After"), body });
            }
          } catch {
            const body = { error: "A conexão foi interrompida. Confira a versão salva antes de tentar novamente." };
            if (!committed) resolveResponse(Response.json(body, { status: 502 }));
            else if (!closed) send({ type: "result", operationId: operation.id, sequence: ++operation.sequence, status: 502, body });
          } finally { if (!closed) { closed = true; controller.close(); } }
        });
      },
      cancel() { closed = true; abort.abort(); },
    });
    const streamResponse = new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    return responseReady;
  };
}
