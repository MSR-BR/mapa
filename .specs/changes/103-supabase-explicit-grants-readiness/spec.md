# C103 — Prontidão para grants explícitos do Supabase

## Status

Concluída localmente em 24/09/2026. Nenhuma consulta, migration, grant, policy
ou alteração foi executada no Supabase remoto; a C104 permanece bloqueada.

## Contexto

Em 30/10/2026, projetos Supabase existentes deixam de conceder automaticamente
privilégios de Data API a novos objetos. Grants de objeto e RLS são camadas
independentes: a primeira permite alcançar tabela ou função; a segunda limita
linhas e operações. O pacote `SUPABASE-EXPLICIT-GRANTS-2026-10-30.md` foi tratado
como entrada da Change, não como instrução autônoma.

## Objetivo

Provar que o estado versionado do banco é reproduzível sem depender dos antigos
privilégios automáticos e impedir que novas tabelas, views, funções ou sequences
expostas sejam adicionadas sem decisão explícita de acesso.

## Escopo

1. Inventariar todos os objetos próprios nos schemas `public` e `private`.
2. Registrar consumidor, papel, operação, RLS/policy, privilégio e migration.
3. Validar o estado final das migrations por manifesto versionado.
4. Integrar um verificador estático rápido ao `npm run check`.
5. Criar um gate pesado em PostgreSQL 17 descartável, sem conexão remota.
6. Documentar a inspeção manual e o rollout remoto como C104 separada.

## Decisão sobre migration

Não criar migration na C103 enquanto o inventário confirmar:

- oito tabelas públicas com RLS e privilégios intencionais;
- nenhuma view ou sequence própria;
- funções de API com `EXECUTE` mínimo;
- funções de trigger sem `EXECUTE` para `anon` ou `authenticated`;
- funções `SECURITY DEFINER` com `search_path` fixado.

Uma divergência comprovada deve abrir uma nova revisão desta Change e produzir a
menor migration corretiva possível. Não serão reescritas migrations aplicadas.

## Fora do escopo

- Conectar, consultar ou alterar o projeto Supabase remoto.
- Fazer opt-in antecipado da mudança de privilégios.
- Aplicar SQL, grants, RLS, policies, funções ou migrations em produção.
- Alterar Auth, usuários de teste, dados existentes ou segredos.
- Executar os verificadores remotos `supabase:verify-rls` e
  `supabase:verify-authenticated-rls` sem autorização específica.

## Critérios de aceite

- O manifesto cobre toda tabela, view, função e sequence própria encontrada.
- Nova migration com objeto não declarado faz o verificador rápido falhar.
- Alteração de grants, RLS, `SECURITY DEFINER` ou `search_path` faz o verificador
  falhar quando divergir do contrato.
- `npm run check` inclui a verificação estática.
- `npm run supabase:release-gate` aplica todas as migrations em PostgreSQL 17
  descartável e comprova privilégios efetivos com `has_*_privilege`.
- Nenhuma migration redundante é criada quando o estado atual passa.
- A inspeção do Dashboard, o estado remoto e o E2E autenticado permanecem
  explicitamente bloqueados para a C104.

## Riscos e limites

- A prova local não confirma drift do banco remoto.
- Objetos gerenciados pelo Supabase, como `storage.objects`, não são de
  propriedade desta aplicação; somente suas policies e o bucket privado são
  inventariados como dependências externas.
- O papel `service_role` não é usado pelo fluxo normal da aplicação. Seu uso
  explícito permanece limitado à leitura da trilha de troca de perfil.

## Rollback

A C103 altera somente verificadores, manifesto e documentação. O rollback é a
reversão desses arquivos; não existe rollback de banco porque não há mutação
local persistente nem remota.

## Gate de rollout

A C104 só pode começar após aprovação da C103 e autorização específica para o
projeto remoto exato. Ela deverá comparar migration history, privilégios
efetivos, RLS, funções, Security Advisor e comportamento autenticado/negado.

## Resultado

O inventário e o PostgreSQL descartável confirmaram que o estado atual já é
compatível com grants explícitos. Nenhuma migration foi criada. O manifesto,
os verificadores e a evidência estão versionados nesta Change.
