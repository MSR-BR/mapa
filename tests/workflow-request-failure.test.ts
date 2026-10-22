import assert from "node:assert/strict";
import test from "node:test";
import { readWorkflowPayload, workflowClientFailure, workflowResponseFailure, WorkflowRequestError } from "../modules/research-workflow/request-failure";
import { readProgressResponse } from "../modules/ai/progress-client";

test("network, cancellation and malformed payloads are not reported as invalid AI output", async () => {
  assert.equal(workflowClientFailure(new TypeError("PRIVATE URL")).reason,"network");
  assert.equal(workflowClientFailure(new DOMException("cancel","AbortError")).reason,"cancelled");
  assert.equal(workflowClientFailure(new WorkflowRequestError("cancelled")).reason,"cancelled");
  await assert.rejects(()=>readWorkflowPayload(new Response("<html>gateway</html>")),(e:unknown)=>e instanceof WorkflowRequestError && e.reason==="response_invalid");
  assert.equal(workflowClientFailure(new Error("PRIVATE MESSAGE")).message.includes("PRIVATE"),false);
});
test("HTTP and declared codes distinguish blockers without inventing a provider error", () => {
  for(const code of ["context_stale","revision_conflict","persistence_failed","prerequisite_required"] as const) assert.equal(workflowResponseFailure(409,code).reason,code);
  assert.equal(workflowResponseFailure(401,null).reason,"auth_required");
  assert.equal(workflowResponseFailure(403,null).reason,"permission_denied");
  assert.equal(workflowResponseFailure(422,null).reason,"validation");
  assert.equal(workflowResponseFailure(500,"PRIVATE ERROR").reason,"unknown");
  assert.equal(workflowResponseFailure(502,"provider_invalid_response").reason,"provider_invalid_response");
});
const streamResponse=(lines:string)=>new Response(lines,{headers:{"Content-Type":"application/x-ndjson"}});
test("truncated/invalid streams preserve a transport reason; valid result keeps conflict code",async()=>{
  await assert.rejects(()=>readProgressResponse(streamResponse(""),()=>{}),(e:unknown)=>e instanceof WorkflowRequestError && e.code==="network");
  await assert.rejects(()=>readProgressResponse(streamResponse("{bad json}\n"),()=>{}),(e:unknown)=>e instanceof WorkflowRequestError && e.code==="response_invalid");
  const operationId="00000000-0000-4000-8000-000000000001";
  const lines=[{type:"progress",event:{operationId,sequence:1,phase:"preparing",provider:null,state:"running"}},{type:"result",operationId,sequence:2,status:409,body:{code:"context_stale"}}].map(x=>JSON.stringify(x)).join("\n")+"\n";
  const response=await readProgressResponse(streamResponse(lines),()=>{});
  assert.equal(response.status,409);assert.equal((await response.json()).code,"context_stale");
});


test("HTTP errors survive HTML/empty error bodies, while invalid successful payloads are response_invalid", async () => {
  for (const [status, reason] of [[429, "rate_limited"], [422, "validation"], [503, "unknown"]] as const) {
    await assert.rejects(() => readWorkflowPayload(new Response("<html>synthetic</html>", { status })), (error: unknown) => workflowClientFailure(error).reason === reason);
  }
  for (const payload of [null, [], "unexpected"]) {
    await assert.rejects(() => readWorkflowPayload(Response.json(payload)), (error: unknown) => workflowClientFailure(error).reason === "response_invalid");
  }
});

test("known blockers explain a concrete next step without exposing server content", async () => {
  const { WorkflowHttpError } = await import("../modules/research-workflow/request-failure");
  const cases = [
    ["student_advisor_required", /Cadastre o e-mail do orientador/, "prerequisite_required"],
    ["advisor_pending", /aguardando a revisão do orientador/, "advisor_pending"],
    ["active_step_required", /menu superior/, "prerequisite_required"],
    ["literature_required", /Revisão da literatura/, "prerequisite_required"],
    ["revision_conflict", /edições continuam nesta tela/, "revision_conflict"],
    ["profile_mode_stale", /perfil mudou em outra aba/, "permission_denied"],
  ] as const;
  for (const [code, message, reason] of cases) {
    const failure = new WorkflowHttpError(409, code);
    assert.match(failure.message, message);
    assert.equal(failure.reason, reason);
  }
  for (const [status, message] of [[401,/entre novamente/],[403,/permissão/],[429,/Aguarde/],[503,/temporariamente indisponível/],[409,/estado do projeto mudou/]] as const) {
    const failure = new WorkflowHttpError(status, "PRIVATE DATABASE ERROR");
    assert.match(failure.message, message);
    assert.doesNotMatch(failure.message, /PRIVATE/);
  }
});
