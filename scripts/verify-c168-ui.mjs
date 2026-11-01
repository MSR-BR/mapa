// Real card and styles with synthetic data; all browser requests intercepted.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright';
const evidence = '.specs/changes/168-advisor-pending-validation/evidence';
await mkdir(evidence, {recursive:true});
const bundle = await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import {createRoot} from 'react-dom/client';
import {ProjectCardModal} from './modules/projects/project-card-modal';
const base={academicArea:'Ciências sociais',advisorEmail:null,advisorReview:null,canDelete:false,integrationSource:null,isIntegration:false,ownerId:'synthetic',progress:40,referenceCount:0,referencePreview:[],relation:'advisor',stageLabel:'Metodologia',statusLabel:'Mapa v2',studentName:'Ana Silva (exemplo)',title:'Projeto de pesquisa de exemplo',updatedAt:'2026-11-01T12:00:00Z',workflowVersion:2};
const badges=[{tone:'green',label:'Validação pendente · até 3 dias'},{tone:'yellow',label:'Validação pendente · mais de 3 dias'},{tone:'red',label:'Validação pendente · mais de 5 dias'},null];
createRoot(document.getElementById('root')).render(<main style={{padding:16}}><h1>Projetos orientados — prévia sintética</h1><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:16}}>{badges.map((pendingReview,i)=><ProjectCardModal {...base} projectId={'test-'+i} key={i} pendingReview={pendingReview} selectable={false}/>)}<ProjectCardModal {...base} relation="owner" projectId="own" pendingReview={badges[0]} selectable={false}/></div></main>);
`},bundle:true,write:false,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'isolated-fixture',setup(p){
p.onResolve({filter:/^(next\/link|\.\/actions|@\/modules\/profile\/active-profile-context)$/},a=>({path:a.path,namespace:'mock'}));
p.onLoad({filter:/.*/,namespace:'mock'},a=>({loader:'jsx',resolveDir:process.cwd(),contents:a.path==='next/link'?'export default function Link({children,href,...props}){return <a href={href} {...props}>{children}</a>}':a.path==='./actions'?'export async function deleteProject(){}':'export function useActiveProfile(){return {roleVersion:1}}'}));
}}]});
const css=await readFile('app/globals.css','utf8');
const browser=await chromium.launch({headless:true});
try{
const page=await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>{const u=new URL(r.request().url()); if(u.hostname!=='mapa.invalid')return r.abort(); if(u.pathname==='/bundle.js')return r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text});return r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style><div id="root"></div><script src="/bundle.js"></script></html>'});});
for(const width of [1280,390,320]){
await page.setViewportSize({width,height:900});await page.goto('https://mapa.invalid/');await page.locator('.project-card').first().waitFor();
assert.equal(await page.locator('.project-pending-review').count(),3);
assert.equal(await page.locator('.project-card-student').count(),4);
assert.equal(await page.locator('.project-card').nth(3).locator('.project-pending-review').count(),0);
assert.equal(await page.locator('.project-card').nth(4).locator('.project-pending-review').count(),0);
for(const [tone,color] of [['green','rgb(220, 252, 231)'],['yellow','rgb(254, 249, 195)'],['red','rgb(254, 226, 226)']])assert.equal(await page.locator('.project-pending-review-'+tone).evaluate(e=>getComputedStyle(e).backgroundColor),color);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
await page.screenshot({path:evidence+'/cards-'+width+'.png',fullPage:true});
}
assert.deepEqual(errors,[]); console.log('PASS: actual cards, three colors, no-pending and owner hidden, names preserved, 1280/390/320px, no browser errors.');
}finally{await browser.close()}
