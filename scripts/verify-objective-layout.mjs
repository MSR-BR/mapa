// Full definition workspace + production CSS; synthetic data, no remote API.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { build } from "esbuild";

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const { expect } = await import(process.env.PLAYWRIGHT_ASSERT_MODULE || "@playwright/test");
const built = await build({
  stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
    import { createRoot } from 'react-dom/client';
    import { ActiveProfileProvider } from './modules/profile/active-profile-context';
    import { ResearchDefinitionWorkspace } from './modules/research-workflow/research-definition-workspace';
    import { researchWorkflowSchema } from './modules/research-workflow/schema';
    const params = new URLSearchParams(location.search);
    const role = params.get('role') || 'advisor';
    const step = params.get('step') || 'specific_objectives';
    const texts = [
      ['problem_statement', 'Como atividades experimentais podem contribuir para a aprendizagem de Física no ensino médio?'],
      ['general_objective', 'Analisar como atividades experimentais com sensores de baixo custo contribuem para a aprendizagem de Física no ensino médio.'],
      ['specific_objective', 'Descrever os fundamentos teóricos da aprendizagem por investigação, considerando a participação dos estudantes e a interpretação de dados em atividades experimentais de Física.'],
      ['specific_objective', 'Identificar estratégias para integrar sensores de baixo custo às atividades experimentais, considerando a acessibilidade e os recursos disponíveis nas escolas.'],
      ['specific_objective', 'Analisar as contribuições das atividades para a compreensão dos conceitos físicos e para a colaboração entre estudantes.'],
      ['specific_objective', 'Avaliar os resultados das atividades a partir dos registros produzidos pelos estudantes e das observações dos professores.']
    ];
    const workflow = researchWorkflowSchema.parse({
      ownerId: crypto.randomUUID(), projectId: crypto.randomUUID(), revision: 1,
      schemaVersion: '2.0.0', sourceRevision: 1, updatedAt: '2026-10-01T12:00:00Z',
      state: 'validating_specific_objectives', stableState: 'validating_specific_objectives',
      content: { activeStep: step, elements: texts.map(([type, proposedContent]) => ({
        id: crypto.randomUUID(), type, proposedContent, approvedContent: null,
        revision: 1, sourceRevision: 1, status: 'suggested', updatedBy: 'ai'
      })) }
    });
    createRoot(document.getElementById('root')).render(
      <ActiveProfileProvider activeRole={role} roleVersion={1}>
        <ResearchDefinitionWorkspace advisorEmail={role === 'student' ? 'advisor@example.com' : null} initialWorkflow={workflow} isSelfDirectedProject={role === 'advisor'} projectId={workflow.projectId}/>
      </ActiveProfileProvider>
    );
  ` },
  bundle: true, write: false, jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "test-router", setup(builder) {
    builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "router", namespace: "test-router" }));
    builder.onLoad({ filter: /.*/, namespace: "test-router" }, () => ({ contents: "export const useRouter = () => ({refresh(){},replace(){},push(){}});" }));
  } }],
});
const css = (await readFile("app/globals.css", "utf8")).replace(/^@import.*;$/gm, "");
const server = createServer((request, response) => {
  if (request.method !== "GET") { response.writeHead(405).end(); return; }
  response.setHeader("Content-Type", request.url === "/bundle.js" ? "text/javascript" : "text/html");
  response.end(request.url === "/bundle.js" ? built.outputFiles[0].text : `<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><body><main class="workspace-shell proposal-workspace-shell"><h1>Atividades experimentais no ensino médio</h1><div id="root"></div></main><script src="/bundle.js"></script></body></html>`);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
await mkdir("tmp", { recursive: true });
let scenarios = 0;
try {
  for (const [name, engine] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const width of [320, 390, 768, 900, 1024, 1280, 1440]) {
        for (const role of ["advisor", "student"]) {
          const page = await browser.newPage({ viewport: { width, height: 1000 } });
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await page.route("**/*", (route) => route.request().url().startsWith(origin) ? route.continue() : route.abort());
          await page.goto(`${origin}/?role=${role}`);
          const cards = page.getByRole("article");
          await expect(cards).toHaveCount(5);
          const measurements = await cards.evaluateAll((nodes) => nodes.map((card) => {
            const rect = (selector) => card.querySelector(selector)?.getBoundingClientRect();
            const box = card.getBoundingClientRect();
            const text = rect(".definition-editor-with-note > label > textarea");
            const guidance = rect(".ai-guidance-field");
            const actions = rect(".objective-card-actions");
            return {
              contained: box.left >= 0 && box.right <= innerWidth && text.left >= box.left && text.right <= box.right && guidance.right <= box.right,
              readable: text.width >= Math.min(240, box.width - 34),
              separated: text.right <= guidance.left || text.bottom <= guidance.top,
              footer: !actions || actions.top >= Math.max(text.bottom, guidance.bottom),
            };
          }));
          assert.ok(measurements.every((item) => Object.values(item).every(Boolean)), JSON.stringify({ name, width, role, measurements }));
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow: ${name}/${width}/${role}`);
          const first = page.getByRole("article", { name: "Objetivo específico 1", exact: true });
          await first.getByRole("button", { name: /Como usar/ }).click();
          const popup = await page.getByRole("tooltip").boundingBox();
          assert.ok(popup.x >= 0 && popup.x + popup.width <= width, "Help must fit the viewport");
          await page.keyboard.press("Escape");
          await expect(page.getByRole("tooltip")).toHaveCount(0);
          await first.getByRole("textbox", { name: /contexto acadêmico/ }).fill("Preservar o recorte das escolas públicas.");
          await first.getByRole("button", { name: /Pedido para regenerar/ }).click();
          await first.getByRole("textbox", { name: /pedido para regenerar/ }).fill("Ajustar o recorte do objetivo.");
          await first.getByRole("button", { name: /Contexto para próximas etapas/ }).click();
          await expect(first.getByRole("textbox", { name: /contexto acadêmico/ })).toHaveValue("Preservar o recorte das escolas públicas.");
          if (role === "advisor" && [390, 900, 1440].includes(width)) {
            await first.screenshot({ path: `tmp/c107-${name}-${width}.png` });
          }
          await page.getByRole("button", { name: "+ Adicionar objetivo" }).click();
          await expect(cards).toHaveCount(6);
          await page.getByRole("button", { name: "Remover objetivo específico 5", exact: true }).click();
          await expect(cards).toHaveCount(5);
          const promoted = await first.getByRole("textbox", { name: /^Objetivo específico 1/ }).inputValue();
          await first.getByRole("button", { name: "Usar como objetivo geral" }).click();
          await expect(page.getByRole("article", { name: "Objetivo geral", exact: true }).getByRole("textbox", { name: /^Objetivo geral/ })).toHaveValue(promoted);
          await expect(cards).toHaveCount(4);
          assert.deepEqual(errors, []);
          scenarios++;
          console.log(JSON.stringify({ engine: name, width, role, result: "pass" }));
          await page.close();
        }
      }
    } finally { await browser.close(); }
  }
} finally { server.close(); }
assert.equal(scenarios, 28);
