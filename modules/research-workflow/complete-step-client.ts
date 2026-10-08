import type { ResearchWorkflow } from "./schema";

/** Persist partial edits first; a provider failure must never erase them. */
export async function saveThenCompleteStep(options: {
  path: string; body: Record<string, unknown>; headers: HeadersInit;
  request: (url: string, init: RequestInit) => Promise<Response>;
  onSaved: (workflow: ResearchWorkflow) => void;
}) {
  const savedResponse = await options.request(options.path, { method: "POST", headers: options.headers, body: JSON.stringify({ ...options.body, action: "save" }) });
  const saved = await savedResponse.json();
  if (!savedResponse.ok || !saved.workflow) throw new Error(saved.errors?.join(" ") || saved.error || "Não foi possível salvar o rascunho. Tente novamente.");
  options.onSaved(saved.workflow);
  const response = await options.request(options.path, { method: "POST", headers: options.headers, body: JSON.stringify({ ...options.body, action: "initialize", revision: saved.workflow.revision }) });
  const result = await response.json();
  if (!response.ok || !result.workflow) throw new Error(result.errors?.join(" ") || result.error || "A IA não completou os campos. Seu rascunho está salvo; tente novamente.");
  return result as { workflow: ResearchWorkflow; message?: string };
}
