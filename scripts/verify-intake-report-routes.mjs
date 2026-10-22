import assert from 'node:assert/strict';
import {api,state, requestRoute} from './c111-route-harness.mjs';
const fields=['problemContext','observedSituation','discrepancyConsequences','existingKnowledgeGap','delimitationQuestion'];
function setup(){state.reset();state.workflow.content.initialBriefing={...Object.fromEntries(fields.map(name=>[name,'  Original sintético '+name+'\n'.repeat(2)+'z'.repeat(1500)+'  '])),researchType:'dissertacao'};}
const call=body=>requestRoute('finalMap',{revision:state.workflow.revision,...body});
setup();let before=structuredClone(state.workflow);let response=await call({action:'prepare_export'});
assert.equal(response.status,200);assert.equal(state.aiCalls,1);assert.equal(state.writes,1);
for(const key of Object.keys(before.content).filter(key=>!['initialBriefingReview','elementVersions'].includes(key)))assert.deepEqual(state.workflow.content[key],before.content[key],key);
assert.equal(state.workflow.state,before.state);assert.equal(state.workflow.sourceRevision,before.sourceRevision);
assert.deepEqual(state.workflow.content.initialBriefingReview.sourceBriefing,before.content.initialBriefing);
response=await call({action:'prepare_export'});assert.equal(response.status,200);assert.equal(state.aiCalls,1);assert.equal(state.writes,1);
const texts={...state.workflow.content.initialBriefingReview.texts,problemContext:'Reformulação revisada manualmente pelo autor.'};
response=await call({action:'save_export_review',reviewTexts:texts});assert.equal(response.status,200);assert.equal(state.aiCalls,1);assert.deepEqual(state.workflow.content.initialBriefing,before.content.initialBriefing);assert.deepEqual(state.workflow.content.initialBriefingReview.texts,texts);
response=await call({action:'save_export_review',reviewTexts:{...texts,problemContext:'x'.repeat(401)}});assert.equal(response.status,400);assert.equal(state.writes,2);
setup();before=structuredClone(state.workflow);state.failAI=true;response=await call({action:'prepare_export'});assert.equal(response.status,502);assert.deepEqual(state.workflow,before);assert.equal(state.writes,0);assert.ok(!(await response.text()).includes('PRIVATE'));
setup();state.beforeWrite=()=>{state.workflow.revision++;state.workflow.content.elements[0].approvedContent='Edição concorrente preservada.'};response=await call({action:'prepare_export'});assert.equal(response.status,409);assert.equal(state.workflow.content.initialBriefingReview,null);assert.equal(state.workflow.content.elements[0].approvedContent,'Edição concorrente preservada.');
setup();response=await call({action:'prepare_export',revision:1});assert.equal(response.status,409);assert.equal(state.aiCalls,0);assert.equal(state.writes,0);
setup();state.denied=true;response=await call({action:'prepare_export'});assert.equal(response.status,403);assert.equal(state.aiCalls,0);
setup();state.workflow.state='validating_methodology';response=await call({action:'prepare_export'});assert.equal(response.status,409);assert.equal(state.aiCalls,0);
setup();state.workflow.content.initialBriefing=null;response=await call({action:'prepare_export'});assert.equal(response.status,200);assert.equal(state.aiCalls,0);assert.equal(state.writes,0);
console.log('C121 routes: original/academic data and approvals preserved; cached rewrite; editable review; limits; provider failure; concurrent writes; authorization; state gate; quick mode. Synthetic services only.');

// Both actual GET renderers use the saved pair; no generation during download.
setup();
const exportCall=(format,draft=false)=>api.exportReport(new Request(`http://localhost/api/projects/${state.workflow.projectId}/exports/${format}${draft?'?draft=1':''}`),{params:Promise.resolve({id:state.workflow.projectId,format})});
for (const format of ['pdf','docx']) { response=await exportCall(format); assert.equal(response.status,200); } assert.equal(state.aiCalls,0); assert.equal(state.writes,0);
await call({action:'prepare_export'});before=structuredClone(state.workflow);
for(const format of ['pdf','docx']){response=await exportCall(format);assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private, no-store/);assert.match(response.headers.get('content-disposition'),/attachment/);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,format==='pdf'?4:2).toString(),format==='pdf'?'%PDF':'PK');assert.deepEqual(state.workflow,before);}
assert.equal(state.aiCalls,1);assert.equal(state.writes,1);
state.workflow.state='reviewing_map';response=await exportCall('pdf');assert.equal(response.status,409);response=await exportCall('pdf',true);assert.equal(response.status,200);
state.denied=true;response=await exportCall('docx');assert.equal(response.status,403);
console.log('C121 actual export routes: PDF/DOCX attachments, private/no-store, stable cached content, no download AI or write, approval/draft and authorization gates passed.');

// C126: first manual review needs no AI, including when the provider is unavailable.
setup(); before=structuredClone(state.workflow); state.failAI=true;
response=await call({action:'save_export_review',reviewTexts:texts});
assert.equal(response.status,200);assert.equal(state.aiCalls,0);assert.equal(state.writes,1);
assert.deepEqual(state.workflow.content.initialBriefing,before.content.initialBriefing);
assert.deepEqual(state.workflow.content.advisorReviews,before.content.advisorReviews);
assert.deepEqual(state.workflow.content.initialBriefingReview.texts,texts);
setup();state.failAI=true;response=await call({action:'prepare_export'});assert.equal(response.status,502);
for(const format of ['pdf','docx']){response=await exportCall(format);assert.equal(response.status,200);}
assert.equal(state.aiCalls,1);assert.equal(state.writes,0);
// A pending advisor review freezes metadata writes, but not read-only draft downloads.
for(const cached of [false,true]){
 setup();if(cached)await call({action:'save_export_review',reviewTexts:texts});
 state.authoringRole='student';state.workflow.state='reviewing_map';state.workflow.stableState='reviewing_map';
 state.workflow.content.advisorReviews.push({id:crypto.randomUUID(),advisorComments:null,advisorEmail:'advisor@example.invalid',advisorId:null,requestedAt:new Date().toISOString(),reviewedAt:null,sourceRevision:state.workflow.sourceRevision,status:'pending',step:'final_map',studentEmail:'student@example.invalid',targetActiveStep:null,targetStableState:'completed',targetState:'completed'});
 before=structuredClone(state.workflow);const writes=state.writes;
 for(const action of ['prepare_export','save_export_review']){
  response=await call({action,...(action==='save_export_review'?{reviewTexts:texts}:{})});
  assert.equal(response.status,409);assert.equal((await response.json()).code,'advisor_pending');
 }
 for(const format of ['pdf','docx']){
  response=await exportCall(format);assert.equal(response.status,409);
  response=await exportCall(format,true);assert.equal(response.status,200);
 }
 assert.deepEqual(state.workflow,before);assert.equal(state.writes,writes);assert.equal(state.aiCalls,0);
}
console.log('C126 routes PASS: first manual save; provider failure does not block PDF/Word; pending review returns advisor_pending before AI/write; draft gates and originals preserved.');
