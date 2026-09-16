# Arquivos previstos

- Nova migration em `supabase/migrations/`.
- `lib/supabase/database.types.ts`.
- `scripts/verify-migration-local.sh` ou novo verificador SQL específico.
- `tests/foundation.test.mjs` e testes de autoria de projeto.
- Documentação e evidências da C83.

Não modificar páginas, ações de produto, policies de projetos ou feature flags.

## Arquivos efetivamente preparados

- `supabase/migrations/20260916163351_account_mode_database_foundation.sql`
- `lib/supabase/database.types.ts`
- `scripts/verify-account-mode-foundation.sh`
- `scripts/verify-account-mode-foundation-fixture.sql`
- `scripts/verify-account-mode-foundation.sql`
- `tests/foundation.test.mjs`
- Duas projeções internas de projeto e o fixture tipado de descoberta, apenas
  para incluir `authoring_role`; nenhuma regra de produto foi alterada.
- Evidências e estado da Change, incluindo `implementation-evidence.md` e
  `closure-evidence.md`.
