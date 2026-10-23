import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { NoObjectGeneratedError, type LanguageModelUsage } from "ai";
import { knownAiCost } from "../modules/ai/cost";
import { generateStructured, type GenerationDependencies } from "../modules/ai/generate";
import { aiOperation, createOperation } from "../modules/ai/operation";

process.env.GEMINI_API_KEY = "synthetic-test-only";
process.env.GEMINI_MODEL = "gemini-3.6-flash";
process.env.OPENAI_MODEL = "gpt-6-luna";
process.env.OPENAI_API_KEY = "synthetic-test-only";
process.env.MAPA_OPENAI_ENABLED = "true";
const usage: LanguageModelUsage = { inputTokens: 100, outputTokens: 50, totalTokens: 150, inputTokenDetails: { noCacheTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0 }, outputTokenDetails: { textTokens: 30, reasoningTokens: 20 } };
const result = { output: { text: "Texto preservado" }, totalUsage: usage, response: { modelId: "gemini-3.6-flash" }, finishReason: "stop" };
const request = { operation: "generate_general_objective" as const, schema: z.object({ text: z.string().min(4) }), prompt: "fixture local", allowFallback: false };

test("C129: token costing rounds up micros, includes reasoning once, and never treats missing/invalid usage as zero", () => {
  assert.deepEqual(knownAiCost("gemini-3.6-flash", usage), { micros: 263, inputTokens: 100, outputTokens: 50 });
  assert.equal(knownAiCost("gpt-6-luna", usage)?.micros, 38);
  for (const inputTokens of [undefined, -1, NaN, Infinity, 0.5, 1_000_000_001]) assert.equal(knownAiCost("gemini-3.6-flash", { ...usage, inputTokens }), null);
  assert.equal(knownAiCost("unknown", usage), null);
  assert.equal(knownAiCost("gemini-3.6-flash"), null);
  assert.equal(knownAiCost("gemini-3.6-flash", { ...usage, inputTokens: 0, outputTokens: 0 })?.micros, 0);
});

test("C129: reserve precedes transport; known usage settles once and returns unchanged content", async () => {
  const order: string[] = [];
  const value = await generateStructured(request, {
    reserve: async (amount, metadata) => { assert.ok(amount > 263); assert.equal(metadata?.provider, "gemini"); order.push("reserve"); return "id-1"; },
    invoke: async () => { order.push("invoke"); return result; },
    settle: async (id, cost) => { assert.equal(id,"id-1"); assert.equal(cost.micros,263); order.push("settle"); },
  });
  assert.deepEqual(order,["reserve","invoke","settle"]); assert.deepEqual(value.output,result.output);
});

test("C129: settlement outage preserves valid output and never calls fallback", async () => {
  let calls=0, settlements=0; const original=console.warn; const warnings:string[]=[]; console.warn=(x)=>warnings.push(String(x));
  try {
    const value=await generateStructured({...request,allowFallback:true},{reserve:async()=>"id-1",invoke:async()=>{calls++;return result;},settle:async()=>{settlements++;throw new Error("PRIVATE_TOKEN_MUST_NOT_LOG");}});
    assert.deepEqual(value.output,result.output); assert.equal(calls,1); assert.equal(settlements,1);
    assert.match(warnings.join(),/settlement_pending/); assert.doesNotMatch(warnings.join(),/PRIVATE_TOKEN/);
  } finally {console.warn=original;}
});

test("C129: unknown usage/model and transport timeout retain the reservation", async () => {
  for (const invoke of [async()=>({...result,totalUsage:{...usage,inputTokens:undefined}}),async()=>({...result,response:{modelId:"different"}}),async()=>{throw {name:"TimeoutError"};}]) {
    let settled=0;
    await generateStructured(request,{reserve:async()=>"id-1",invoke,settle:async()=>{settled++;}}).catch(()=>{});
    assert.equal(settled,0);
  }
});

test("C129: known billable usage settles even when output or cancellation prevents persistence", async () => {
  for (const cancel of [false,true]) {
    let settlements=0;const controller=new AbortController();
    const dependencies:GenerationDependencies={reserve:async()=>"id-1",invoke:async()=>{if(cancel)controller.abort();return cancel?result:{...result,output:{text:""}};},settle:async()=>{settlements++;}};
    await assert.rejects(()=>aiOperation.run(createOperation(controller.signal),()=>generateStructured(request,dependencies)));
    assert.equal(settlements,1);
  }
});

test("C129: SDK structured-output failure exposes usage without logging generated private text", async () => {
  let settled=0;
  await assert.rejects(()=>generateStructured(request,{
    reserve:async()=>"id-1",settle:async(_id,cost)=>{assert.equal(cost.micros,263);settled++;},
    invoke:async()=>{throw new NoObjectGeneratedError({text:"PRIVATE_OUTPUT",response:{id:"synthetic",timestamp:new Date(),modelId:"gemini-3.6-flash"},usage,finishReason:"stop"});},
  }));
  assert.equal(settled,1);
});

test("C129: provider fallback retains unknown first cost and settles only second known usage", async () => {
  let calls=0,reservations=0;const settlements:string[]=[];
  await generateStructured({...request,allowFallback:true},{reserve:async()=>`id-${++reservations}`,invoke:async()=>{if(++calls===1)throw {statusCode:429};return {...result,response:{modelId:"gpt-6-luna"}};},settle:async(id,cost)=>{settlements.push(id);assert.equal(cost.micros,38);}});
  assert.deepEqual(settlements,["id-2"]); assert.equal(calls,2);
});
