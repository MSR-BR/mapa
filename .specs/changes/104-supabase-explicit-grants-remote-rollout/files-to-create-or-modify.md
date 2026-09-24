# Arquivos

## Criados

- `.specs/changes/104-supabase-explicit-grants-remote-rollout/*`
- `.specs/changes/104-supabase-explicit-grants-remote-rollout/remote-audit.sql`

## Modificados no fechamento

- `.specs/roadmap.md`
- `.specs/project-state.md`
- `.specs/security/profile.md`

## Condicional

- `supabase/migrations/20260924222657_c104_reduce_legacy_explicit_grants.sql`,
  criada porque a inspeção remota provou privilégios excedentes.
- `supabase/explicit-access-manifest.json`.
- `scripts/verify-explicit-grants.mjs`, os stubs/gates PostgreSQL e o teste de
  regressão de defaults legados.
- Verificador remoto somente se for necessário substituir o runner legado por
  senha sem enfraquecer a autenticação Google-only.

O arquivo `SUPABASE-EXPLICIT-GRANTS-2026-10-30.md` permanece intacto e fora do
commit.
