import assert from 'node:assert/strict';
import {state,requestRoute} from './c111-route-harness.mjs';
const call=()=>requestRoute('chapters',{action:'validate',step:'literature',revision:state.workflow.revision,topics:[]});
state.reset();state.authoringRole='student';state.workflow.content.activeStep='literature_topics';
let r=await call();assert.equal(r.status,409);let p=await r.json();assert.equal(p.code,'student_advisor_required');assert.match(p.error,/Cadastre o e-mail do orientador/);assert.equal(state.writes,0);assert.equal(state.aiCalls,0);
state.reset();r=await requestRoute('chapters',{action:'save',step:'literature',revision:1,topics:[]});assert.equal(r.status,409);p=await r.json();assert.equal(p.code,'revision_conflict');assert.match(p.error,/edições continuam nesta tela/);assert.equal(state.writes,0);
state.reset();state.authoringRole='student';state.workflow.content.advisorReviews=[{id:'pending',status:'pending'}];r=await call();assert.equal(r.status,409);p=await r.json();assert.equal(p.code,'advisor_pending');assert.match(p.error,/orientador/);assert.equal(state.writes,0);
console.log('C127 blocking routes PASS: advisor required, pending and revision conflict explain next step; no writes or AI.');
