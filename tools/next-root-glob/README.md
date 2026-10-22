# Next ESLint directory glob adapter (C128)

Private, development-only replacement for the single call used by
`@next/eslint-plugin-next@16.4.2`: `globSync(pattern, { onlyDirectories: true })`.
It uses `glob@13.0.6`, not `fast-glob`, `micromatch` or `braces`. The npm dependency
key stays `fast-glob` solely because that is what the upstream plugin requires;
the package identifies itself as `@mapa/next-root-glob`. It is not a fork with a
renamed vulnerable implementation and is not a general fast-glob API shim.

The root dev dependency plus scoped `$fast-glob` override is necessary for npm
to resolve the local file consistently. Include this folder in any future
source/release package. `npm ci --ignore-scripts` has been verified in an empty
temporary directory with this folder and the exact lockfile.

The adapter preserves the directory contracts tested in
`tests/next-root-glob.test.mjs`: literals, absolute/relative paths, brace
alternatives, globstars, extglobs, spaces, symlinks and multiple Next root settings.
It rejects unexpected options, patterns longer than 4096 characters and nesting
over 32 levels. These are developer configuration errors; no user map is affected.
Only the CommonJS import lint rule is excepted inside this CommonJS adapter;
Next, React, accessibility and TypeScript lint rules stay enabled.

On a Next ESLint upgrade, recheck every use of `fast-glob` in the new plugin and
rerun compatibility tests. The test intentionally requires plugin 16.4.2 so a
version change cannot silently widen the supported API. Prefer removing this
adapter when upstream no longer depends on the affected chain; do not restore
braces <=3.0.3 merely to remove the override.

Sources checked 2026-10-22:
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- https://github.com/isaacs/node-glob
