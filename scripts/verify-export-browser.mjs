import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE_PATH?await import(process.env.PLAYWRIGHT_MODULE_PATH):require('playwright');
const mocks={
 'next/navigation':'export const useRouter=()=>({push(){},replace(){},refresh(){}});',
 '@/modules/ai/use-ai-progress':'export const useAiProgress=()=>({request:(...args)=>fetch(...args),label:"Teste sintético"});',
 '@/modules/profile/active-profile-context':'export const useActiveProfile=()=>({activeRole:"student",roleVersion:1});export const profileMutationHeaders=()=>({});',
 './workflow-history':'export const WorkflowHistory=()=>null;',
 './workflow-progress':'export const WorkflowProgress=()=>null;',
 './advisor-review-notice':'export const AdvisorReviewNotice=()=>null;',
};
const {outputFiles}=await build({entryPoints:['tests/fixtures/export-browser.tsx'],bundle:true,write:false,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'offline',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'jsx',resolveDir:process.cwd()}));}}]});
const css=await readFile('app/globals.css','utf8');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
await mkdir('tmp/c126-browser',{recursive:true});
let checks=0;
async function open(mode){
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 const calls=[],errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message);});page.on('dialog',d=>d.dismiss());
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='mapa.invalid')return route.abort();
  if(u.pathname==='/fixture.js')return route.fulfill({contentType:'text/javascript; charset=utf-8',body:outputFiles[0].text});
  if(u.pathname==='/fixture.css')return route.fulfill({contentType:'text/css',body:css});
  if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'});
  calls.push(u.pathname);
  if(u.pathname.endsWith('/final-map')){
   const body=route.request().postDataJSON();calls.push(body.action);
   if(body.action==='prepare_export')return route.fulfill({status:502,json:{error:'IA indisponível; exportação continua disponível.'}});
   const workflow=await page.evaluate(()=>window.fixtureWorkflow);
   workflow.revision++;workflow.content.initialBriefingReview={sourceBriefing:workflow.content.initialBriefing,texts:body.reviewTexts};
   return route.fulfill({json:{workflow}});
  }
  if(u.pathname.includes('/exports/'))return route.fulfill({contentType:'application/pdf',headers:{'Content-Disposition':'attachment; filename="synthetic.pdf"'},body:'%PDF-1.4 synthetic test'});
  if(u.pathname==='/api/prompt-suggestions')return route.fulfill({status:503,json:{code:'budget',error:'Limite global'}});
  return route.abort();
 });
 await page.goto(`https://mapa.invalid/?mode=${mode}`);await page.locator('#root > *').first().waitFor();
 return {page,context,calls,errors};
}
try{
 for(const mode of ['fresh','pending']){
  const t=await open(mode);const {page,calls}=t;
  await page.getByRole('link',{name:'Exportar PDF',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('a[aria-busy="true"]'));
  assert.equal(calls.filter(v=>v.endsWith('/final-map')).length,0);
  assert.equal(calls.filter(v=>v.includes('/exports/')).length,1);
  await page.locator('summary').filter({hasText:'Comparativo do Mapa Avançado'}).click();
  const boxes=page.getByRole('textbox',{name:/Texto Mapa da Pesquisa/});assert.equal(await boxes.count(),5);
  if(mode==='pending'){
   for(const box of await boxes.all())assert.equal(await box.isDisabled(),true);
   assert.equal(await page.getByRole('button',{name:'Sugerir reformulação com IA (opcional)',exact:true}).isDisabled(),true);
  }else{
   for(const [i,box] of (await boxes.all()).entries())await box.fill(`Reformulação manual sintética ${i}.`);
   await page.getByRole('link',{name:'Exportar PDF',exact:true}).click(); // reject unsaved-download confirmation
   assert.equal(calls.filter(v=>v.includes('/exports/')).length,1);
   await page.getByRole('button',{name:'Salvar reformulação',exact:true}).click();
   await page.getByText('Reformulação salva. PDF e Word usarão estes textos junto aos originais.').waitFor();
   assert.equal(calls.filter(v=>v==='save_export_review').length,1);assert.equal(calls.includes('prepare_export'),false);
   assert.equal(await boxes.first().inputValue(),'Reformulação manual sintética 0.');
  }
  await page.locator('.final-intake-review').screenshot({path:`tmp/c126-browser/${mode}.png`});assert.deepEqual(t.errors,[]);checks++;await t.context.close();
 }
 const fail=await open('fresh');await fail.page.locator('summary').filter({hasText:'Comparativo do Mapa Avançado'}).click();
 await fail.page.getByRole('button',{name:'Sugerir reformulação com IA (opcional)',exact:true}).click();
 await fail.page.getByText('IA indisponível; exportação continua disponível.').waitFor();
 await fail.page.getByRole('link',{name:'Exportar Word',exact:true}).click();
 await fail.page.waitForFunction(()=>!document.querySelector('a[aria-busy="true"]'));
 assert.equal(fail.calls.filter(v=>v.includes('/exports/')).length,1);assert.deepEqual(fail.errors,[]);checks++;await fail.context.close();
 for(const mode of ['anonymous','authenticated']){
  const t=await open(mode);await t.page.getByRole('textbox').fill('Pesquisa sintética no ensino superior');
  if(mode==='authenticated')await t.page.getByText(/Sugestões de IA indisponíveis agora/).waitFor();
  else await t.page.waitForTimeout(900);
  assert.equal(t.calls.filter(v=>v==='/api/prompt-suggestions').length,mode==='anonymous'?0:1);
  assert.equal(await t.page.getByRole('textbox').inputValue(),'Pesquisa sintética no ensino superior');
  assert.equal(await t.page.getByRole('button').count(),3);assert.deepEqual(t.errors,[]);checks++;await t.context.close();
 }
 console.log(`C126 browser PASS: ${checks} synthetic flows, downloads without AI, manual first save, pending review protected, provider failure fallback, anonymous local suggestions, budget does not block typing. All network intercepted.`);
}finally{await browser.close();}
