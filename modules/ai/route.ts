import "server-only";
import { AiError } from "./failure";
import { aiOperation, createOperation, emitProgress } from "./operation";
import { AI_LIMITS } from "./policy";

// One response carries ordered progress followed by the original JSON result.
// No polling, no stored prompt, and no server-generated percentage.
export function withAiProgress<C>(handler: (request: Request, context: C) => Promise<Response>, totalMs: number = AI_LIMITS.totalMs) {
  return async (request: Request, context: C): Promise<Response> => {
    const abort = new AbortController();
    const signal = AbortSignal.any([request.signal, abort.signal, AbortSignal.timeout(totalMs)]);
    const wantsStream = request.headers.get("Accept") === "application/x-ndjson";
    const handle = async () => {
      try { return await handler(request, context); }
      catch (error) {
        return Response.json({ error: error instanceof AiError ? error.message : "Não foi possível concluir. Seu conteúdo foi preservado; tente novamente." }, { status: error instanceof AiError && error.code === "cancelled" ? 409 : 502 });
      }
    };
    if (!wantsStream) return aiOperation.run(createOperation(signal, undefined, totalMs), handle);
    const encoder = new TextEncoder();
    let closed = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        function send(value: unknown) { if (!closed) controller.enqueue(encoder.encode(JSON.stringify(value) + "\n")); }
        const operation = createOperation(signal, (event) => send({ type: "progress", event }), totalMs);
        await aiOperation.run(operation, async () => {
          try {
            emitProgress("preparing");
            const response = await handle();
            const body = await response.json();
            if (!closed) {
              // An OK HTTP result means the handler confirmed its persistence.
              emitProgress(response.ok ? "completed" : "failed");
              send({ type: "result", operationId: operation.id, sequence: ++operation.sequence, status: response.status, body });
            }
          } catch {
            if (!closed) send({ type: "result", operationId: operation.id, sequence: ++operation.sequence, status: 502, body: { error: "A conexão foi interrompida. Confira a versão salva antes de tentar novamente." } });
          } finally { if (!closed) { closed = true; controller.close(); } }
        });
      },
      cancel() { closed = true; abort.abort(); },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  };
}
