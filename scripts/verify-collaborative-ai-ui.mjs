import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {state,api} from './c111-route-harness.mjs';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {expect}=await import(process.env.PLAYWRIGHT_ASSERT_MODULE||'playwright/test');
const browserCode=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
 import {useEffect,useState} from 'react';import{createRoot}from'react-dom/client';
 import{ActiveProfileProvider}from'./modules/profile/active-profile-context';
 import{ResearchDefinitionWorkspace}from'./modules/research-workflow/research-definition-workspace';
 import{LiteratureDevelopmentWorkspace}from'./modules/research-workflow/literature-development-workspace';
 import{MethodologyWorkspace}from'./modules/research-workflow/methodology-workspace';
 import{FinalMapWorkspace}from'./modules/research-workflow/final-map-workspace';
 import{resolveWorkflowView}from'./modules/research-workflow/workflow-navigation';
 function App(){const[base,setBase]=useState(null);const[epoch,setEpoch]=useState(0);useEffect(()=>{window.c111Navigate=async(url)=>{if(url)history.pushState({},'',url);const result=await fetch('/fixture');setBase(await result.json());setEpoch(n=>n+1);};window.c111Navigate();},[]);if(!base)return <p>Carregando fixture</p>;const target=new URLSearchParams(location.search).get('workflowStep')||'general_objective';const workflow=resolveWorkflowView(base,target);const props={initialWorkflow:workflow,isSelfDirectedProject:true,projectId:base.projectId};const Workspace=target==='final_map'?FinalMapWorkspace:target==='methodology_matrix'?MethodologyWorkspace:target.includes('topics')?LiteratureDevelopmentWorkspace:ResearchDefinitionWorkspace;return <ActiveProfileProvider activeRole="advisor" roleVersion={1}><Workspace key={epoch+'-'+target} {...props} advisorEmail={null}/></ActiveProfileProvider>};createRoot(document.getElementById('root')).render(<App/>);
