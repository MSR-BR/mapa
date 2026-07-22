import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("keeps the branded foundation and locale in the App Router", async () => {
  const [layout, page] = await Promise.all([
    readProjectFile("app/layout.tsx"),
    readProjectFile("app/page.tsx"),
  ]);

  assert.match(layout, /<html lang="pt-BR"/);
  assert.match(layout, /title: "Mapa da Pesquisa"/);
  assert.match(page, /Fundação técnica pronta para evoluir/);
  assert.match(page, /Change 001/);
});

test("defines an uncached health endpoint", async () => {
  const route = await readProjectFile("app/api/health/route.ts");

  assert.match(route, /export function GET/);
  assert.match(route, /status: "ok"/);
  assert.match(route, /"Cache-Control": "no-store"/);
});

test("uses the standard Next.js runtime expected by Vercel", async () => {
  const manifest = JSON.parse(await readProjectFile("package.json"));

  assert.equal(manifest.scripts.dev, "next dev");
  assert.equal(manifest.scripts.build, "next build");
  assert.equal(manifest.scripts.start, "next start");
  assert.equal(manifest.dependencies.vinext, undefined);
  assert.equal(manifest.devDependencies?.wrangler, undefined);
});

test("pins Supabase to the Mapa project and requires a publishable key", async () => {
  const [config, environment] = await Promise.all([
    readProjectFile("lib/supabase/config.ts"),
    readProjectFile(".env.example"),
  ]);

  assert.match(config, /aeaweherkrqmlqnxsmib/);
  assert.match(config, /sb_publishable_/);
  assert.doesNotMatch(
    environment,
    /^(?:SUPABASE_SERVICE_ROLE_KEY|.*=sb_secret_)/m,
  );
  assert.match(environment, /NEXT_PUBLIC_SUPABASE_PROJECT_REF=aeaweherkrqmlqnxsmib/);
});
