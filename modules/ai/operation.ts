import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { AiProgressEvent, AiProvider } from "./contract";
import { AiError } from "./failure";
import { AI_LIMITS, type AiOperation } from "./policy";

type Operation = {
  id: string; signal: AbortSignal; deadline: number; sequence: number; attempts: number; reservedMicros: number;
  calls: Partial<Record<AiOperation, number>>; lastGenerator: AiProvider | null; lastModel: string | null;
  emit: (event: AiProgressEvent) => void;
};
export const aiOperation = new AsyncLocalStorage<Operation>();
export function createOperation(signal: AbortSignal, emit: Operation["emit"] = () => {}, totalMs: number = AI_LIMITS.totalMs): Operation {
  return { id: crypto.randomUUID(), signal, deadline: Date.now() + totalMs, sequence: 0, attempts: 0, reservedMicros: 0, calls: {}, lastGenerator: null, lastModel: null, emit };
}
export function assertOperationActive() {
  const state = aiOperation.getStore();
  if (state?.signal.aborted) throw new AiError("cancelled");
  if (state && Date.now() >= state.deadline) throw new AiError("timeout");
}
export function emitProgress(phase: AiProgressEvent["phase"], provider: AiProvider | null = null) {
  const operation = aiOperation.getStore();
  if (!operation) return;
  operation.emit({ operationId: operation.id, sequence: ++operation.sequence, phase, provider,
    state: phase === "completed" ? "succeeded" : phase === "failed" ? "failed" : "running" });
}
export function claimAttempt(operation: AiOperation, micros: number) {
  const state = aiOperation.getStore();
  if (!state) throw new AiError("configuration");
  assertOperationActive();
  if (state.attempts >= AI_LIMITS.totalAttempts || (state.calls[operation] ?? 0) >= AI_LIMITS.attemptsPerOperation) throw new AiError("unavailable");
  if (state.reservedMicros + micros > AI_LIMITS.maxOperationMicros) throw new AiError("budget");
  state.attempts++; state.calls[operation] = (state.calls[operation] ?? 0) + 1; state.reservedMicros += micros;
  return state.attempts;
}
