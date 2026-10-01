// Isolated component regression: no real account, database or provider is touched.
// Supply PLAYWRIGHT_MODULE when Playwright is installed in a separate tool cache.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { build } from "esbuild";

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const { expect } = await import(process.env.PLAYWRIGHT_ASSERT_MODULE || "@playwright/test");
const fixture = { revision: 1, content: { referenceArchive: [], discovery: null } };
const built = await build({
  stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
    import { createRoot } from 'react-dom/client';
    import { useState } from 'react';
    import { ManualReferencePanel } from './modules/research-workflow/manual-reference-panel';
    import { ActiveProfileProvider } from './modules/profile/active-profile-context';
    function App() {
      const [workflow, setWorkflow] = useState(${JSON.stringify(fixture)});
      return <ActiveProfileProvider activeRole="advisor" roleVersion={1}>
        <ManualReferencePanel projectId="00000000-0000-4000-8000-000000000105" workflow={workflow} onWorkflow={setWorkflow}/>
      </ActiveProfileProvider>;
    }
    createRoot(document.getElementById('root')).render(<App/>);
  ` }, bundle: true, write: false, jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
});
const css = (await readFile("app/globals.css", "utf8")).replace(/^@import.*;$/gm, "");
const server = createServer((request, response) => {
  response.setHeader("Content-Type", request.url === "/bundle.js" ? "text/javascript" : "text/html");
  response.end(request.url === "/bundle.js" ? built.outputFiles[0].text : `<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><body><main style="padding:24px"><div id="root"></div></main><script src="/bundle.js"></script></body></html>`);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let scenarios = 0;
try {
  for (const [name, engine] of [["Chromium", chromium], ["WebKit", webkit]]) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        let status = 200;
        let release;
        let lookupCalls = 0;
        let saved;
        const metadata = { doi: "10.1234/example", title: "Título da publicação", authors: "Ana Silva", journal: "Revista exemplo", abstract: "", volumeIssuePages: "2024" };
        await page.route("**/references/doi", async (route) => {
          lookupCalls++;
          assert.equal(route.request().headers()["x-profile-role-version"], "1");
          await new Promise((resolve) => { release = resolve; });
          await route.fulfill({ status, json: status === 200 ? { metadata, provenance: { doi: metadata.doi, provider: "Crossref", retrievedAt: "2026-10-01T12:00:00Z" }, warnings: [] } : { error: "Busca indisponível. Preencha manualmente." } }).catch(() => undefined);
        });
        await page.route("**/references", async (route) => {
          saved = route.request().postDataJSON();
          await route.fulfill({ json: { workflow: { ...fixture, revision: 2, content: { ...fixture.content, referenceArchive: [{ ...saved.reference, source: "manual", referenceId: "test", year: 2024 }] } } } });
        });
        await page.goto(origin);
        const add = page.getByRole("button", { name: "Adicionar referência externa" });
        const doi = page.getByLabel("DOI (opcional)");
        const title = page.getByLabel("Título", { exact: true });
        const save = page.getByRole("button", { name: "Salvar referência" });
        await add.click();
        await expect(doi).toBeFocused();
        await doi.fill("https://doi.org/10.1234/example");
        await title.fill("Título digitado por mim");
        await page.getByRole("button", { name: "Buscar dados" }).click();
        await expect.poll(() => lookupCalls).toBe(1);
        await page.getByRole("textbox", { name: "Abstract", exact: true }).fill("Resumo escrito durante a busca.");
        await expect(save).toBeDisabled();
        release();
        await expect(page.getByText(/Dados encontrados/)).toBeVisible();
        await expect(title).toHaveValue("Título digitado por mim");
        await expect(page.getByLabel("Autores")).toHaveValue("Ana Silva");
        await expect(page.getByRole("textbox", { name: "Abstract", exact: true })).toHaveValue("Resumo escrito durante a busca.");
        await expect(page.getByText(/Abstract não disponível/)).toBeVisible();
        assert.ok(await page.locator("dialog").evaluate((element) => element.getBoundingClientRect().width <= innerWidth));
        await page.screenshot({ path: `tmp/c105-${name}-${viewport.width}.png`, fullPage: true });
        await save.click();
        await expect(page.getByRole("dialog")).toHaveCount(0);
        assert.equal(saved.reference.abstract, "Resumo escrito durante a busca.");
        assert.equal(saved.reference.metadataLookup.provider, "Crossref");
        await add.click();
        await doi.fill("10.1234/example");
        await page.getByRole("button", { name: "Buscar dados" }).click();
        await expect(page.getByText(/Este DOI já está/)).toBeVisible();
        assert.equal(lookupCalls, 1);
        await doi.fill("10.1234/another");
        status = 503;
        await page.getByRole("button", { name: "Buscar dados" }).click();
        await expect.poll(() => lookupCalls).toBe(2);
        release();
        await expect(page.getByText(/Busca indisponível/)).toBeVisible();
        await title.fill("Referência preenchida à mão");
        await save.click();
        assert.equal(saved.reference.metadataLookup, undefined);
        await expect(page.getByRole("dialog")).toHaveCount(0);

        // A changed DOI cancels an in-flight response without replacing manual text.
        await add.click();
        await doi.fill("10.1234/slow");
        status = 200;
        await page.getByRole("button", { name: "Buscar dados" }).click();
        await expect.poll(() => lookupCalls).toBe(3);
        await doi.fill("10.1234/new-work");
        await title.fill("Texto preservado");
        release();
        await expect(title).toHaveValue("Texto preservado");
        await expect(page.getByLabel("Autores")).toHaveValue("");
        await expect(save).toBeEnabled();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(add).toBeFocused();
        assert.deepEqual(errors, []);
        scenarios++;
        console.log(JSON.stringify({ engine: name, viewport, result: "pass", cases: ["partial metadata", "concurrent editing", "manual fallback", "save", "duplicate", "stale response", "Escape/focus", "responsive"] }));
        await page.close();
      }
    } finally { await browser.close(); }
  }
} finally { server.close(); }
assert.equal(scenarios, 4);
