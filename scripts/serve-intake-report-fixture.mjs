// Synthetic, local-only visual fixture. No production data or provider calls.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {state,api} from './c111-route-harness.mjs';
const browserCode=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import{useState}from'react';import{createRoot}from'react-dom/client';
import{ActiveProfileProvider}from'./modules/profile/active-profile-context';
import{ResearchIntakeForm}from'./modules/projects/research-intake-form';
import{EMPTY_RESEARCH_INTAKE}from'./modules/projects/research-intake';
import{LiteratureDevelopmentWorkspace}from'./modules/research-workflow/literature-development-workspace';
import{MethodologyWorkspace}from'./modules/research-workflow/methodology-workspace';
import{FinalMapWorkspace}from'./modules/research-workflow/final-map-workspace';
import{resolveWorkflowView}from'./modules/research-workflow/workflow-navigation';
const settings=JSON.parse(document.getElementById('fixture-data').textContent);
function App(){const[intake,setIntake]=useState(EMPTY_RESEARCH_INTAKE);if(settings.step==='intake')return <ResearchIntakeForm value={intake} onChange={setIntake} showResearchType/>;const workflow=resolveWorkflowView(settings.workflow,settings.step);const Component=settings.step==='final_map'?FinalMapWorkspace:settings.step==='methodology_matrix'?MethodologyWorkspace:LiteratureDevelopmentWorkspace;return <ActiveProfileProvider activeRole={settings.role} roleVersion={1}><Component initialWorkflow={workflow} isSelfDirectedProject={settings.role==='advisor'} projectId={workflow.projectId}/></ActiveProfileProvider>};createRoot(document.getElementById('root')).render(<App/>);
`},bundle:true,write:false,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixture-router',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'router',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:"export const useRouter=()=>({push:u=>location.assign(u),replace:u=>location.assign(u),refresh:()=>{}});"}));}}]});
const css=(await readFile('app/globals.css','utf8')).replace(/^@import.*;$/gm,'');
await mkdir('tmp/c121',{recursive:true});
const server=createServer(async(req,res)=>{try{
const url=new URL(req.url,'http://localhost');
if(url.pathname==='/bundle.js'){res.setHeader('Content-Type','text/javascript');res.end(browserCode.outputFiles[0].text);return;}
if(url.pathname.startsWith('/api/projects/')){
 let body='';for await(const chunk of req)body+=chunk;
 const name=url.pathname.split('/')[4];const route=name==='final-map'?'finalMap':name==='exports'?'exportReport':name==='history'?(req.method==='GET'?'historyGet':'history'):name;
 const response=await api[route](new Request('http://localhost'+req.url,{method:req.method,headers:req.headers,...(body?{body}:{})}),{params:Promise.resolve({id:state.workflow.projectId,format:url.pathname.split('/')[5]})});
 res.writeHead(response.status,Object.fromEntries(response.headers));for await(const chunk of response.body)res.write(chunk);res.end();
 await writeFile('tmp/c121/ui-state.json',JSON.stringify({aiCalls:state.aiCalls,writes:state.writes,workflow:state.workflow},null,2));return;
}
if(url.pathname.startsWith('/brand/')){res.end(await readFile('public'+url.pathname));return;}
state.reset();state.authoringRole=url.searchParams.get('role')||'student';state.advisorEmail='advisor@example.invalid';
state.workflow.content.initialBriefing={...Object.fromEntries(['problemContext','observedSituation','discrepancyConsequences','existingKnowledgeGap','delimitationQuestion'].map(name=>[name,'  Resposta orijinal do aluno para '+name+'.\nPrecisamos investigar sem pressupor resultados.  '])),researchType:'dissertacao'};
const step=url.searchParams.get('step')||'intake';
const nav='<nav>'+['intake','literature_topics','development_topics','methodology_matrix','final_map'].map(s=>'<a style="margin:10px" href="/?step='+s+'&role='+state.authoringRole+'">'+s+'</a>').join('')+'<a href="/?step='+step+'&role=advisor">Perfil autônomo</a></nav>';
res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><main class="workspace-shell proposal-workspace-shell"><h1>Teste sintético C121</h1>'+nav+'<div id="root"></div></main><script id="fixture-data" type="application/json">'+JSON.stringify({step,role:state.authoringRole,workflow:state.workflow}).replace(/</g,'\\u003c')+'</script><script src="/bundle.js"></script></html>');
}catch(error){res.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:error.message}));}});
await new Promise(resolve=>server.listen(3131,'127.0.0.1',resolve));console.log('Synthetic fixture http://127.0.0.1:3131');
