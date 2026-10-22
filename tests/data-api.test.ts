import assert from "node:assert/strict";
import test from "node:test";
import { checkDataResult, DataApiError, dataApiErrorResponse, isTransientDataError, loadOrThrow, requireAffectedRow } from "../lib/supabase/data-api";

const future = { code: "PGRST303", message: "JWT issued at future PRIVATE" };
const noWait = { wait: async () => {} };

test("persistent future JWT: three reads, 503 + Retry-After, no raw error", async () => {
  let attempts = 0;
  await assert.rejects(loadOrThrow(async () => { attempts++; return {data:null,error:future}; },noWait), asyncError => {
    assert.ok(asyncError instanceof DataApiError);
    const response=dataApiErrorResponse(asyncError)!;
    assert.equal(response.status,503);assert.equal(response.headers.get("Retry-After"),"2");
    return true;
  });
  assert.equal(attempts,3);
  const body=await dataApiErrorResponse(new DataApiError(future))!.text();
  assert.ok(!body.includes("PRIVATE"));assert.ok(!body.includes("JWT"));
});

test("transient Data API errors recover; absence only after a successful read", async () => {
  for (const result of [{error:future},{error:{code:"PGRST003"}},{error:{code:"08006"}},{error:{message:"proxy failure"},status:503},{error:{message:"TypeError: fetch failed"}}]) {
    let attempts=0;
    const actual=await loadOrThrow(async()=> ++attempts===1?{data:null,...result}:{data:null,error:null},noWait);
    assert.equal(attempts,2);assert.equal(actual.data,null);assert.equal(actual.error,null);
  }
});

test("JWT validation, permissions and constraints are not retried", async () => {
  for (const error of [{code:"PGRST303",message:"JWT expired"},{code:"42501"},{code:"23505"},{code:"PGRST204"}]) {
    let attempts=0;
    await assert.rejects(loadOrThrow(async()=>{attempts++;return {data:null,error};},noWait),DataApiError);
    assert.equal(attempts,1);assert.equal(isTransientDataError(error),false);
  }
});

test("single mutation result is checked once; zero affected rows is conflict", () => {
  assert.throws(()=>requireAffectedRow({data:null,error:future}),e=>e instanceof DataApiError&&e.status===503);
  assert.equal(dataApiErrorResponse(assertCaught(()=>requireAffectedRow({data:null,error:null})))?.status,409);
  assert.deepEqual(requireAffectedRow({data:{revision:4},error:null}),{revision:4});
  assert.throws(()=>checkDataResult({error:{message:"proxy"},status:503}),e=>e instanceof DataApiError&&e.status===503);
});
function assertCaught(fn:()=>void){try{fn();assert.fail("expected failure");}catch(error){return error;}}

test("a hung read is aborted within the shared deadline, never starts a retry", async () => {
  let calls=0, aborted=false;
  const start=Date.now();
  await assert.rejects(loadOrThrow(signal=>{calls++;signal.addEventListener("abort",()=>{aborted=true;});return new Promise(()=>{});},{budgetMs:30}),DataApiError);
  assert.equal(calls,1);assert.equal(aborted,true);assert.ok(Date.now()-start<500);
});

test("time spent in queries counts towards five seconds, not only backoff", async () => {
  let now=0,calls=0;
  await assert.rejects(loadOrThrow(async()=>{calls++;now+=3500;return {data:null,error:future};},{now:()=>now,wait:async ms=>{now+=ms;}}),DataApiError);
  assert.equal(calls,2); // after 7.5 s simulated elapsed, a third request is forbidden
});

test("actual installed PostgREST SDK: no nested retries for HTTP 520/network errors", async () => {
  const { PostgrestClient } = await import("@supabase/postgrest-js");
  for (const network of [false,true]) {
    let requests=0;
    const client=new PostgrestClient("https://fixture.invalid/rest/v1",{fetch:async()=>{
      requests++;
      if(network)throw new TypeError("fetch failed");
      return Response.json({message:"synthetic proxy outage"},{status:520});
    }});
    await assert.rejects(loadOrThrow(signal=>client.from("projects").select("id").retry(false).abortSignal(signal).maybeSingle(),noWait),e=>e instanceof DataApiError&&e.status===503);
    assert.equal(requests,3);
  }
});

test("actual installed SDK: POST/PATCH/RPC are never retried on a transient failure", async () => {
  const { PostgrestClient } = await import("@supabase/postgrest-js");
  let requests=0;
  const methods:string[]=[];
  const client=new PostgrestClient("https://fixture.invalid/rest/v1",{fetch:async(_input,init)=>{
    requests++;methods.push(init!.method!);
    return Response.json(future,{status:401});
  }});
  for(const query of [client.from("projects").insert({id:"fixture"}),client.from("projects").update({title:"fixture"}).eq("id","fixture"),client.rpc("fixture_rpc")]){
    const result=await query;assert.throws(()=>checkDataResult(result),e=>e instanceof DataApiError&&e.status===503);
  }
  assert.equal(requests,3);assert.deepEqual(methods,["POST","PATCH","POST"]);
});
