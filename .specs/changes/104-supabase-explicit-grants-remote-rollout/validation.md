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

## Limite de autoridade e decisão

`BLOCKED` para mutação de produção. O executor recusou o runner autenticado
porque ele troca modos e cria/remove fixtures remotas; não foi feita tentativa
de contorno. A migration também não foi aplicada. É necessária autorização
explícita para o arquivo e o projeto exatos, seguida por readback e E2E
reversível. Nenhum dado, Auth provider, DNS, Vercel ou configuração global foi
alterado nesta fase.
