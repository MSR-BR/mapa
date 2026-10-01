# Arquivos

- `modules/research-workflow/doi-reference.ts`: contrato, normalização, preservação e identidade de DOI.
- `modules/research-workflow/doi-lookup.ts`: consulta server-only, mapeamento, limites, timeout e cache público.
- `app/api/projects/[id]/references/doi/route.ts`: endpoint autenticado e limitado.
- `modules/research-workflow/manual-reference-panel.tsx`, `app/globals.css`: formulário e diálogo acessível.
- `app/api/projects/[id]/references/route.ts`, `modules/research-workflow/schema.ts`: validação e persistência compatível.
- `tests/doi-reference.test.ts`, `scripts/verify-doi-ui.mjs`, `package.json`: regressões.
- `package-lock.json`: patches de segurança identificados pelo gate.
- `lib/app-version.ts`, `.env.example`: release pública `v01102026.1`.
- `.specs/changes/105-doi-reference-autofill/*`, `.specs/roadmap.md`, `.specs/project-state.md`, `.specs/security/profile.md`: documentação e evidências.

Nenhuma migration, credencial, regra RLS ou configuração OAuth é alterada.
