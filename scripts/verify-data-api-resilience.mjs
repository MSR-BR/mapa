// Real handlers + real data loaders; synthetic Auth/Data API/AI/export boundaries.
// No .env loading, no credentials, all fetch traffic denied.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
await mkdir('tmp',{recursive:true});
const stubs={
 'server-only':'',
 '@/lib/supabase/server':`export const createClient=async()=>globalThis.c124.db;`,
 '@/lib/security/rate-limit':`export const checkRateLimit=()=>({allowed:true});export const getRequestClientKey=()=> 'synthetic';`,
 '@/modules/projects/auth':`export const authorizeProjectRoute=async()=>({ok:true,value:globalThis.c124.access});export const authorizeOwnedProjectsRoute=authorizeProjectRoute;export const authorizeProject=async()=>globalThis.c124.access;`,
 '@/modules/profile/authorization':`export class ActorAuthorizationError extends Error{};export const isAccountModeSwitchEnabled=()=>true;export const actorEmail=()=>null;export const requireActorContext=async()=>globalThis.c124.actor;`,
 '@/modules/generation/gemini':`import {emitProgress} from '@/modules/ai/operation';export const GENERATION_MODEL='synthetic';const run=(v)=>{globalThis.c124.ai++;if(globalThis.c124.stream)emitProgress('generating','gemini');if(globalThis.c124.aiFails)throw Error('synthetic AI failure');return v;};export const interpretResearchRequest=async()=>run(globalThis.c124.discovery.interpreted);export const broadenResearchQuery=async()=>run('broader synthetic query');export const generateResearchStructure=async()=>run(globalThis.c124.structure);export const mergeResearchStructures=async()=>run(globalThis.c124.structure);`,
 '@/modules/research-workflow/discovery-service':`import {emitProgress} from '@/modules/ai/operation';export async function discoverResearchProposals(){globalThis.c124.ai++;if(globalThis.c124.stream)emitProgress('generating','gemini');if(globalThis.c124.aiFails)throw Error('synthetic AI failure');return globalThis.c124.discovery;}`,
 '@/modules/research-starter/client':`export class ResearchStarterClientError extends Error{};export async function fetchResearchStarterReport(){globalThis.c124.literature++;if(globalThis.c124.emptyLiterature&&globalThis.c124.literature<=2)return {references:[],coverage:{rankedPapers:0,searchQualityStatus:'empty',sourceRecords:0},warnings:[]};return {references:[{referenceId:'fixture-reference',authors:[],title:'Fixture',doi:null,url:'https://example.invalid',year:2026}],reportId:'fixture',warnings:[]};}`,
 '@/modules/export/pdf':`export const createPdfExport=async()=>Buffer.from('%PDF');export const createFinalMapPdfExport=createPdfExport;`,
 '@/modules/export/docx':`export const createDocxExport=async()=>Buffer.from('PK');export const createFinalMapDocxExport=createDocxExport;`,
 'next/link':`export default function Link(){return null;}`,
 'next/navigation':`export function redirect(path){throw Object.assign(Error('REDIRECT'),{redirect:path});}export function notFound(){throw Object.assign(Error('NOT_FOUND'),{status:404});}`,
};
for(const [path,name] of Object.entries({
 '@/modules/generation/generation-workspace':'GenerationWorkspace',
 '@/modules/projects/pending-project-cleanup':'PendingProjectCleanup',
 '@/modules/projects/project-created-analytics':'ProjectCreatedAnalytics',
 '@/modules/projects/project-advisor-panel':'ProjectAdvisorPanel',
 '@/modules/research-workflow/advisor-review-workspace':'AdvisorReviewWorkspace',
 '@/modules/research-workflow/final-map-workspace':'FinalMapWorkspace',
 '@/modules/research-workflow/literature-development-workspace':'LiteratureDevelopmentWorkspace',
 '@/modules/research-workflow/methodology-workspace':'MethodologyWorkspace',
 '@/modules/research-workflow/proposal-discovery-workspace':'ProposalDiscoveryWorkspace',
 '@/modules/research-workflow/research-definition-workspace':'ResearchDefinitionWorkspace',
}))stubs[path]=`export function ${name}(){return null;}`;
await build({stdin:{resolveDir:process.cwd(),contents:`
 export {POST as discover} from './app/api/projects/[id]/discover/route';
 export {POST as generate} from './app/api/projects/[id]/generate/route';
 export {GET as generation, PATCH as patch} from './app/api/projects/[id]/generation/route';
 export {GET as exportReport} from './app/api/projects/[id]/exports/[format]/route';
 export {POST as integrate} from './app/api/projects/integrate/route';
 export {POST as bug} from './app/api/bug-reports/route';
 export {default as page} from './app/dashboard/projects/[id]/page';
 export {GET as unavailable} from './app/service-unavailable/route';
 export {loadProjectAdvisorEmail as advisor} from './modules/projects/advisor';
 export {loadUserProfile as profile,claimPendingAdvisorProjects as claim} from './modules/profile/storage';
 export {authorizeProjectRoute as realAuthorize,authorizeOwnedProjectsRoute as realAuthorizeMany} from './modules/projects/auth';
 export {versionedWorkflowFixture} from './tests/fixtures/versioned-workflow';
 export {readProgressResponse} from './modules/ai/progress-client';
 export {withAiProgress} from './modules/ai/route';
 export {dataApiErrorResponse,withDataApiErrors} from './lib/supabase/data-api';
`,loader:'ts'},outfile:'tmp/c124-harness.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',plugins:[{name:'c124-boundaries',setup(b){
 b.onResolve({filter:/^next\/server$/},()=>({path:'next/server.js',external:true}));
 b.onResolve({filter:/.*/},a=>Object.hasOwn(stubs,a.path)?{path:a.path,namespace:'stub'}:undefined);
 b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:stubs[a.path],resolveDir:process.cwd()}));
}}]});
const api=await import('../tmp/c124-harness.mjs');
const s=globalThis.c124={};
const fixture=api.versionedWorkflowFixture();
const id=fixture.projectId,owner=fixture.ownerId,other='00000000-0000-4000-8000-000000000099';
const future={code:'PGRST303',message:'JWT issued at future PRIVATE'};
const titles=['Introdução','Revisão da Literatura','Metodologia Científica','Desenvolvimento da Pesquisa','Conclusões'];
function reset(){
 Object.assign(s,{ai:0,literature:0,stream:false,aiFails:false,queries:[],fail:()=>false,failures:0,error:future,failStatus:401,zero:()=>false,missing:()=>false,claimsError:null,emptyLiterature:false,discovery:structuredClone(fixture.content.discovery),workflow:structuredClone(fixture),project:{id,owner_id:owner,advisor_email:null,advisor_id:null,authoring_role:'advisor',workflow_version:1,title:'Mapa sintético',theme:'Tema sintético',problem_statement:'Descrição original sintética preservada.',keywords:['a','b','c'],knowledge_area:'Educação',academic_level:'masters',status:'generated'},structure:{schemaVersion:'1.0.0',title:'Mapa sintético',warnings:[],chapters:titles.map((title,i)=>({id:`chapter-${i+1}`,number:i+1,title,sections:[{id:`section-${i+1}`,title:'Síntese',content:'Conteúdo sintético já escrito.',optional:false,provenance:'user',referenceIds:[]}]}))},revision:7});
 s.db={from:table=>new Query(table),rpc:async()=>{const q={table:'rpc',op:'rpc'};s.queries.push(q);return {data:null,error:s.fail(q)?s.error:null};},auth:{getClaims:async()=>({data:{claims:{sub:owner,email:'fixture@example.invalid'}},error:s.claimsError})}};
 s.actor={userId:owner,supabase:s.db,activeRole:'advisor',claims:{},hasProfile:true,hasLegalConsent:true,roleVersion:1};
 s.access={supabase:s.db,userId:owner,actor:s.actor,relation:'owner',project:s.project};
}
class Query {
  retry(enabled){if(enabled)throw Error("Unexpected SDK retry");return this;}
 constructor(table){this.table=table;this.op='read';this.filters=[];this.columns='';}
 select(columns){this.columns=columns;return this;}eq(k,v){this.filters.push([k,v]);return this;}is(){return this;}in(k,v){this.values=v;this.filters.push([k,v]);return this;}order(){return this;}limit(){return this;}abortSignal(signal){this.signal=signal;return this;}
 update(value){this.op='update';this.value=value;return this;}insert(value){this.op='insert';this.value=value;return this;}upsert(value){this.op='upsert';this.value=value;return this;}
 maybeSingle(){return this.execute(true);}single(){return this.execute(true);}then(a,b){return this.execute(false).then(a,b);}
 async execute(single){
  s.queries.push(this);
  if(s.fail(this)){s.failures++;return {data:null,error:s.error,status:s.failStatus};}
  if(s.zero(this)||s.missing(this))return {data:null,error:null,status:200};
  if(this.op==='read'){
   if(this.table==='projects')return {data:single?s.project:(this.values??[id]).map(id=>({...s.project,id})),error:null};
   if(this.table==='generation_jobs')return {data:null,error:null};
   if(this.table==='research_structures')return {data:single?{content:s.structure,references_data:[],revision:s.revision}:[id,other].map(project_id=>({project_id,content:s.structure,references_data:[],revision:s.revision})),error:null};
   if(this.table==='research_workflows'){
    const w=s.workflow;const row={project_id:id,owner_id:owner,schema_version:w.schemaVersion,state:w.state,stable_state:w.stableState,revision:w.revision,source_revision:w.sourceRevision,content:w.content,updated_at:w.updatedAt};
    return {data:single?row:[],error:null};
   }
   if(this.table==='user_profiles')return {data:{active_role:'advisor',role_changed_at:'2026-10-20T00:00:00Z',role_version:1},error:null};
   if(this.table==='legal_consents')return {data:[],error:null};
  }
  if(this.op==='update'&&this.table==='research_structures'){
   const revision=this.filters.find(([k])=>k==='revision')?.[1];
   if(revision!==s.revision)return {data:null,error:null};
   s.structure=structuredClone(this.value.content);s.revision=this.value.revision;
  }
  if(this.op==='update'&&this.table==='research_workflows'){
   const revision=this.filters.find(([k])=>k==='revision')?.[1];
   if(revision!==s.workflow.revision)return {data:null,error:null};
   s.workflow={...s.workflow,revision:this.value.revision,state:this.value.state,content:this.value.content??s.workflow.content};
  }
  return {data:single?{id:other,project_id:id,revision:s.revision,updated_at:new Date().toISOString()}:null,error:null,status:200};
 }
}
const writes=()=>s.queries.filter(q=>q.op!=='read');
function discoverSetup(){s.project.workflow_version=2;s.workflow.state='draft_prompt';s.workflow.stableState='draft_prompt';s.workflow.content.discovery=null;}
function request(route,stream=false){
 const options={method:['generation','exportReport'].includes(route)?'GET':route==='patch'?'PATCH':'POST',headers:{accept:stream?'application/x-ndjson':'application/json'}};
 if(route==='bug'){const form=new FormData();form.set('subject','Teste sintético');form.set('message','Descrição sintética do teste de erro.');form.set('projectId',id);options.body=form;}
 else if(options.method!=='GET'){options.headers['content-type']='application/json';options.body=JSON.stringify(route==='generate'?{idempotencyKey:other}:route==='integrate'?{projectIds:[id,other]}:route==='patch'?s.structure:{});}
 return new Request(`http://localhost/api/${route}`,options);
}
async function call(route,stream=false){return api[route](request(route,stream),{params:Promise.resolve({id,format:'pdf'})});}
const evidence=[];
async function expect503(response,label){assert.equal(response.status,503,label);assert.equal(response.headers.get('retry-after'),'2',label);assert.ok(!(await response.clone().text()).includes('PRIVATE'));evidence.push(label);}
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{throw Error('UNAUTHORIZED NETWORK IN TEST');};
try{
 // Real callback deadlines/backoff used here (about 2 s per persistent failure).
 for(const route of ['discover','generate','generation','patch','exportReport','integrate','bug']){
  reset();if(route==='discover')discoverSetup();s.fail=q=>q.op==='read'&&(route==='generation'||route==='patch'?q.table==='research_structures':q.table==='projects');
  const response=await call(route,true);await expect503(response,`${route}: PGRST303, raw HTTP 503 before progress`);
  assert.equal(s.failures,3);assert.equal(writes().length,0);assert.equal(s.ai,0);
 }
 reset();s.fail=q=>q.table==='generation_jobs';await expect503(await api.generation(new Request('http://localhost/generation?status=1'),{params:Promise.resolve({id})}),'generation status-only: failed query is not an empty job');assert.equal(s.failures,3);
 reset();s.project.workflow_version=2;s.fail=q=>q.table==='research_workflows';await expect503(await call('exportReport'),'export v2 workflow failure is not a 409');assert.equal(s.failures,3);
 // Both integration sources must load successfully; no fallback to stale legacy data on an error.
 for(const table of ['research_structures','research_workflows']){
  reset();s.fail=q=>q.op==='read'&&q.table===table;
  await expect503(await call('integrate'),`integrate ${table}: no legacy fallback`);assert.equal(s.ai,0);assert.equal(writes().length,0);
 }
 reset();s.fail=q=>q.table==='projects';
 const advisorResponse=await api.withDataApiErrors(async()=>Response.json({email:await api.advisor(s.db,owner,id)}))();
 await expect503(advisorResponse,'advisor lookup does not masquerade as missing advisor');assert.equal(s.failures,3);
 for(const table of ['projects','research_workflows','research_structures']){
  reset();s.project.workflow_version=table==='research_workflows'?2:1;s.fail=q=>q.table===table;
  await assert.rejects(api.page({params:Promise.resolve({id}),searchParams:Promise.resolve({})}),e=>e.redirect==='/service-unavailable');
  await expect503(api.unavailable(),`page ${table}: redirect destination 503, no false 404`);assert.equal(s.failures,3);
 }
 for(const route of ['realAuthorize','realAuthorizeMany']){
  reset();s.fail=q=>q.op==='read'&&q.table==='projects';
  const result=await api[route]({projectId:id,projectIds:[id,other],request:new Request('http://localhost')});
  assert.equal(result.ok,false);await expect503(result.response,`${route}: real authorization reads fail closed`);
 }
 reset();s.fail=q=>q.table==='user_profiles';await assert.rejects(api.profile(s.db,owner),e=>e.code==='profile_unavailable');assert.equal(s.failures,3);evidence.push('profile: same three-attempt bound');
 reset();s.fail=()=>true;await assert.rejects(api.claim(s.db),e=>e.status===503);assert.equal(s.queries.length,1);evidence.push('claim RPC checked once, no retry');
 // Transient read recovery vs absence and permanent permission errors.
 reset();s.fail=q=>q.op==='read'&&q.table==='projects'&&s.failures<1;
 assert.equal((await call('generate')).status,200);assert.equal(s.failures,1);assert.equal(s.ai,1);evidence.push('transient read recovers without repeated AI');
 reset();s.missing=q=>q.table==='projects';assert.equal((await call('generate')).status,404);assert.equal(s.ai,0);
 reset();s.error={code:'42501',message:'PRIVATE permission'};s.fail=q=>q.table==='projects';assert.equal((await call('generate')).status,500);assert.equal(s.failures,1);
 // PATCH optimistic concurrency and every mutation result checked exactly once.
 reset();const before=structuredClone(s.structure);s.zero=q=>q.op==='update';assert.equal((await call('patch')).status,409);assert.deepEqual(s.structure,before);assert.equal(writes().length,1);assert.ok(writes()[0].filters.some(([key,value])=>key==='revision'&&value===7));
 reset();s.fail=q=>q.op==='update';await expect503(await call('patch'),'PATCH transient write: one attempt, no false success');assert.equal(s.failures,1);assert.equal(s.revision,7);
 reset();assert.equal((await call('patch')).status,200);assert.equal(s.revision,8);evidence.push('PATCH success advances exactly one revision');
 const generationWrites=[q=>q.op==='insert'&&q.table==='generation_jobs',q=>q.op==='update'&&q.value.status==='generating'&&q.table==='projects',q=>q.op==='update'&&q.value.keywords,q=>q.op==='update'&&q.table==='generation_jobs'&&q.value.status==='generating',q=>q.op==='upsert',q=>q.op==='update'&&q.value.status==='completed',q=>q.op==='update'&&q.value.status==='generated'];
 for(const [i,match] of generationWrites.entries()){
  reset();s.fail=match;await expect503(await call('generate'),`generate mutation ${i+1}: checked once`);assert.equal(s.failures,1);assert.ok(s.ai<=1);assert.ok(!writes().some(q=>q.value?.status==='failed'));
 }
 for(const [i,match] of generationWrites.entries()){
  if([0,4].includes(i))continue;
  reset();s.zero=match;assert.equal((await call('generate')).status,409);assert.ok(s.ai<=1);evidence.push(`generate update ${i+1}: zero rows is a conflict`);
 }
 reset();s.emptyLiterature=true;s.fail=q=>q.op==='update'&&q.table==='projects'&&q.value.theme&&!q.value.keywords;
 await expect503(await call('generate'),'generate broader query update checked once');assert.equal(s.failures,1);assert.equal(s.ai,1);
 reset();discoverSetup();s.fail=q=>q.op==='update'&&q.value.state==='discovering';await expect503(await call('discover'),'discover claim failure is not a concurrency 409');assert.equal(s.ai,0);assert.equal(s.failures,1);
 reset();discoverSetup();s.stream=true;s.fail=q=>q.op==='update'&&q.value.state==='choosing_problem';
 const transport=await call('discover',true);assert.equal(transport.status,200);assert.match(transport.headers.get('content-type'),/ndjson/);
 const events=[];await expect503(await api.readProgressResponse(transport,e=>events.push(e)),'discover late save: terminal 503 + Retry-After after committed stream');assert.equal(s.ai,1);assert.equal(s.failures,1);assert.equal(s.workflow.state,'discovering');assert.ok(!events.some(e=>e.phase==='completed'));assert.equal(events.at(-1).phase,'failed');
 for(const route of ['discover','generate']){
  reset();if(route==='discover')discoverSetup();s.aiFails=true;s.fail=q=>q.op==='update'&&(q.value.state==='failed'||q.value.status==='failed');await expect503(await call(route),`${route}: cleanup failure checked`);assert.equal(s.ai,1);assert.ok(s.failures>=1&&s.failures<=2);
 }
 for(const table of ['projects','research_structures']){
  reset();s.fail=q=>q.op==='insert'&&q.table===table;await expect503(await call('integrate'),`integrate ${table} insert failure`);assert.equal(s.ai,1);assert.equal(s.failures,1);assert.ok(!writes().some(q=>q.value?.deleted_at));
 }
 reset();s.error={code:'23514',message:'synthetic constraint'};s.failStatus=400;s.fail=q=>q.op==='insert'&&q.table==='research_structures';s.zero=q=>q.op==='update'&&q.value.deleted_at;
 assert.equal((await call('integrate')).status,409);assert.equal(s.ai,1);evidence.push('integration cleanup zero rows checked');
 reset();discoverSetup();s.aiFails=true;s.zero=q=>q.op==='update'&&q.value.state==='failed';assert.equal((await call('discover')).status,409);assert.equal(s.ai,1);evidence.push('discovery cleanup zero rows checked');
 reset();s.fail=q=>q.op==='insert'&&q.table==='bug_reports';await expect503(await call('bug'),'bug report insert failure');assert.equal(s.failures,1);
 reset();s.claimsError={...future,name:'AuthApiError'};await expect503(await call('bug'),'bug report auth transient does not become anonymous');assert.equal(s.queries.length,0);
 // Every UPDATE executed by these scenarios requests a returning row.
 for(const route of ['generate','patch','discover']){reset();if(route==='discover')discoverSetup();assert.equal((await call(route)).status,200);assert.ok(writes().filter(q=>q.op==='update').every(q=>q.columns.length>0));}
 console.log(JSON.stringify({status:'passed',checks:evidence.length,networkCalls:0,paidCalls:0,evidence},null,2));
}finally{globalThis.fetch=originalFetch;delete globalThis.c124;}
