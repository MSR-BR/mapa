# Tarefa executável — Mapa e mudança de privilégios do Supabase

> Documento histórico do pedido de 24/09, preservado no fechamento documental de 06/10. A preparação e o rollout correspondentes foram executados nas [C103](.specs/changes/103-supabase-explicit-grants-readiness/validation.md) e [C104](.specs/changes/104-supabase-explicit-grants-remote-rollout/cpd-2026-09-24.md). Este registro não solicita nova execução nem novas permissões. Para o estado vigente, consultar o [estado do projeto](.specs/project-state.md) e as migrations posteriores.

Execute esta tarefa dentro do repositório **Mapa**. Este arquivo descreve o objetivo do proprietário; confirme cada constatação no código atual antes de editar.

## Objetivo

Comprovar que o Mapa está preparado para a mudança de privilégios padrão do Supabase de 30 de outubro de 2026 e impedir regressões, sem criar uma migração desnecessária.

## Estado encontrado em 2026-09-24

- O navegador e o servidor usam chave publicável/JWT do usuário; não foi encontrado uso normal de `service_role` na aplicação.
- As tabelas públicas identificadas já possuem revogações e privilégios explícitos compatíveis com o uso, incluindo `projects`, `generation_jobs`, `research_structures`, `research_workflows`, `user_profiles`, `legal_consents`, `bug_reports` e `user_profile_role_events`.
- Funções sensíveis também têm endurecimento explícito de `EXECUTE`.
- Os IDs são UUIDs; não foi identificada dependência de sequência de identidade nas tabelas auditadas.
- O projeto já possui uma suíte rica de validação Supabase e segurança.
- O repositório estava limpo no momento da triagem.

## Trabalho obrigatório

1. Leia `AGENTS.md`, `README.md`, o estado do projeto, as migrações, `.codex/config.toml` e os scripts de verificação. Consulte a versão atual do Pó Mágico.
2. Faça uma matriz completa de objetos expostos: objeto, consumidor, papel, operação, RLS/policy, privilégio e migração correspondente.
3. Confirme que cada tabela, view, função e sequência exposta tem decisão explícita. Se a matriz confirmar o estado acima, **não crie uma migração corretiva vazia ou redundante**.
4. Acrescente ou aprimore uma verificação estática que falhe quando uma futura migração criar objeto exposto sem `REVOKE`/`GRANT` intencional ou justificativa documentada. Integre-a ao fluxo de segurança/check sem tornar o desenvolvimento cotidiano perceptivelmente lento; prefira checagem estática rápida no `check` e validação de banco mais pesada no gate de release.
5. Rode, conforme suportado pelo ambiente, `npm run security:audit`, `npm run supabase:verify-migration-local`, `npm run supabase:verify-rls`, `npm run supabase:verify-authenticated-rls` e `npm run check`. Não use o remoto sem autorização e não altere dados reais.
6. Antes de 30 de outubro, deixe documentada uma inspeção manual do painel: Data API/Integrations, schemas expostos e Security Advisor. Optar antecipadamente pelo novo comportamento é opcional e só pode ocorrer após teste em ambiente descartável e aprovação do proprietário.
7. Se a auditoria atual encontrar uma lacuna nova, crie uma Change e uma nova migração mínima. Caso contrário, entregue apenas verificação automatizada e relatório de evidência.

## Critérios de aceitação

- Há evidência reproduzível de que uma instalação nova não depende de privilégios automáticos antigos.
- O `check` rápido detecta regressões sem deixar o projeto lento.
- Testes pesados de banco ficam no gate apropriado, não em cada interação local.
- Nenhuma permissão ampla ou migração redundante é adicionada.
- Qualquer ação no painel ou banco remoto permanece separada e depende de autorização explícita.

## Referências oficiais

- https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
- https://supabase.com/docs/guides/api/securing-your-api