`},bundle:true,write:false,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixture-router',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'router',namespace:'c111-router'}));b.onLoad({filter:/.*/,namespace:'c111-router'},()=>({contents:"export const useRouter=()=>({push:u=>window.c111Navigate(u),replace:u=>window.c111Navigate(u),refresh:()=>window.c111Navigate()});"}));}}]});
const css=(await readFile('app/globals.css','utf8')).replace(/^@import.*;$/gm,'');
const server=createServer(async(req,res)=>{try{
 if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(browserCode.outputFiles[0].text);return;}
 if(req.url==='/fixture'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(state.workflow));return;}
 if(req.url.startsWith('/api/projects/')){
  let body='';for await(const chunk of req)body+=chunk;
  const name=req.url.split('/')[4].split('?')[0];const route=name==='history'?(req.method==='GET'?'historyGet':'history'):name==='final-map'?'finalMap':name;
  const handler=api[route];if(!handler){res.writeHead(404).end();return;}
  const response=await handler(new Request('http://localhost'+req.url,{method:req.method,headers:req.headers,...(body?{body}: {})}),{params:Promise.resolve({id:state.workflow.projectId})});
  res.writeHead(response.status,Object.fromEntries(response.headers));for await(const chunk of response.body)res.write(chunk);res.end();return;
 }
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><main class="workspace-shell proposal-workspace-shell"><h1>Projeto sintético C112</h1><div id="root"></div></main><script src="/bundle.js"></script></html>');
}catch(error){res.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:error.message}));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
await mkdir('tmp/c112-ui',{recursive:true});let scenarios=0;
try{for(const[name,engine]of[['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,...(process.env['PLAYWRIGHT_'+name.toUpperCase()+'_EXECUTABLE']?{executablePath:process.env['PLAYWRIGHT_'+name.toUpperCase()+'_EXECUTABLE']}: {})});
 try{for(const width of[320,1280]){
  state.reset();const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.goto(origin+'/?workflowStep=general_objective');const textarea=page.locator('.definition-editor > .definition-editor-with-note > label > textarea');await expect(textarea).toHaveCount(1).catch(async(error)=>{console.log({errors,body:(await page.locator('body').innerText()).slice(0,2000)});throw error;});assert.equal(state.aiCalls,0);assert.equal(state.writes,0);
  const text='Analisar o recorte editado e salvo durante o teste de navegação C111.';await textarea.fill(text);await page.getByRole('button',{name:'Abrir Metodologia e encerramento',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Permanecer nesta etapa'}).click();await expect(textarea).toHaveValue(text);
  await page.getByRole('button',{name:'Voltar',exact:true}).click();await expect(page.getByRole('dialog')).toBeFocused();await page.getByRole('button',{name:'Permanecer nesta etapa'}).click();await expect(textarea).toHaveValue(text);await page.getByRole('button',{name:'Regenerar com minhas orientações',exact:true}).click();await expect(textarea).toHaveValue(text);assert.equal(state.aiCalls,0);await page.getByRole('button',{name:'Abrir Metodologia e encerramento',exact:true}).click();state.denied=true;await page.getByRole('button',{name:'Salvar e abrir etapa',exact:true}).click();await expect(page.getByText('Não foi possível salvar. Suas edições continuam nesta tela.')).toBeVisible();await expect(textarea).toHaveValue(text);state.denied=false;
  await page.getByRole('button',{name:'Salvar e abrir etapa',exact:true}).click();await expect(page.locator('.methodology-workspace, .methodology-heading')).toBeVisible();assert.equal(state.aiCalls,0);assert.equal(state.writes,1);
  await page.getByRole('button',{name:'Abrir Objetivos',exact:true}).click();await expect(textarea).toHaveValue(text);
  await page.reload();await expect(textarea).toHaveValue(text);assert.equal(state.writes,1);
  await page.getByRole('button',{name:'Histórico e recuperação',exact:true}).click();await expect(page.getByRole('button',{name:/Objetivo geral · revisão/})).toHaveCount(1);await page.getByRole('button',{name:/Objetivo geral · revisão/}).click();await expect(page.getByRole('heading',{name:'Comparar antes de recuperar'})).toBeVisible();await page.screenshot({path:'tmp/c112-ui/'+name+'-'+width+'-history.png'});
  await page.getByRole('button',{name:'Fechar comparação'}).click();state.progressMode=true;await page.getByRole('button',{name:'Regenerar com minhas orientações',exact:true}).focus();await page.getByRole('button',{name:'Regenerar com minhas orientações',exact:true}).press('Enter');await expect(page.getByRole('heading',{name:'Gerando sugestões com Gemini…',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Continuando com GPT…',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Cancelar solicitação',exact:true})).toBeVisible();await page.screenshot({path:'tmp/c112-ui/'+name+'-'+width+'-fallback.png'});await expect(page.getByText('Nova proposta da IA — aguardando sua decisão')).toBeVisible();await expect(textarea).toHaveValue(text);await expect(page.getByRole('button',{name:'Regenerar com minhas orientações',exact:true})).toBeFocused();assert.equal(state.aiCalls,1);state.progressMode=false;
  await page.getByRole('button',{name:'Descartar proposta',exact:true}).click();await expect(page.getByText('Nova proposta da IA — aguardando sua decisão')).toHaveCount(0);await expect(textarea).toHaveValue(text);
  await page.getByRole('button',{name:'Abrir Metodologia e encerramento',exact:true}).click();await page.getByRole('button',{name:'Abrir Encerramento e mapa final',exact:true}).click();await expect(page.locator('.final-map-workspace')).toBeVisible();assert.equal(state.aiCalls,1);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);assert.deepEqual(errors,[]);
  await page.screenshot({path:'tmp/c112-ui/'+name+'-'+width+'.png',fullPage:true});await page.close();scenarios++;console.log(JSON.stringify({name,width,result:'pass'}));
 }}finally{await browser.close();}
}}finally{await new Promise(resolve=>server.close(resolve));}
console.log(JSON.stringify({status:'C112_UI_PASS',scenarios}));
