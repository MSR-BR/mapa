import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('tmp',{recursive:true});
const stubs={
 '@/modules/projects/auth':`export const authorizeProjectRoute=async()=>globalThis.reminder.denied?{ok:false,response:Response.json({code:'permission_denied'},{status:403})}:{ok:true,value:{actor:{claims:{}},project:{owner_id:'owner'},relation:globalThis.reminder.relation,supabase:globalThis.reminder.supabase}};`,
 '@/modules/projects/advisor':`export const claimEmail=()=>null;`,
 '@/modules/research-workflow/storage':`export const loadResearchWorkflow=async()=>{if(globalThis.reminder.readFails)throw Error('PRIVATE STORAGE');return {content:{advisorReviews:globalThis.reminder.reviews}};};`,
 '@/lib/email/project-notifications':`export const projectNotificationsAvailable=()=>globalThis.reminder.configured;export const sendProjectNotification=async(input)=>{globalThis.reminder.sends.push(input);return {status:globalThis.reminder.delivery};};`,
};
await build({entryPoints:['app/api/projects/[id]/advisor-review/remind/route.ts'],outfile:'tmp/c127-reminder-route.mjs',bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'synthetic',setup(b){
 b.onResolve({filter:/^next\/server$/},()=>({path:'next/server.js',external:true}));
 b.onResolve({filter:/.*/},a=>stubs[a.path]?{path:a.path,namespace:'stub'}:undefined);
 b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:stubs[a.path],loader:'ts',resolveDir:process.cwd()}));
}}]});
const {POST}=await import('../tmp/c127-reminder-route.mjs');
let s; const id='00000000-0000-4000-8000-000000000001';
const call=()=>POST(new Request('https://mapa.invalid/api/remind',{method:'POST'}),{params:Promise.resolve({id})});
function reset(){s=globalThis.reminder={denied:false,readFails:false,configured:true,relation:'owner',delivery:'sent',sends:[],calls:0,reviews:[{id:'review',status:'pending',step:'problem_statement',studentEmail:'untrusted@example.invalid',advisorEmail:'untrusted@example.invalid'}],result:{data:{allowed:true,reservation_id:id,recipient_email:'canonical@example.invalid'},error:null},supabase:{rpc(name,args){s.calls++;assert.equal(name,'reserve_advisor_reminder');assert.deepEqual(args,{p_project_id:id,p_review_id:'review'});return {abortSignal(signal){assert.ok(signal instanceof AbortSignal);if(s.rpcThrows)throw Error('PRIVATE RPC');return Promise.resolve(s.result);}}}}};}
reset();let r=await call();assert.equal(r.status,200);assert.equal(s.sends[0].recipientEmail,'canonical@example.invalid');assert.equal(s.sends[0].idempotencyKey,'review-reminder-'+id);assert.equal(s.sends[0].projectTitle,'Projeto de pesquisa');assert.equal(s.calls,1);
for(const code of ['reminder_cooldown','reminder_limit']){reset();s.result.data={allowed:false,code,retry_after:3601};r=await call();assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'3601');assert.match((await r.json()).error,/continuar usando o mapa/);assert.equal(s.sends.length,0);}
for(const [code,status] of [['auth_required',401],['permission_denied',403],['review_unavailable',409],['reminder_recipient_required',422]]){reset();s.result.data={allowed:false,code};r=await call();assert.equal(r.status,status);assert.equal(s.sends.length,0);}
for(const result of [{data:null,error:{message:'PRIVATE DB'}},{data:{allowed:true},error:null},{data:{allowed:false,code:'reminder_cooldown'},error:null}]){reset();s.result=result;r=await call();assert.equal(r.status,503);assert.equal(s.sends.length,0);assert.doesNotMatch(await r.text(),/PRIVATE/);assert.equal(s.calls,1);}
for(const field of ['denied','readFails','rpcThrows']){reset();s[field]=true;r=await call();assert.equal(r.status,field==='denied'?403:503);assert.equal(s.sends.length,0);assert.ok(s.calls<=1);}
reset();s.reviews=[];r=await call();assert.equal(r.status,409);assert.equal(s.calls,0);
reset();s.configured=false;r=await call();assert.equal(r.status,503);assert.equal(s.calls,0);
for(const delivery of ['failed','skipped']){reset();s.delivery=delivery;r=await call();assert.equal(r.status,503);assert.equal(r.headers.get('retry-after'),'86400');assert.equal(s.calls,1);assert.equal(s.sends.length,1);assert.match((await r.json()).error,/evitar duplicidade/);}
reset();s.relation='advisor';r=await call();assert.match((await r.json()).message,/estudante/);
console.log('C127 reminder routes PASS: authorization, canonical recipient, atomic reservation boundary, cooldown, limits, missing migration, malformed responses, failures, no repeat or external email.');
