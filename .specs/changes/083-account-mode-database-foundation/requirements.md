# Requisitos

- Começar por preflight remoto de migrations, schema, policies e advisors.
- Não consultar nem registrar e-mails ou conteúdo acadêmico; usar só agregados.
- Manter `user_profiles.active_role` e acrescentar `role_version` positivo e
  `role_changed_at`.
- Preservar o modo atual de todas as contas durante o backfill.
- Acrescentar `projects.authoring_role` com domínio `student|advisor`, preencher
  projetos existentes pelo perfil imutável atual do proprietário e torná-lo
  obrigatório e imutável antes de liberar a troca de modo.
- Derivar `authoring_role` no banco a partir do perfil ativo do proprietário
  durante o INSERT; nunca confiar em valor enviado pelo cliente.
- Interromper a migration se houver proprietário sem perfil, papel inválido ou
  outra ambiguidade que impeça um backfill determinístico.
- Criar trilha append-only `user_profile_role_events`, sem PII e sem acesso
  direto de `anon` ou `authenticated`.
- Auditar INSERT/UPDATE de perfil por trigger, inclusive primeira escolha.
- Preparar RPC de troca atômica com versão esperada, idempotência e validação de
  `auth.uid()`, mas manter seu EXECUTE revogado até a C87.
- Não reabrir UPDATE direto em `user_profiles`.
- Projetos `authoring_role=advisor` são autônomos e não podem receber
  `advisor_id` ou `advisor_email`; inconsistências históricas exigem
  reconciliação explícita antes da constraint.
- Declarar explicitamente grants/revokes da nova tabela conforme o comportamento
  atual do Data API do Supabase.
- Atualizar os tipos TypeScript gerados/validados.
