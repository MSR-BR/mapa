/** Entirely synthetic browser harness: no real API, tag, login or paid generation is reachable. */
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const playwrightPath = process.env.PLAYWRIGHT_MODULE_PATH;
const { chromium } = playwrightPath ? await import(playwrightPath) : require("playwright");
const mocks = {
  "next/navigation": 'export const usePathname = () => location.pathname; export const useRouter = () => ({refresh(){},push(){},replace(){}});',
  "next/link": 'export default function Link({children, ...props}) { return <a {...props}>{children}</a>; }',
  "next/script": 'export default function Script() { return null; }',
  "@/lib/supabase/client": 'export function createClient() { return {auth:{onAuthStateChange(callback) { window.authCallback = callback; callback("INITIAL_SESSION", {}); return {data:{subscription:{unsubscribe(){}}}}; }}}; }',
  "@/modules/ai/use-ai-progress": 'export const useAiProgress = () => ({request: (...args) => fetch(...args), label:"Teste sintético", cancel(){}});',
  "@/modules/profile/active-profile-context": 'export const useActiveProfile = () => ({activeRole:"advisor",roleVersion:1}); export const profileMutationHeaders = () => ({});',
  "./project-card-modal": 'export function ProjectCardModal({projectId,title,onSelectionChange}) { return <button onClick={() => onSelectionChange(projectId,true)}>Selecionar {title}</button>; }',
  "./workflow-history": 'export function WorkflowHistory() { return null; }',
  "./workflow-progress": 'export function WorkflowProgress() { return null; }',
  "./manual-reference-panel": 'export function ManualReferencePanel() { return null; }',
};
const result = await build({ entryPoints: ["tests/fixtures/measurement-browser.tsx"], bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' }, plugins: [{ name: "synthetic-only", setup(b) {
  b.onResolve({filter: /.*/}, args => mocks[args.path] ? {path: args.path, namespace:"mock"} : undefined);
  b.onLoad({filter: /.*/, namespace:"mock"}, args => ({ contents:mocks[args.path], loader:"jsx", resolveDir:process.cwd() }));
}}] });
const bundle = result.outputFiles[0].text;
const css = await readFile("app/globals.css", "utf8");
const browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
let checks = 0;
const screenshots = path.resolve("tmp/c123-browser");
await mkdir(screenshots, {recursive:true});
async function pageFor(flow, mode = "429", options = {}) {
  const context = await browser.newContext({viewport:{width:375,height:667},...options});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => { errors.push(e.message); console.error("Synthetic page error:", e.message); });
  await page.addInitScript(({flow}) => {
    window.calls = [];
    if (flow !== "consent") {
      localStorage.setItem("mapa.analytics-consent.v1", "accepted");
      window.gtag = (...args) => window.calls.push(args);
    }
  }, {flow});
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== "mapa.invalid") return route.abort();
    if (url.pathname === "/fixture.js") return route.fulfill({contentType:"text/javascript",body:bundle});
    if (url.pathname === "/fixture.css") return route.fulfill({contentType:"text/css",body:css});
    if (url.pathname.startsWith("/api/")) {
      if (mode === "advisor-required") return route.fulfill({status:409,json:{code:"student_advisor_required",error:"PRIVATE SERVER TEXT"}});
      if (mode === "offline") return route.abort("internetdisconnected");
      if (url.searchParams.has("status")) return route.fulfill({json:{job:null}});
      if (mode === "invalid") return route.fulfill({status:200,contentType:"application/json",body:"broken-json"});
      return route.fulfill({status:mode === "503-unknown" ? 503 : Number(mode),json:{error:"Erro sintético", ...(mode === "503" ? {errorCode:"persistence_failed"} : {})}});
    }
    if (url.pathname === "/") return route.fulfill({contentType:"text/html",body:'<!doctype html><html lang="pt-BR"><head><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'});
    return route.abort();
  });
  await page.goto(`https://mapa.invalid/?flow=${flow}`);
  await page.waitForSelector("#root > *");
  return {page, context, errors};
}
try {
  for (const flow of ["generation", "literature", "export", "integration"]) {
    for (const [mode, reason] of [["429","rate_limited"],["503","persistence_failed"],["503-unknown","unknown"],["422","validation"],["offline","network"],["invalid","response_invalid"]]) {
      if (flow === "export" && mode === "invalid") continue;
      console.log(`Testing ${flow}/${mode}`);
      const {page,context,errors} = await pageFor(flow, mode);
      if (flow === "integration") {
        await page.getByRole("button", {name:"Selecionar Sintético 1"}).click();
        await page.getByRole("button", {name:"Selecionar Sintético 2"}).click();
      }
      const names = {generation:"Gerar estrutura",literature:"Próximo",export:"Baixar PDF",integration:"Integrar"};
      await page.getByRole(flow === "export" ? "link" : "button",{name:names[flow],exact:true}).click();
      await page.waitForFunction(() => window.calls.some(c => c[1].endsWith("_failed") || c[1] === "stage_blocked"));
      const failures = await page.evaluate(() => window.calls.filter(c => c[1].endsWith("_failed") || c[1] === "stage_blocked"));
      // Invalid download response is tested as HTTP success only for JSON flows, not binary PDF bodies.
      assert.equal(failures.length,1,`${flow}/${mode}: one failure`);
      assert.equal(failures[0][2].app_reason_code,reason,`${flow}/${mode}`);
      assert.deepEqual(errors,[],`${flow}/${mode}`);
      checks++;
      await context.close();
    }
  }
  const advisor = await pageFor("literature", "advisor-required");
  const textboxes = advisor.page.getByRole("textbox");
  const before = await textboxes.evaluateAll(items => items.map(item => item.value));
  await advisor.page.getByRole("button", {name:"Próximo",exact:true}).click();
  await advisor.page.getByText(/Cadastre o e-mail do orientador/).waitFor();
  assert.deepEqual(await textboxes.evaluateAll(items => items.map(item => item.value)), before);
  assert.equal(await advisor.page.getByText("PRIVATE SERVER TEXT").count(),0);
  assert.equal((await advisor.page.evaluate(()=>window.calls.filter(c=>c[1]==="stage_blocked"))).at(-1)[2].app_reason_code,"prerequisite_required");
  assert.deepEqual(advisor.errors,[]); checks++; await advisor.context.close();

  const retry = await pageFor("discovery");
  await retry.page.getByRole("button",{name:"Tentar novamente",exact:true}).click();
  await retry.page.waitForFunction(() => window.calls.filter(c=>c[1]==="generation_failed").length===2);
  assert.deepEqual(await retry.page.evaluate(()=>window.calls.filter(c=>["generation_started","generation_retry"].includes(c[1])).map(c=>c[1])),["generation_started","generation_retry"]);
  checks++; await retry.context.close();

  const login = await pageFor("login");
  await login.page.getByRole("button",{name:"Continuar com Google"}).click();
  assert.equal(await login.page.evaluate(()=>window.calls.filter(c=>c[1]==="login_started").length),1);
  checks++; await login.context.close();
  for (const [code,reason] of [["google","unknown"],["access","permission_denied"]]) {
    const error = await pageFor("login-error");
    if (code === "access") await error.page.goto("https://mapa.invalid/?flow=login-error&code=access");
    await error.page.waitForFunction(()=>window.calls.some(c=>c[1]==="login_failed"));
    assert.equal(await error.page.evaluate(()=>window.calls.filter(c=>c[1]==="login_failed").at(-1)[2].app_reason_code),reason);
    checks++; await error.context.close();
  }
  const touch = await pageFor("prompt","429",{hasTouch:true,isMobile:true});
  assert.equal(await touch.page.getByRole("textbox",{name:"Tema ou palavras-chave da pesquisa"}).count(),1);
  assert.equal(await touch.page.evaluate(()=>document.activeElement.tagName),"BODY");
  checks++; await touch.context.close();

  const consent = await pageFor("consent");
  await consent.page.getByRole("dialog").waitFor();
  assert.equal(await consent.page.evaluate(()=>document.activeElement.tagName),"DIALOG");
  assert.equal(await consent.page.evaluate(()=>window.dataLayer),undefined);
  assert.equal(await consent.page.getByRole("dialog").evaluate(el=>el.getBoundingClientRect().bottom <= innerHeight && el.getBoundingClientRect().top >= 0),true);
  await consent.page.keyboard.press("Shift+Tab");
  assert.equal(await consent.page.evaluate(()=>document.activeElement.textContent),"Salvar escolhas");
  await consent.page.keyboard.press("Tab");
  assert.equal(await consent.page.evaluate(()=>document.querySelector("dialog").contains(document.activeElement)),true);
  await consent.page.screenshot({path:path.join(screenshots,"consent-mobile.png")});
  await consent.page.setViewportSize({width:320,height:320});
  assert.equal(await consent.page.getByRole("dialog").evaluate(el=>el.scrollHeight > el.clientHeight && el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().bottom <= innerHeight),true);
  await consent.page.getByRole("button",{name:"Recusar todos"}).scrollIntoViewIfNeeded();
  await consent.page.screenshot({path:path.join(screenshots,"consent-short-viewport.png")});
  checks++;
  await consent.page.getByRole("button",{name:"Recusar todos"}).click();
  assert.equal(await consent.page.evaluate(()=>window.dataLayer),undefined);
  await consent.page.getByRole("button",{name:"Reabrir preferências"}).click();
  await consent.page.getByRole("button",{name:"Cancelar",exact:true}).click();
  assert.equal(await consent.page.evaluate(()=>document.activeElement.id),"outside");
  await consent.page.getByRole("button",{name:"Reabrir preferências"}).click();
  await consent.page.getByRole("button",{name:"Aceitar métricas"}).click();
  await consent.page.waitForFunction(()=>window.dataLayer?.some(c=>c[1]==="page_view"));
  assert.equal(await consent.page.evaluate(()=>localStorage.getItem("mapa.ads-consent.v1")),"rejected");
  assert.equal(await consent.page.evaluate(()=>window.dataLayer.filter(c=>c[1]==="login_success").length),0);
  assert.deepEqual(consent.errors,[]);
  checks++; await consent.context.close();
  console.log(`PASS: ${checks} synthetic browser scenarios; all remote requests intercepted.`);
} finally { await browser.close(); }
