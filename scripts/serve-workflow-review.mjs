import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {state,api} from './c111-route-harness.mjs';
const browserCode=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
 import {PublicStartForm} from './modules/projects/public-start-form';
 import {useEffect,useState} from 'react';import{createRoot}from'react-dom/client';
 import{ActiveProfileProvider}from'./modules/profile/active-profile-context';
 import{ResearchDefinitionWorkspace}from'./modules/research-workflow/research-definition-workspace';
 import{LiteratureDevelopmentWorkspace}from'./modules/research-workflow/literature-development-workspace';
 import{MethodologyWorkspace}from'./modules/research-workflow/methodology-workspace';
 import{FinalMapWorkspace}from'./modules/research-workflow/final-map-workspace';
 import{resolveWorkflowView}from'./modules/research-workflow/workflow-navigation';
 function App(){const[base,setBase]=useState(null);const[epoch,setEpoch]=useState(0);useEffect(()=>{window.c111Navigate=async(url)=>{if(url)history.pushState({},'',url);const result=await fetch('/fixture');setBase(await result.json());setEpoch(n=>n+1);};window.c111Navigate();},[]);if(!base)return <p>Carregando fixture</p>;const target=new URLSearchParams(location.search).get('workflowStep')||'specific_objectives';if(location.pathname==='/mapa') return <PublicStartForm initialMode={new URLSearchParams(location.search).get('modo')==='avancado'?'advanced':'quick'} explicitMode={true}/>;const workflow=resolveWorkflowView(base,target);const props={initialWorkflow:workflow,isSelfDirectedProject:true,projectId:base.projectId};const Workspace=target==='final_map'?FinalMapWorkspace:target==='methodology_matrix'?MethodologyWorkspace:target.includes('topics')?LiteratureDevelopmentWorkspace:ResearchDefinitionWorkspace;return <ActiveProfileProvider activeRole="advisor" roleVersion={1}><Workspace key={epoch+'-'+target} {...props} advisorEmail={null}/></ActiveProfileProvider>};createRoot(document.getElementById('root')).render(<App/>);
`},bundle:true,write:false,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixture-router',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'router',namespace:'c111-router'}));b.onLoad({filter:/.*/,namespace:'c111-router'},()=>({contents:"export const useRouter=()=>({push:u=>window.c111Navigate(u),replace:u=>window.c111Navigate(u),refresh:()=>window.c111Navigate()});"}));}}]});
// Render the actual public pages with authentication and Next wrappers replaced locally.
// The browser still uses the real interactive PublicStartForm above; no external login/API is used.
await mkdir('tmp', {recursive:true});
const publicStubs = {
 'next/link': `import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`,
 'next/image': `import React from 'react';export default function Image({priority,fill,...props}){return React.createElement('img',props)}`,
 'next/headers': `export const headers=async()=>new Headers();`,
 'next/navigation': `export const redirect=()=>{throw Error('Unexpected auth redirect in public fixture')};`,
 '@/lib/supabase/server': `export const createClient=async()=>({auth:{getClaims:async()=>({data:null})}});`,
 '@/modules/projects/public-start-form': `import React from 'react';export const PublicStartForm=()=>React.createElement('div',{id:'root'});`,
};
await build({stdin:{resolveDir:process.cwd(),contents:`import Home from './app/page';import Mapa from './app/mapa/page';import {renderToString} from 'react-dom/server';export async function renderPublic(url){const page=url.pathname==='/mapa'?Mapa:Home;return renderToString(await page({searchParams:Promise.resolve(Object.fromEntries(url.searchParams))}));}`,loader:'tsx'},outfile:'tmp/c114-public-preview.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',plugins:[{name:'public-fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(publicStubs,a.path)?{path:a.path,namespace:'public-stub'}:undefined);b.onLoad({filter:/.*/,namespace:'public-stub'},a=>({contents:publicStubs[a.path],resolveDir:process.cwd()}));}}]});
const {renderPublic}=await import('../tmp/c114-public-preview.mjs');
const css=(await readFile('app/globals.css','utf8')).replace(/^@import.*;$/gm,'');
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(/^\/brand\/[a-zA-Z0-9._-]+\.(png|svg|webp)$/.test(url.pathname)){res.setHeader('Content-Type',url.pathname.endsWith('.svg')?'image/svg+xml':url.pathname.endsWith('.webp')?'image/webp':'image/png');res.end(await readFile('public'+url.pathname));return;}
 if((url.pathname==='/'&&!url.searchParams.has('workflowStep'))||url.pathname==='/mapa'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style>'+await renderPublic(url)+(url.pathname==='/mapa'?'<script src="/bundle.js"></script>':'')+'</html>');return;}
 if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(browserCode.outputFiles[0].text);return;}
 if(req.url==='/test-status'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({writes:state.writes,aiCalls:state.aiCalls,rsCalls:state.rsCalls,workflow:state.workflow}));return;}
 if(req.url==='/fixture'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(state.workflow));return;}
 if(req.url.startsWith('/api/projects/')){
  let body='';for await(const chunk of req)body+=chunk;
  const name=req.url.split('/')[4].split('?')[0];const route=name==='regenerate-card'?'regenerateCard':name==='history'?(req.method==='GET'?'historyGet':'history'):name==='final-map'?'finalMap':name;
  const handler=api[route];if(!handler){res.writeHead(404).end();return;}
  const response=await handler(new Request('http://localhost'+req.url,{method:req.method,headers:req.headers,...(body?{body}: {})}),{params:Promise.resolve({id:state.workflow.projectId})});
  res.writeHead(response.status,Object.fromEntries(response.headers));for await(const chunk of response.body)res.write(chunk);res.end();return;
 }
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><main class="workspace-shell proposal-workspace-shell"><h1>Projeto sintético C114 — ambiente local</h1><div id="root"></div></main><script src="/bundle.js"></script></html>');
}catch(error){res.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:error.message}));}});
await new Promise(resolve=>server.listen(3114,'127.0.0.1',resolve));
console.log('C114 review fixture ready at http://127.0.0.1:3114 (synthetic data and providers only)');
