# Validação

- Comparação de migrations remotas/locais antes da DDL.
- PostgreSQL 17 isolado com cenário válido, reconciliação histórica e rollback.
- Queries agregadas pré/pós-migration, sem e-mail ou conteúdo acadêmico.
- Tentativas de criar projeto com autoria falsificada e de alterar
  `authoring_role` após o INSERT.
- Testes de projeto criado como Aluno e como Orientador.
- Grants, revokes, RLS, UPDATE direto de perfil e EXECUTE prematuro da RPC.
- Supabase Security e Performance Advisors.
- `npm run check`, `git diff --check`, smokes Supabase, E2E e domínio público.

## Resultado de 16/09/2026

- `npm run supabase:verify-account-mode-foundation`: aprovado em PostgreSQL
  `17-alpine`, inclusive reconciliação e rollback do cenário inválido.
- `npm run check`: aprovado — lint, tipos, 97 testes, exportações e build.
- `git diff --check`: aprovado.
- Preflight remoto: 13 migrations, última
  `20260911190000 lock_user_profile_role`; nenhuma aplicação parcial da C83.
- Migration remota: `20260916163351 account_mode_database_foundation`, aplicada
  e registrada atomicamente.
- Postflight remoto: 13 perfis versionados, 13 eventos-base, 65 projetos, 50 de
  Orientador, 15 de Aluno, zero autoria ausente e zero projeto de Orientador
  supervisionado; a única supervisão externa histórica foi preservada.
- Grants e RLS: eventos sem acesso de `anon`/`authenticated`; `service_role`
  com SELECT; UPDATE direto de perfil e EXECUTE da RPC continuam revogados.
- Security Advisor: 0 erros; 3 avisos preexistentes.
- Performance Advisor: 0 erros; 6 avisos preexistentes em policies de
  `projects` e `research_workflows`.
- `npm run supabase:verify`, `npm run supabase:verify-rls`,
  `npm run security:audit` e `npm run supabase:verify-advisor-student`:
  aprovados.
- O runner genérico `supabase:verify-authenticated-rls` não iniciou por ausência
  de `TEST_USER_A/B`; o E2E real configurado entre Aluno e Orientador passou e
  removeu o projeto temporário.
- `https://mapadapesquisa.com.br`: HTTP 200; `/api/health`: `status=ok`.
- CPD: commit `6702f70`, push aprovado e deployment
  `dpl_xKYU68AYP9bQJABUyot7TbjFz4AT` confirmado como `Ready` em produção.
