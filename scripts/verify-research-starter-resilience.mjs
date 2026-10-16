// Route -> discovery service -> real transport/fallback -> synthetic persistence.
// All external traffic is intercepted. No user data, credentials or paid calls.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('tmp', {recursive:true});
const stubs = {
  'server-only': '',
  '@/modules/projects/auth': `export async function authorizeProjectRoute(){const s=globalThis.c120;return s.denied?{ok:false,response:Response.json({error:'Denied'},{status:403})}:{ok:true,value:{userId:s.workflow.ownerId,supabase:s.db}};}`,
  '@/modules/research-workflow/storage': `export const loadResearchWorkflow=async()=>structuredClone(globalThis.c120.workflow);`,
  '@/modules/generation/gemini': `
    export async function interpretResearchRequest(project,options){globalThis.c120.briefingReceived=options.initialBriefing;return {...globalThis.c120.interpreted,researchQuery:globalThis.c120.query};}
    export const broadenResearchQuery=async()=> 'graphene lithium batteries';
    export async function generateProblemCandidates(original,interpreted,report){globalThis.c120.originalReceived=original;return globalThis.c120.candidates.map(c=>({...c,referenceIds:[report.references[0].referenceId]}));}`,
};
await build({stdin:{resolveDir:process.cwd(),contents:`export {POST} from './app/api/projects/[id]/discover/route';export {versionedWorkflowFixture} from './tests/fixtures/versioned-workflow';export {crossrefReport} from './modules/research-starter/crossref';export {readProgressResponse} from './modules/ai/progress-client';`,loader:'ts'},outfile:'tmp/c120-discovery-harness.mjs',bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'synthetic-boundaries',setup(b){b.onResolve({filter:/^next\/server$/},()=>({path:'next/server.js',external:true}));b.onResolve({filter:/.*/},a=>Object.hasOwn(stubs,a.path)?{path:a.path,namespace:'c120'}:undefined);b.onLoad({filter:/.*/,namespace:'c120'},a=>({contents:stubs[a.path],resolveDir:process.cwd()}));}}]});
const api = await import('../tmp/c120-discovery-harness.mjs');
const template=api.versionedWorkflowFixture();
const briefing={problemContext:'Contexto sintético preservado  ',observedSituation:'Observação sintética\ncom quebra.',discrepancyConsequences:'Consequências sintéticas.',existingKnowledgeGap:'Lacuna sintética.',delimitationQuestion:'Como investigar a proposta sintética?',researchType:null};
const catalogue={status:'ok',message:{items:[{DOI:'10.1234/fixture-only',title:['Graphene lithium batteries'],author:[],published:{'date-parts':[[2025]]}}]}};
const s=globalThis.c120={};
const originalFetch=globalThis.fetch;
const oldKey=process.env.RESEARCH_STARTER_MAPA_API_KEY;
process.env.RESEARCH_STARTER_MAPA_API_KEY='synthetic-only';
function reset(mode){
  Object.assign(s,{mode,denied:false,network:0,writes:0,workflow:structuredClone(template),query:'graphene lithium batteries '.repeat(10).slice(0,240),interpreted:template.content.discovery.interpreted,candidates:template.content.discovery.candidates,project:{id:template.projectId,owner_id:template.ownerId,workflow_version:2,title:'Fixture C120',problem_statement:'Pedido original sintético preservado integralmente, sem truncamento.'}});
  s.workflow.state=s.workflow.stableState='failed';s.workflow.content.discovery=null;s.workflow.content.initialBriefing=structuredClone(briefing);
  s.db={from:table=>new Query(table)};
}
class Query{
 constructor(table){this.table=table;this.filters=[];}
 select(){return this;}eq(k,v){this.filters.push([k,v]);return this;}is(){return this;}in(k,v){this.states=v;return this;}update(v){this.value=v;return this;}
 async maybeSingle(){if(this.table==='projects')return {data:s.project,error:null};return this.execute();}
 execute(){if(!this.value)return {data:null,error:null};const revision=this.filters.find(([k])=>k==='revision')?.[1];if(revision!==s.workflow.revision||(this.states&&!this.states.includes(s.workflow.state)))return {data:null,error:null};s.writes++;const v=this.value;s.workflow={...s.workflow,revision:v.revision,state:v.state,stableState:v.stable_state??s.workflow.stableState,content:v.content??s.workflow.content,updatedAt:v.updated_at};return {data:{project_id:s.workflow.projectId,updated_at:v.updated_at},error:null};}
 then(resolve,reject){return Promise.resolve(this.execute()).then(resolve,reject);}
}
globalThis.fetch=async(url,init)=>{
 s.network++;const primary=String(url).includes('researchstarter.vercel.app');
 if(primary){const request=JSON.parse(init.body);assert.ok(request.topic.length<=180);assert.equal(new Headers(init.headers).get('authorization'),'Bearer synthetic-only');
  if(s.mode==='auth')return new Response('unauthorized',{status:401});
  if(s.mode==='invalid')return new Response('bad request',{status:400});
  if(s.mode==='primary')return Response.json({...api.crossrefReport(catalogue,request),status:'completed'});
  return new Response('temporarily down',{status:503});
 }
 assert.equal(new URL(String(url)).hostname,'api.crossref.org');assert.equal(new Headers(init.headers).get('authorization'),null);
 return s.mode==='both-fail'?new Response('down',{status:503}):Response.json(catalogue);
};
const call=()=>api.POST(new Request(`http://localhost/api/projects/${s.workflow.projectId}/discover`,{method:'POST',headers:{accept:'application/x-ndjson'}}),{params:Promise.resolve({id:s.workflow.projectId})});
let scenarios=0;
try{
 for(const mode of ['primary','fallback']){
  reset(mode);const events=[];const response=await api.readProgressResponse(await call(),e=>events.push(e));const payload=await response.json();
  assert.equal(response.status,200,JSON.stringify(payload));assert.equal(payload.workflow.state,'choosing_problem');assert.equal(payload.workflow.content.discovery.candidates.length,6);
  assert.deepEqual(payload.workflow.content.initialBriefing,briefing);assert.deepEqual(s.briefingReceived,briefing);assert.equal(payload.workflow.content.discovery.originalPrompt,s.project.problem_statement);
  assert.equal(payload.workflow.content.discovery.references[0].source,mode==='primary'?'research_starter':'crossref');assert.equal(s.writes,2);assert.equal(s.network,mode==='primary'?1:3);
  assert.equal(events.at(-1).phase,'completed');if(mode==='fallback'){assert.ok(events.some(e=>e.literatureSource==='crossref'));await writeFile('tmp/c120-fallback-workflow.json',JSON.stringify(payload.workflow));}
  // Re-opening/repeating after success must reuse saved discovery.
  await api.readProgressResponse(await call(),()=>{});assert.equal(s.writes,2);assert.equal(s.network,mode==='primary'?1:3);scenarios+=2;
 }
 for(const mode of ['auth','invalid','both-fail']){
  reset(mode);const response=await api.readProgressResponse(await call(),()=>{});const payload=await response.json();
  assert.equal(response.status,mode==='auth'?503:502);assert.equal(payload.errorCode,mode==='auth'?'research-starter-unauthorized':mode==='invalid'?'research-starter-invalid-request':'research-starter-unavailable');
  assert.equal(payload.retryable,mode==='both-fail');assert.equal(s.workflow.state,'failed');assert.deepEqual(s.workflow.content.initialBriefing,briefing);assert.equal(s.workflow.content.discovery,null);scenarios++;
 }
 reset('fallback');s.denied=true;const response=await api.readProgressResponse(await call(),()=>{});assert.equal(response.status,403);assert.equal(s.network,0);assert.equal(s.writes,0);scenarios++;
 console.log(JSON.stringify({status:'passed',scenarios,externalCalls:0,paidCalls:0,originalBriefingPreserved:true}));
}finally{globalThis.fetch=originalFetch;delete globalThis.c120;if(oldKey===undefined)delete process.env.RESEARCH_STARTER_MAPA_API_KEY;else process.env.RESEARCH_STARTER_MAPA_API_KEY=oldKey;}
