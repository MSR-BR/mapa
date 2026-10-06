// Real route handlers with synthetic authentication/storage/provider boundaries.
// PostgreSQL grants, triggers and durability are tested independently by verify-versioned-workflow.sh.
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
await mkdir("tmp", { recursive: true });
const stubs = {
  "@/modules/projects/auth": `export async function authorizeProjectRoute(){ return globalThis.c111.denied ? {ok:false,response:Response.json({error:'Acesso negado'},{status:403})} : {ok:true,value:{actor:{claims:{}},userId:globalThis.c111.workflow.ownerId,supabase:globalThis.c111.supabase,project:{owner_id:globalThis.c111.workflow.ownerId,authoring_role:'advisor'}}}; } export const authorizeProjectCapabilityResponse=()=>null;`,
  "@/modules/research-workflow/storage": `export const loadResearchWorkflow=async()=>structuredClone(globalThis.c111.workflow);`,
  "@/modules/projects/advisor": `export const claimEmail=()=>null; export const loadProjectAdvisorEmail=async()=>null;`,
  "@/lib/email/project-notifications": `export const notifyAdvisorOfReviewRequest=async()=>{};`,
  "@/modules/generation/gemini": `import {emitProgress} from "@/modules/ai/operation"; const call=async(name)=>{if(globalThis.c111.progressMode){emitProgress("generating","gemini");await new Promise(r=>setTimeout(r,450));emitProgress("fallback","openai");await new Promise(r=>setTimeout(r,900));}globalThis.c111.aiCalls++; if(globalThis.c111.failAI) throw Error('Synthetic provider unavailable'); return globalThis.c111.generate(name)}; export const generateGeneralObjective=()=>call('general'); export const generateSpecificObjectives=()=>call('specifics'); export const regenerateProblemStatement=()=>call('problem'); export const generateLiteratureTopics=()=>call('literature'); export const generateDevelopmentTopics=()=>call('development'); export const generateMethodologyPlan=()=>call('methodology'); export const reviewFinalMapCoherence=()=>call('review');`,
  "@/lib/supabase/server": `export const createClient=async()=>globalThis.c111.supabase;`,
  "server-only": "",
};
await build({ stdin: {resolveDir:process.cwd(),contents:`export {POST as definition} from './app/api/projects/[id]/definition/route'; export {POST as chapters} from './app/api/projects/[id]/chapters/route'; export {POST as methodology} from './app/api/projects/[id]/methodology/route'; export {POST as finalMap} from './app/api/projects/[id]/final-map/route'; export {POST as navigation} from './app/api/projects/[id]/navigation/route'; export {GET as historyGet,POST as history} from './app/api/projects/[id]/history/route'; export {versionedWorkflowFixture} from './tests/fixtures/versioned-workflow'; export {workflowUnit} from './modules/research-workflow/versioned-context';`,loader:"ts"}, outfile:"tmp/c111-route-harness.mjs", bundle:true,platform:"node",format:"esm",packages:"external", plugins:[{name:"synthetic-boundaries",setup(b){ b.onResolve({filter:/^next\/server$/},()=>({path:"next/server.js",external:true})); b.onResolve({filter:/.*/},a=>Object.hasOwn(stubs,a.path)?{path:a.path,namespace:"c111-stub"}:undefined); b.onLoad({filter:/.*/,namespace:"c111-stub"},a=>({contents:stubs[a.path],resolveDir:process.cwd()})); }}] });
const api = await import(`../tmp/c111-route-harness.mjs?run=${Date.now()}`);
const state = {workflow:api.versionedWorkflowFixture(),writes:0,aiCalls:0,versions:[],denied:false,failAI:false,beforeWrite:null};
state.generate = name => name==='review' ? [] : ({content:`Como investigar uma nova proposta sintética com ${name}?`,referenceIds:['fixture-reference']});
state.reset = () => {state.workflow=api.versionedWorkflowFixture();state.writes=state.aiCalls=0;state.versions=[];state.denied=false;state.failAI=false;state.beforeWrite=null;};
class Query {
  constructor(table){this.table=table;this.filters=[];this.count=21;}
  select(columns){this.columns=columns;return this;} update(value){this.value=value;return this;}
  eq(key,value){this.filters.push([key,value]);return this;} is(){return this;} order(){return this;} limit(count){this.count=count;return this;} or(){return this;}
  async maybeSingle(){
    if(this.table==='workflow_versions')return {data:state.versions.find(row=>this.filters.every(([key,value])=>row[key]===value))??null,error:null};
    if(this.table==='projects')return {data:{title:'Fixture C111',advisor_email:null},error:null};
    if(state.beforeWrite){state.beforeWrite();state.beforeWrite=null;}
    const expected=this.filters.find(([key])=>key==='revision')?.[1];
    if(expected!==state.workflow.revision)return {data:null,error:null};
    if(this.value){
      state.writes++; const value=this.value;
      state.workflow={...state.workflow, content:value.content, revision:value.revision, sourceRevision:value.source_revision,stableState:value.stable_state,state:value.state,updatedAt:value.updated_at};
      for(const step of ['problem_statement','general_objective','specific_objectives','literature_topics','development_topics','methodology_matrix','final_map']){
        const draft=value.content.stepDrafts[step];
        if(draft)state.versions.unshift({id:crypto.randomUUID(),project_id:state.workflow.projectId,revision:value.revision,source_revision:value.source_revision,step,kind:'draft',actor_id:state.workflow.ownerId,created_at:value.updated_at,reason:'Rascunho salvo',unit:draft.unit});
      }
    }
    return {data:{updated_at:state.workflow.updatedAt},error:null};
  }
  then(resolve,reject){
    if(this.table==='projects')return Promise.resolve({data:{},error:null}).then(resolve,reject);
    const rows=state.versions.filter(row=>this.filters.every(([key,value])=>row[key]===value)).slice(0,this.count);
    const data=this.columns==='*'?rows:rows.map(row=>Object.fromEntries(Object.entries(row).filter(([key])=>key!=="unit")));
    return Promise.resolve({data,error:null}).then(resolve,reject);
  }
}
state.supabase={from:table=>new Query(table)};
globalThis.c111=state;
export { api, state };
export async function requestRoute(route,body,query='') {
  const request=new Request(`http://localhost/api/projects/${state.workflow.projectId}/${route}${query}`,body?{method:'POST',headers:{'content-type':'application/json','x-profile-role-version':'1'},body:JSON.stringify(body)}:undefined);
  return api[route](request,{params:Promise.resolve({id:state.workflow.projectId})});
}
