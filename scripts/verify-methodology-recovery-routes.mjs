import assert from 'node:assert/strict';
import {state, requestRoute} from './c111-route-harness.mjs';

const originalFrom = state.supabase.from;
function setup() {
  state.reset(); state.supabase.from = originalFrom;
  state.workflow.state = state.workflow.stableState = 'validating_methodology';
  state.workflow.content.activeStep = 'methodology_matrix';
  const content = state.workflow.content;
  return {title:'Plano de pesquisa sintético educacional', classification:content.methodologyClassification,
    rows:[...content.methodologyRows, {...content.methodologyRows[0], id:'00000000-0000-4000-8000-000000000090', objectiveId:content.elements.find(e=>e.type==='general_objective').id}]};
}
const call = body => requestRoute('methodology', {revision:state.workflow.revision, ...body});
let plan = setup();
await call({action:'save', ...plan}); state.workflow.sourceRevision++;
let before = structuredClone(state.workflow);
let response = await call({action:'validate', ...plan});
assert.equal(response.status,409); assert.equal((await response.json()).code,'context_stale'); assert.deepEqual(state.workflow,before);
// Saving local edits must not implicitly acknowledge an academic-context change.
plan.title = 'Título editado que deve ser preservado';
response = await call({action:'save', ...plan}); assert.equal(response.status,200);
assert.notEqual(state.workflow.content.stepDrafts.methodology_matrix.baseRevision,state.workflow.sourceRevision);
response = await requestRoute('history',{action:'rebase_draft',step:'methodology_matrix',revision:state.workflow.revision}); assert.equal(response.status,200);
response = await call({action:'validate',...plan}); assert.equal(response.status,200); assert.equal((await response.json()).workflow.state,'reviewing_map'); assert.equal(state.aiCalls,0);

// Persist partial work and leave the page even when upstream context needs review.
plan = setup(); state.workflow.content.elements.find(e=>e.type==='specific_objective').status='stale';
response = await call({action:'save',...plan}); assert.equal(response.status,200);
response = await call({action:'back'}); assert.equal(response.status,200);
response = await call({action:'validate',...plan}); assert.equal(response.status,409); assert.equal((await response.json()).code,'prerequisite_required');

// A real revision conflict remains a conflict, with no writes or AI calls.
plan=setup(); response=await call({action:'validate',...plan,revision:1}); assert.equal(response.status,409); assert.equal((await response.json()).code,'revision_conflict'); assert.equal(state.writes,0);
// Database failure differs from optimistic-concurrency mismatch; no raw error leaks.
plan=setup(); before=structuredClone(state.workflow);
state.supabase.from=table=>{
  const query=originalFrom(table);
  if(table==='research_workflows') query.maybeSingle=async()=>({data:null,error:{code:'08006',message:'PRIVATE DATABASE DETAILS'}});
  return query;
};
response=await call({action:'save',...plan}); assert.equal(response.status,503); assert.equal((await response.json()).code,'persistence_failed'); assert.deepEqual(state.workflow,before);

// Once the workflow is durably confirmed, an auxiliary title sync cannot undo it.
for (const throws of [false,true]) {
  plan=setup();
  state.supabase.from=table=>table==='projects'?{update:()=>({eq(){return this;},then(resolve,reject){return (throws?Promise.reject(Error('PRIVATE NETWORK DETAILS')):Promise.resolve({error:{code:'08006'}})).then(resolve,reject);}})}:originalFrom(table);
  response=await call({action:'validate',...plan}); assert.equal(response.status,200);
  const payload=await response.json(); assert.equal(payload.warning,'title_sync_failed'); assert.equal(payload.workflow.state,'reviewing_map');
  assert.equal(state.workflow.state,'reviewing_map'); assert.equal(state.writes,1);
  assert.equal(state.workflow.content.elements.find(e=>e.type==='research_title').approvedContent,plan.title);
}
plan=setup(); state.authoringRole='student'; state.advisorEmail='advisor@example.invalid';
state.supabase.from=table=>table==='projects'?{update:()=>({eq(){return this;},then(resolve){return Promise.resolve({error:{code:'08006'}}).then(resolve);}})}:originalFrom(table);
response=await call({action:'validate',...plan}); assert.equal(response.status,200); assert.equal(state.workflow.state,'validating_methodology'); assert.equal(state.workflow.content.advisorReviews.at(-1).status,'pending');
plan=setup(); state.authoringRole='student'; response=await call({action:'validate',...plan}); assert.equal(response.status,409); assert.equal(state.writes,0);
plan=setup(); state.denied=true; response=await call({action:'save',...plan}); assert.equal(response.status,403); assert.equal(state.writes,0);

// Generation errors preserve drafts and are classified only at the AI boundary.
plan=setup(); await call({action:'save',...plan, title:''}); before=structuredClone(state.workflow); state.failAI=true;
response=await call({action:'initialize'}); assert.equal(response.status,503); assert.equal((await response.json()).code,'provider_unavailable'); assert.deepEqual(state.workflow,before);
state.supabase.from=originalFrom;
console.log('C119: context recovery, explicit acknowledgment, draft/back with stale prerequisites, revision/database distinction, post-save title failures, student approval and AI failure preservation passed. Synthetic services only.');

// C124: the advisor loader error must survive the custom methodology diagnostic boundary.
plan=setup(); before=structuredClone(state.workflow); state.failAdvisorRead=true;
response=await call({action:'validate',...plan}); assert.equal(response.status,503); assert.equal(response.headers.get('retry-after'),'2'); assert.equal((await response.json()).code,'persistence_failed'); assert.deepEqual(state.workflow,before); assert.equal(state.writes,0); assert.equal(state.aiCalls,0);
console.log('C124: advisor PGRST303 retains 503/Retry-After through methodology diagnostics.');
