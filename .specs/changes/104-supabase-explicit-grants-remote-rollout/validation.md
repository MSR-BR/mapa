# Validação — C104

## Estado inicial

Em execução em 24/09/2026. Autorização específica recebida para validar e, se
estritamente necessário, corrigir o projeto Supabase
`aeaweherkrqmlqnxsmib`. Nenhuma autorização foi estendida a Vercel, DNS ou
outros provedores.

## Evidências a registrar

- candidato e destino;
- migration history;
- schemas expostos e inventário de objetos;
- ACLs, RLS, policies, funções e privilégios padrão;
- Security Advisor;
- smokes anônimo e autenticado;
- limpeza e readback pós-teste;
- decisão final do release gate.

## Preflight remoto somente leitura

- Conta Supabase autenticada com acesso à organização `ygmzwfatdbyxvpbuusmy`.
- Projeto confirmado: `mapa-da-pesquisa`, ref `aeaweherkrqmlqnxsmib`, região
  `sa-east-1`, PostgreSQL 17.6 e estado `ACTIVE_HEALTHY`.
- As 18 migrations remotas anteriores à C104 coincidiram integralmente com as
  18 migrations locais do commit-base `cee54c7`.
- Data API: `private` recusado com HTTP 406 / `PGRST106`; `public` permanece a
  superfície usada pelo app.
- Inventário: oito tabelas com RLS, 28 policies, doze funções, zero
  views/sequences próprias, bucket privado e três policies de Storage.
- Smoke anônimo: `projects` e `research_workflows` recusados com `42501`.
- Security Advisor: zero erros; três warnings intencionais para RPCs
  `SECURITY DEFINER` autenticadas e um warning de senha vazada não aplicável ao
  fluxo público Google-only.

## Divergência encontrada

Os defaults legados deixaram privilégios além do manifesto:

- `authenticated`: `TRUNCATE`, `TRIGGER` e `REFERENCES` em tabelas próprias;
- `service_role`: acesso amplo a tabelas que não são usadas pelo app;
- `service_role`: `EXECUTE` em funções internas sem consumidor declarado.

RLS não cobre `TRUNCATE`, e grants e policies são controles independentes. O
achado é uma lacuna real de menor privilégio, embora a Data API comum não
exponha uma operação de `TRUNCATE`.

## Correção local validada

- Migration criada pela CLI:
  `20260924222657_c104_reduce_legacy_explicit_grants.sql`.
- A migration revoga todos os privilégios dos objetos próprios e recompõe
  somente os acessos do manifesto. Não altera dados, RLS, Auth, Data API nem
  defaults globais para objetos futuros.
- O verificador estático agora parte dos defaults legados e recusa privilégios
  excedentes; teste de regressão dedicado incluído.
- `npm run supabase:release-gate`: 19 migrations aprovadas em PostgreSQL 17.
- Gates de modo e aprovação Aluno/Orientador aprovados após a migration.
- `npm run check`: lint, tipos, 141/141 testes, PDF/DOCX e build aprovados.
- `npm run security:gate`: `PASS_WITH_ACCEPTED_RISK`, zero vulnerabilidades.

## Rollout autorizado em produção

- Autorização exata recebida para o commit `26ac954`, a migration
  `20260924222657_c104_reduce_legacy_explicit_grants.sql` e o projeto
  `aeaweherkrqmlqnxsmib`.
- Preflight confirmou `HEAD=26ac9548643c635a97128b8aca7c4635c24ae0ef`,
  SHA-256
  `2ec9765710c696b9be3517eb1748f3f7d02be82f8c06fd8a5a2d1ecf5e08d470`,
  projeto vinculado saudável e somente a C104 pendente.
- O dry-run listou exclusivamente a C104. O push foi executado com Vault,
  seeds e roles fora do escopo.
- O histórico remoto passou de 18 para 19 migrations e ficou integralmente
  alinhado ao repositório.
- O readback confirmou oito tabelas com RLS, 28 policies, doze funções, zero
  views/sequences próprias, grants de tabela mínimos, `service_role` restrito
  à leitura de eventos de papel e nenhum `EXECUTE` próprio para `anon` ou
  `service_role`.
- O smoke anônimo, `supabase:verify`, `supabase:verify-rls`,
  `supabase:verify-explicit-grants` e `supabase:release-gate` passaram após a
  aplicação.
- A reconsulta do Security Advisor pelo conector não foi autorizada pelo
  provedor. A leitura imediatamente anterior ao push permanece como evidência:
  zero erros e quatro warnings já classificados.

## Fixture autenticada e limpeza

O runner reversível foi iniciado após a autorização, mas a primeira
autenticação foi recusada com HTTP 422. O código autentica as duas contas antes
de ler perfis, trocar modos ou criar projetos; portanto a falha ocorreu antes
de qualquer mutação e não houve fixture para remover nem estado para restaurar.
O motivo é a incompatibilidade do runner legado por senha com o login público
Google-only definido na C92. Email/senha não foi reativado e não houve contorno
por `service_role` ou credencial administrativa.

## Decisão do release gate

`PASS_WITH_ACCEPTED_RISK` para a migration C104 aplicada em produção. O artefato
exato, o destino, o histórico, as ACLs e os gates do banco foram comprovados; a
aplicação não alterou dados, Auth, Vercel, DNS, Vault ou defaults globais. A
C104 permanece parcialmente aberta apenas para uma prova autenticada
pós-migration por mecanismo compatível com Google OAuth. Até essa prova, não se
declara o E2E remoto autenticado como aprovado.
