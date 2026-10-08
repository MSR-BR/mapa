import type { ResearchWorkflow } from "./schema";

/** Save the whole visible page before generation; never call AI after a failed save. */
export async function saveThenRegenerateCard(options: {
  projectId: string; savePath: string; saveBody: Record<string, unknown>; headers: HeadersInit;
  step: string; targetId: string; instruction: string;
  request: (url: string, init: RequestInit) => Promise<Response>;
  onSaved: (workflow: ResearchWorkflow) => void;
}) {
  const savedResponse = await options.request(options.savePath, { method: "POST", headers: options.headers, body: JSON.stringify({ ...options.saveBody, action: "save" }) });
  const saved = await savedResponse.json();
  if (!savedResponse.ok || !saved.workflow) throw new Error(saved.errors?.join(" ") || saved.error || "Não foi possível salvar a página; a IA não foi chamada.");
  options.onSaved(saved.workflow);
  const response = await options.request(`/api/projects/${options.projectId}/regenerate-card`, { method: "POST", headers: options.headers,
    body: JSON.stringify({ step: options.step, targetId: options.targetId, instruction: options.instruction, revision: saved.workflow.revision }) });
  const result = await response.json();
  if (!response.ok || !result.workflow) throw new Error(result.error || "Não foi possível regenerar. Seu rascunho está salvo; tente novamente.");
  return result as { workflow: ResearchWorkflow; message: string };
}
