import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { ESLint } from 'eslint';

const require = createRequire(import.meta.url);
const pluginPath = require.resolve('@next/eslint-plugin-next');
const pluginRequire = createRequire(pluginPath);
const { globSync } = pluginRequire('fast-glob');
const { getRootDirs } = require(join(dirname(pluginPath), 'utils/get-root-dirs.js'));

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'mapa-lint-roots-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ['apps/web/pages', 'apps/admin/pages', 'dir with spaces', '.hidden']) {
    mkdirSync(join(root, dir), { recursive: true });
  }
  writeFileSync(join(root, 'apps/file.txt'), 'fixture');
  writeFileSync(join(root, 'apps/web/pages/index.tsx'), 'export default function Page() { return null; }');
  symlinkSync(join(root, 'apps/web'), join(root, 'linked-web'), 'dir');
  return root;
}

test('Next 16.4.2 uses only the supported directory glob contract; vulnerable chain absent', () => {
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url)));
  assert.equal(lock.packages['node_modules/@next/eslint-plugin-next'].version, '16.4.2', 'Revalidate the adapter when upgrading Next lint');
  assert.equal(lock.packages['tools/next-root-glob'].dependencies.glob, '13.0.6');
  for (const path of Object.keys(lock.packages)) assert.ok(!/node_modules\/(braces|micromatch)$/.test(path));
  assert.match(pluginRequire.resolve('fast-glob'), /tools\/next-root-glob\/index\.cjs$/);
  const usage = readFileSync(join(dirname(pluginPath), 'utils/get-root-dirs.js'), 'utf8');
  assert.match(usage, /onlyDirectories: true/);
});

test('directory roots preserve literals, braces, globstars, extglobs, spaces, symlinks and arrays', (t) => {
  const root = fixture(t);
  const cases = [
    [root, [root]],
    [`${root}/apps/*`, [`${root}/apps/admin`, `${root}/apps/web`]],
    [`${root}/apps/{web,admin}`, [`${root}/apps/admin`, `${root}/apps/web`]],
    [`${root}/apps/**/pages`, [`${root}/apps/admin/pages`, `${root}/apps/web/pages`]],
    [`${root}/apps/@(web|admin)`, [`${root}/apps/admin`, `${root}/apps/web`]],
    [`${root}/missing/*`, []],
    [`${root}/dir with spaces`, [`${root}/dir with spaces`]],
    [`${root}/linked-*`, [`${root}/linked-web`]],
  ];
  for (const [pattern, expected] of cases) assert.deepEqual(globSync(pattern, { onlyDirectories: true }).sort(), expected.sort());
  const rel = relative(process.cwd(), `${root}/apps/*`);
  assert.deepEqual(globSync(rel, { onlyDirectories: true }).sort(), ['admin','web'].map(x=>relative(process.cwd(),`${root}/apps/${x}`)));
  assert.deepEqual(getRootDirs({ cwd: root, settings: {} }), [root]);
  assert.deepEqual(getRootDirs({ cwd: root, settings: { next: { rootDir: [`${root}/apps/web`,`${root}/apps/admin`,null] } } }).sort(), [`${root}/apps/admin`,`${root}/apps/web`]);
});

test('deep or unexpected configuration fails explicitly before glob parsing', () => {
  assert.throws(() => globSync('{'.repeat(1000)+'x'+'}'.repeat(1000), { onlyDirectories: true }), /too deeply nested/);
  assert.throws(() => globSync('x'.repeat(4097), { onlyDirectories: true }), /too long/);
  assert.throws(() => globSync('*', { onlyFiles: true }), /Unsupported/);
  assert.throws(() => globSync('*', { onlyDirectories: true, dot: true }), /Unsupported/);
});

test('Next lint still detects invalid internal links using configured monorepo roots', async (t) => {
  const root = fixture(t);
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: [{
    plugins: { '@next/next': require('@next/eslint-plugin-next') },
    settings: { next: { rootDir: `${root}/apps/{web,admin}` } },
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { '@next/next/no-html-link-for-pages': 'error' },
  }] });
  const [bad] = await eslint.lintText('const view = <a href="/">Home</a>;', { filePath: 'fixture.js' });
  assert.ok(bad.messages.some(x => x.ruleId === '@next/next/no-html-link-for-pages'));
  const [good] = await eslint.lintText('const view = <a href="https://example.org">External</a>;', { filePath: 'fixture.js' });
  assert.equal(good.errorCount, 0);
});
