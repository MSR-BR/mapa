// Isolated UI regression: real component and CSS, no account, database or AI call.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { build } from "esbuild";

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const { expect } = await import(process.env.PLAYWRIGHT_ASSERT_MODULE || "@playwright/test");
const built = await build({
  stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
    import { createRoot } from 'react-dom/client';
    import { useState } from 'react';
    import { AiGuidanceField } from './modules/research-workflow/ai-guidance-field';
    function App() {
      const [context, setContext] = useState('');
      const [request, setRequest] = useState('');
      return <AiGuidanceField context={context} contextPlaceholder="Explique o contexto acadêmico." label="Contexto e orientações para a IA — OE1" onContextChange={setContext} onRequestChange={setRequest} request={request} requestPlaceholder="Descreva o ajuste desejado." required />;
    }
    createRoot(document.getElementById('root')).render(<App/>);
  ` }, bundle: true, write: false, jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
});
const css = (await readFile("app/globals.css", "utf8")).replace(/^@import.*;$/gm, "");
const server = createServer((request, response) => {
  response.setHeader("Content-Type", request.url === "/bundle.js" ? "text/javascript" : "text/html");
  response.end(request.url === "/bundle.js" ? built.outputFiles[0].text : `<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><body><main style="max-width:620px;padding:24px"><div id="root"></div></main><script src="/bundle.js"></script></body></html>`);
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
        await page.goto(origin);
        const context = page.getByRole("textbox", { name: /contexto acadêmico/i });
        await expect(context).toBeVisible();
        await expect(context).toHaveAttribute("placeholder", "Explique o contexto acadêmico.");
        await context.fill("A pesquisa exige este recorte.");
        await page.getByRole("button", { name: /Pedido para regenerar/ }).click();
        const request = page.getByRole("textbox", { name: /pedido para regenerar/i });
        await expect(request).toHaveAttribute("placeholder", "Descreva o ajuste desejado.");
        await request.fill("Reformule o OE1.");
        await page.getByRole("button", { name: /Como usar/ }).click();
        await expect(page.getByRole("tooltip")).toContainText("não é salvo como justificativa");
        await page.keyboard.press("Escape");
        await expect(page.getByRole("tooltip")).toHaveCount(0);
        await page.getByRole("button", { name: /Contexto para próximas etapas/ }).click();
        await expect(context).toHaveValue("A pesquisa exige este recorte.");
        await page.getByRole("button", { name: /Pedido para regenerar/ }).click();
        await expect(request).toHaveValue("Reformule o OE1.");
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.deepEqual(errors, []);
        scenarios++;
        console.log(JSON.stringify({ engine: name, viewport: viewport.width, result: "pass" }));
        await page.close();
      }
    } finally { await browser.close(); }
  }
} finally { server.close(); }
assert.equal(scenarios, 4);
