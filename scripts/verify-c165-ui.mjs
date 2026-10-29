// Synthetic UI only: browser requests are intercepted; no login, database or AI call.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const { chromium } = process.env.PLAYWRIGHT_MODULE_PATH
  ? await import(process.env.PLAYWRIGHT_MODULE_PATH)
  : require("playwright");

const bundle = await build({
  stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
    import { createRoot } from 'react-dom/client';
    import { useState } from 'react';
    import { VoiceDictationButton } from './modules/voice/voice-dictation-button';
    import { StudentAcademicForm } from './modules/profile/student-academic-form';
    function App() {
      const [body, setBody] = useState('Texto final');
      const [title, setTitle] = useState('Título');
      const [locked, setLocked] = useState(false);
      const [render, setRender] = useState(0);
      return <main>
        <textarea id="body" maxLength={40} disabled={locked} value={body} onChange={event => setBody(event.target.value)} />
        <VoiceDictationButton targetId="body" label="Corpo" />
        <input id="title" maxLength={15} value={title} onChange={event => setTitle(event.target.value)} />
        <VoiceDictationButton targetId="title" label="Título" />
        <button onClick={() => setLocked(true)}>Bloquear corpo</button>
        <button onClick={() => setRender(render + 1)}>Rerender {render}</button>
        <StudentAcademicForm initial={{ displayName: 'Ana', university: 'UFF', department: 'Instituto', courseName: 'Física', studyLevels: ['tcc'] }} />
      </main>;
    }
    createRoot(document.getElementById('root')).render(<App />);
  ` },
  bundle: true,
  write: false,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "synthetic-action", setup(plugin) {
    plugin.onResolve({ filter: /^next\/link$/ }, () => ({ path: "next-link", namespace: "mock" }));
    plugin.onResolve({ filter: /^\.\/student-academic-actions$/ }, () => ({ path: "student-action", namespace: "mock" }));
    plugin.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
      contents: args.path === "next-link"
        ? 'export default function Link({children, href}) { return <a href={href}>{children}</a>; }'
        : 'export async function saveStudentAcademicProfile() { await new Promise(resolve => setTimeout(resolve, 10)); return {status:"save_error"}; }',
      loader: "jsx",
      resolveDir: process.cwd(),
    }));
  }}],
});

const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.recognitions = [];
    window.SpeechRecognition = class {
      start() { window.recognitions.push(this); }
      stop() { this.onend?.(); }
    };
  });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "mapa.invalid") return route.abort();
    if (url.pathname === "/bundle.js") return route.fulfill({ contentType: "text/javascript", body: bundle.outputFiles[0].text });
    if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: '<!doctype html><html lang="pt-BR"><div id="root"></div><script src="/bundle.js"></script></html>' });
    return route.abort();
  });
  await page.goto("https://mapa.invalid/");
  const body = page.locator("#body");
  const title = page.locator("#title");
  await body.focus();
  await body.evaluate((field) => field.setSelectionRange(6, 6));
  await body.press("ArrowRight");
  await body.press("ArrowLeft");
  await page.getByRole("button", { name: "Ditar texto: Corpo" }).click();
  await page.evaluate(() => window.recognitions.at(-1).onresult({ results: [{ isFinal: true, 0: { transcript: "novo" } }] }));
  assert.equal(await body.inputValue(), "Texto novo final");
  await page.getByRole("button", { name: /^Rerender/ }).click();
  assert.equal(await body.inputValue(), "Texto novo final", "controlled textarea must retain the transcript");
  await page.getByRole("button", { name: "Parar ditado: Corpo" }).click();

  await body.focus();
  await body.press("End");
  await page.getByRole("button", { name: "Ditar texto: Corpo" }).click();
  await page.evaluate(() => window.recognitions.at(-1).onresult({ results: [{ isFinal: false, 0: { transcript: "com voz" } }] }));
  assert.equal(await body.inputValue(), "Texto novo final", "interim speech should not be inserted twice");
  await page.getByRole("button", { name: "Parar ditado: Corpo" }).click();
  assert.equal(await body.inputValue(), "Texto novo final com voz", "interim-only recognition must be committed when listening ends");
  await page.getByRole("button", { name: /^Rerender/ }).click();
  assert.equal(await body.inputValue(), "Texto novo final com voz", "dictation must update the React state");

  await page.getByRole("button", { name: "Ditar texto: Corpo" }).click();
  await page.evaluate(() => {
    const recognition = window.recognitions.at(-1);
    const result = { results: [{ isFinal: true, 0: { transcript: "confirmado" } }] };
    recognition.onresult(result);
    recognition.onresult(result);
  });
  await page.getByRole("button", { name: "Parar ditado: Corpo" }).click();
  assert.equal(await body.inputValue(), "Texto novo final com voz confirmado", "repeated final results must not duplicate text");

  await title.fill("Título");
  await title.press("End");
  await page.getByRole("button", { name: "Ditar texto: Título" }).click();
  await page.evaluate(() => window.recognitions.at(-1).onresult({ results: [{ isFinal: true, 0: { transcript: "do mapa" } }] }));
  assert.equal(await title.inputValue(), "Título do mapa");
  await page.getByRole("button", { name: /^Rerender/ }).click();
  assert.equal(await title.inputValue(), "Título do mapa", "controlled input must retain the transcript");
  await page.getByRole("button", { name: "Parar ditado: Título" }).click();

  await title.fill("123456789012345");
  await page.getByRole("button", { name: "Ditar texto: Título" }).click();
  await page.evaluate(() => window.recognitions.at(-1).onresult({ results: [{ isFinal: true, 0: { transcript: "excesso" } }] }));
  assert.equal(await title.inputValue(), "123456789012345");
  await page.locator(".voice-dictation").nth(1).getByText(/limite deste campo/).waitFor();
  assert.match(await page.locator(".voice-dictation").nth(1).innerText(), /limite deste campo/);
  await page.getByRole("button", { name: "Parar ditado: Título" }).click();

  await page.getByRole("button", { name: "Ditar texto: Corpo" }).click();
  await page.getByRole("button", { name: "Bloquear corpo" }).click();
  await page.evaluate(() => window.recognitions.at(-1).onresult({ results: [{ isFinal: true, 0: { transcript: "não entra" } }] }));
  assert.equal(await body.inputValue(), "Texto novo final com voz confirmado");

  await page.getByLabel("Universidade ou instituição").fill("Universidade editada");
  await page.getByRole("button", { name: "Salvar dados" }).click();
  await page.getByText(/Seus dados continuam aqui/).waitFor();
  assert.equal(await page.getByLabel("Universidade ou instituição").inputValue(), "Universidade editada");
  assert.deepEqual(errors, []);
  console.log("PASS: ditado final e parcial em textarea/input, estado React, sem duplicatas, cursor, limite, campo bloqueado e cadastro preservado após erro; nenhuma requisição externa.");
} finally {
  await browser.close();
}
