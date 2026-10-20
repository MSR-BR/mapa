// Route -> synthetic persistence: a discovery claim abandoned in "discovering" must be recoverable.
// All external traffic is intercepted. No user data, credentials or paid calls.
// DISCOVER_ROUTE_SOURCE may point at another copy of the route (used to reproduce the pre-fix behaviour).
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
await mkdir('tmp', {recursive:true});
const routeSource = process.env.DISCOVER_ROUTE_SOURCE ?? './app/api/projects/[id]/discover/route';
const stubs = {
  'server-only': '',
  '@/modules/projects/auth': `export async function authorizeProjectRoute(){const s=globalThis.c122;return {ok:true,value:{userId:s.workflow.ownerId,supabase:s.db}};}`,
  '@/modules/research-workflow/storage': `export const loadResearchWorkflow=async()=>structuredClone(globalThis.c122.workflow);`,
  '@/modules/generation/gemini': `
    export async function interpretResearchRequest(){return {...globalThis.c122.interpreted,researchQuery:'graphene lithium batteries'};}
    export const broadenResearchQuery=async()=> 'graphene lithium batteries';
    export async function generateProblemCandidates(original,interpreted,report){return globalThis.c122.candidates.map(c=>({...c,referenceIds:[report.references[0].referenceId]}));}`,
};
await build({stdin:{resolveDir:process.cwd(),contents:`export {POST} from '${routeSource}';export {versionedWorkflowFixture} from './tests/fixtures/versioned-workflow';export {crossrefReport} from './modules/research-starter/crossref';export {readProgressResponse} from './modules/ai/progress-client';`,loader:'ts'},outfile:'tmp/c122-discovery-harness.mjs',bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'synthetic-boundaries',setup(b){b.onResolve({filter:/^next\/server$/},()=>({path:'next/server.js',external:true}));b.onResolve({filter:/.*/},a=>Object.hasOwn(stubs,a.path)?{path:a.path,namespace:'c122'}:undefined);b.onLoad({filter:/.*/,namespace:'c122'},a=>({contents:stubs[a.path],resolveDir:process.cwd()}));}}]});
const api = await import('../tmp/c122-discovery-harness.mjs');
const template = api.versionedWorkflowFixture();
const catalogue = {status:'ok',message:{items:[{DOI:'10.1234/fixture-only',title:['Graphene lithium batteries'],author:[],published:{'date-parts':[[2025]]}}]}};
const s = globalThis.c122 = {};
const originalFetch = globalThis.fetch;
const oldKey = process.env.RESEARCH_STARTER_MAPA_API_KEY;
process.env.RESEARCH_STARTER_MAPA_API_KEY = 'synthetic-only';
function reset({ageMs, failSave = false}) {
  Object.assign(s,{failSave,writes:0,workflow:structuredClone(template),interpreted:template.content.discovery.interpreted,candidates:template.content.discovery.candidates,project:{id:template.projectId,owner_id:template.ownerId,workflow_version:2,title:'Fixture C122',problem_statement:'Pedido original sintético preservado integralmente, sem truncamento.'}});
  s.workflow.state = 'discovering'; s.workflow.stableState = 'draft_prompt'; s.workflow.content.discovery = null;
  s.workflow.updatedAt = new Date(Date.now() - ageMs).toISOString();
  s.db = {from:table=>new Query(table)};
}
class Query {
  constructor(table){this.table=table;this.filters=[];}
  select(){return this;} eq(k,v){this.filters.push([k,v]);return this;} is(){return this;} in(k,v){this.states=v;return this;} update(v){this.value=v;return this;}
  async maybeSingle(){if(this.table==='projects')return {data:s.project,error:null};return this.execute();}
  execute(){
    if(!this.value)return {data:null,error:null};
    if(s.failSave&&this.value.state==='choosing_problem')return {data:null,error:{message:'synthetic save failure'}};
    const revision=this.filters.find(([k])=>k==='revision')?.[1];
    if(revision!==s.workflow.revision||(this.states&&!this.states.includes(s.workflow.state)))return {data:null,error:null};
    s.writes++;const v=this.value;
    s.workflow={...s.workflow,revision:v.revision,state:v.state,stableState:v.stable_state??s.workflow.stableState,content:v.content??s.workflow.content,updatedAt:v.updated_at};
    return {data:{project_id:s.workflow.projectId,updated_at:v.updated_at},error:null};
  }
  then(resolve,reject){return Promise.resolve(this.execute()).then(resolve,reject);}
}
globalThis.fetch = async (url, init) => {
  if (String(url).includes('researchstarter.vercel.app')) {
    const request = JSON.parse(init.body);
    return Response.json({...api.crossrefReport(catalogue, request), status:'completed'});
  }
  assert.equal(new URL(String(url)).hostname, 'api.crossref.org');
  return Response.json(catalogue);
};
const call = async () => {
  const response = await api.readProgressResponse(await api.POST(new Request(`http://localhost/api/projects/${s.workflow.projectId}/discover`,{method:'POST',headers:{accept:'application/x-ndjson'}}),{params:Promise.resolve({id:s.workflow.projectId})}),()=>{});
  return {status:response.status,payload:await response.json()};
};
const results = {};
try {
  reset({ageMs:60 * 60_000});
  const stale = await call();
  results.staleClaim = {status:stale.status,state:s.workflow.state};
  assert.equal(stale.status,200,JSON.stringify(stale.payload));
  assert.equal(s.workflow.state,'choosing_problem');
  assert.equal(s.workflow.content.discovery.candidates.length,6);

  reset({ageMs:5_000});
  const fresh = await call();
  results.freshClaim = {status:fresh.status,writes:s.writes};
  assert.equal(fresh.status,409);
  assert.equal(s.writes,0);
  assert.equal(s.workflow.state,'discovering');

  reset({ageMs:60 * 60_000});
  const [a,b] = await Promise.all([call(),call()]);
  results.concurrentTakeover = {statuses:[a.status,b.status].sort(),writes:s.writes};
  assert.deepEqual([a.status,b.status].sort(),[200,409]);
  assert.equal(s.writes,2);

  reset({ageMs:60 * 60_000,failSave:true});
  const failed = await call();
  results.saveFailure = {status:failed.status,stage:failed.payload.stage,state:s.workflow.state,preservedBriefing:failed.payload.preservedBriefing};
  assert.equal(failed.status,502);
  assert.equal(failed.payload.stage,'saving');
  assert.equal(s.workflow.state,'failed');
  console.log(JSON.stringify({status:'passed',externalCalls:0,paidCalls:0,...results}));
} catch (error) {
  console.log(JSON.stringify({status:'failed',...results,message:error.message.split('\n')[0]}));
  process.exitCode = 1;
} finally {
  globalThis.fetch = originalFetch; delete globalThis.c122;
  if (oldKey === undefined) delete process.env.RESEARCH_STARTER_MAPA_API_KEY; else process.env.RESEARCH_STARTER_MAPA_API_KEY = oldKey;
}
