# Matriz de objetos e acesso — C103

## Escopo e decisão

Inventário obtido das 18 migrations versionadas, em ordem cronológica. O estado
final é completo sem migration adicional: oito tabelas públicas, doze funções
próprias, nenhuma view e nenhuma sequence. IDs são UUID com
`gen_random_uuid()`; não há `serial`, `bigserial` ou identity.

Grants e RLS são controles complementares. O manifesto executável canônico é
`supabase/explicit-access-manifest.json`; esta matriz explica a intenção humana.

## Tabelas públicas

| Objeto | Consumidor e operações | RLS/policies finais | Decisão de privilégio | Fonte final |
|---|---|---|---|---|
| `public.projects` | proprietário autenticado no modo de autoria; orientador vinculado lê projeto estudantil | RLS; own SELECT/INSERT/UPDATE/DELETE + advised SELECT | `anon`: nenhum; `authenticated`: SELECT, INSERT, DELETE e UPDATE somente em colunas não sensíveis | `20260917003928_c087_harden_mode_aware_rls.sql` |
| `public.generation_jobs` | proprietário autenticado no modo ativo | RLS; own CRUD | `anon`: nenhum; `authenticated`: CRUD | `20260917003928_c087_harden_mode_aware_rls.sql` |
| `public.research_structures` | proprietário autenticado no modo ativo | RLS; own CRUD | `anon`: nenhum; `authenticated`: CRUD | `20260917003928_c087_harden_mode_aware_rls.sql` |
| `public.research_workflows` | proprietário no modo de autoria; orientador vinculado com trigger de campos permitidos | RLS; own CRUD + advised SELECT/UPDATE | `anon`: nenhum; `authenticated`: CRUD, limitado por policies e triggers | `20260917003928_c087_harden_mode_aware_rls.sql` |
| `public.user_profiles` | titular autenticado; troca de modo somente por RPC | RLS; own SELECT/INSERT | `anon`: nenhum; `authenticated`: SELECT/INSERT; UPDATE/DELETE revogados | `20260917003928_c087_harden_mode_aware_rls.sql` |
| `public.legal_consents` | titular autenticado no modo ativo | RLS; own SELECT/INSERT/UPDATE por papel | `anon`: nenhum; `authenticated`: SELECT/INSERT/UPDATE | `20260917003928_c087_harden_mode_aware_rls.sql` |
| `public.bug_reports` | envio anônimo/autenticado; leitura do remetente; triagem autorizada | RLS; dois INSERTs, SELECT remetente/admin, UPDATE admin | `anon`: INSERT; `authenticated`: SELECT/INSERT/UPDATE | `20260821153000_create_bug_reports.sql` |
| `public.user_profile_role_events` | triggers de auditoria; leitura operacional privilegiada | RLS sem policy de cliente | `public`/`anon`/`authenticated`: nenhum; `service_role`: SELECT | `20260917003928_c087_harden_mode_aware_rls.sql` |

O fluxo normal da aplicação usa a publishable key e o JWT do usuário. Ele não
usa `service_role`; a exceção acima é um contrato operacional explícito e não
uma dependência do navegador.

## Funções

| Função | Consumidor | Segurança | `EXECUTE` final | Fonte final |
|---|---|---|---|---|
| `public.set_project_advisor(uuid,text)` | Aluno autenticado | definer; `search_path=''`; checagem de modo/propriedade | somente `authenticated` | `20260917003928_c087_harden_mode_aware_rls.sql` |
| `public.claim_pending_advisor_projects()` | Orientador autenticado | definer; `search_path=''`; checagem de modo/e-mail | somente `authenticated` | mesma |
| `public.switch_active_role(text,bigint,uuid)` | titular autenticado | definer; `search_path=''`; versão e idempotência | somente `authenticated` | mesma |
| `public.is_bug_report_admin()` | policies de triagem | invoker; caminho fixo | somente `authenticated` | `20260823120000_harden_bug_report_admin_search_path.sql` |
| `private.current_active_role()` | policies RLS | definer; schema não exposto; `search_path=''` | somente `authenticated` | `20260917003928_c087_harden_mode_aware_rls.sql` |
| `private.project_owned_in_active_mode(uuid,uuid)` | policies RLS | definer; schema não exposto; `search_path=''` | somente `authenticated` | mesma |
| `private.project_reviewable_by_active_advisor(uuid,uuid)` | policies RLS | definer; schema não exposto; `search_path=''` | somente `authenticated` | mesma |
| `public.enforce_user_profile_role_version()` | trigger | invoker; `search_path=''` | nenhum cliente | `20260916163351_account_mode_database_foundation.sql` |
| `public.audit_user_profile_role_change()` | trigger | definer; `search_path=''` | nenhum cliente | mesma |
| `public.enforce_project_authoring_role()` | trigger | invoker; `search_path=''` | nenhum cliente | mesma |
| `public.restrict_advisor_workflow_update()` | trigger | definer; `search_path=''` | nenhum cliente | `20260917003928_c087_harden_mode_aware_rls.sql` |
| `public.enforce_student_advisor_workflow_progress()` | trigger | definer; `search_path=''` | nenhum cliente | `20260919123000_c089_require_student_advisor_approval.sql` |

## Views, sequences e dependências gerenciadas

- Views próprias: nenhuma.
- Sequences próprias: nenhuma.
- `storage.objects` e `storage.buckets`: objetos gerenciados pelo Supabase. A
  aplicação cria somente o bucket privado `bug-report-attachments` e três
  policies restritas a esse bucket.
- Schema `private`: `PUBLIC` e `anon` sem acesso; `authenticated` recebe USAGE e
  EXECUTE somente nas três helpers exigidas pelas policies.

## Proteção contra regressão

- `npm run supabase:verify-explicit-grants`: compara o estado final das
  migrations com o manifesto e falha para objeto não declarado, grants amplos,
  RLS/policies divergentes, função definer sem caminho seguro ou EXECUTE fora do
  contrato.
- `npm run check`: inclui o verificador rápido.
- `npm run supabase:release-gate`: executa o verificador rápido e aplica todas
  as migrations em PostgreSQL 17 descartável; consulta privilégios efetivos por
  `has_table_privilege`, `has_column_privilege` e `has_function_privilege`.

## Inspeção manual antes de 30/10/2026 — C104

Esta lista é deliberadamente remota e não foi executada na C103:

1. Confirmar organização, projeto e ref `aeaweherkrqmlqnxsmib` antes de qualquer leitura privilegiada.
2. Em **Database > Migrations**, comparar a lista remota com as 18 migrations locais.
3. Em **Data API / API Settings**, confirmar os schemas expostos; `private` não deve estar exposto.
4. Em **Table Editor / Database**, conferir RLS ativa nas oito tabelas e ausência de views/sequences próprias.
5. Conferir ACLs efetivas de `anon`, `authenticated`, `service_role` e `PUBLIC` para cada objeto da matriz.
6. Em **Security Advisor**, classificar erros como bloqueantes e justificar warnings intencionais.
7. Executar os smokes anônimo e autenticado com contas reversíveis; restaurar papéis e remover registros temporários.
8. Considerar opt-in antecipado somente em ambiente descartável e mediante nova autorização do responsável.

## Referências oficiais

- [Supabase Changelog: mudança de exposição automática em 30/10/2026](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).
- [Segurança da Data API](https://supabase.com/docs/guides/api/securing-your-api),
  [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e
  [funções de banco](https://supabase.com/docs/guides/database/functions).
