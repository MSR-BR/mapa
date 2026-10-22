// Real HTTP handler; synthetic auth/provider boundaries only, no credentials or network.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
await mkdir('tmp',{recursive:true});
const state = {claims:null, authError:null, calls:0, fail:false};
globalThis.c126Suggestions=state;
const mocks={
 'server-only':'',
 '@/lib/supabase/server':`export const createClient=async()=>({auth:{getClaims:async()=>({data:{claims:globalThis.c126Suggestions.claims},error:globalThis.c126Suggestions.authError})}});`,
 '@/modules/generation/gemini':`import {AiError} from '@/modules/ai/failure';export async function suggestResearchPrompts(){globalThis.c126Suggestions.calls++;if(globalThis.c126Suggestions.fail)throw new AiError('budget');return [{kind:'tema',text:'Tema sintético'}];}`,
};
await build({stdin:{resolveDir:process.cwd(),contents:"export {POST} from './app/api/prompt-suggestions/route';",loader:'ts'},outfile:'tmp/c126-suggestions.mjs',bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'offline',setup(b){b.onResolve({filter:/^next\/server$/},()=>({path:'next/server.js',external:true}));b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],resolveDir:process.cwd()}));}}]});
const {POST}=await import('../tmp/c126-suggestions.mjs');
let n=0;
const call=(prompt='Tema sintético com contexto delimitado',stream=false)=>POST(new Request('https://mapa.invalid/api/prompt-suggestions',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':`192.0.2.${++n}`,...(stream?{Accept:'application/x-ndjson'}:{})},body:JSON.stringify({prompt})}));
for(const claims of [null,{sub:'synthetic',is_anonymous:true}]){
 state.claims=claims;const response=await call(undefined,true);assert.equal(response.status,401);assert.equal((await response.json()).code,'authentication_required');assert.equal(state.calls,0);
}
state.claims={sub:'synthetic-user'};state.authError={message:'PRIVATE'};
assert.equal((await call()).status,401);assert.equal(state.calls,0);
state.authError=null;assert.equal((await call('short')).status,400);assert.equal(state.calls,0);
assert.equal((await call()).status,200);assert.equal(state.calls,1);
state.fail=true;const denied=await call();assert.equal(denied.status,503);assert.equal((await denied.json()).code,'budget');
console.log('C126 suggestions PASS: anonymous/invalid claims denied before provider; app login succeeds; budget unavailable is explicit; no real API.');
