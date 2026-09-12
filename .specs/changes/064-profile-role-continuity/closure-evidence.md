# Evidências de implementação — Change 064

## Entrega local

- O primeiro papel selecionado é persistido sem permitir troca posterior pela
  interface ou pela Server Action.
- O menu da conta informa a área configurada e não oferece mudança de papel.
- A nova migration remove `UPDATE` de `user_profiles` para usuários
  autenticados e remove a policy de atualização correspondente.
- A área de revisão usa linguagem neutra: não exibe “Modo orientador”,
  “Validar como orientador” ou “Comentários do orientador”.
- Informações de vínculo do orientador permanecem apenas no fluxo do estudante,
  onde são necessárias para conectar o projeto à conta de revisão.

## CPD local

- **Check:** contratos de perfil e linguagem atualizados em
  `tests/foundation.test.mjs`.
- **Persist:** migration criada em
  `supabase/migrations/20260911190000_lock_user_profile_role.sql`.
- **Deploy/document:** `npm run check` aprovado em 11/09/2026: lint,
  typecheck, 78 testes, verificação de exportações e build.

## Publicação e verificação remota

- Migration `20260911190000_lock_user_profile_role.sql` aplicada no projeto
  Supabase vinculado em 11/09/2026.
- O histórico remoto confirma a migration como aplicada.
- Consulta de verificação confirmou:
  - `authenticated_can_update_profile = false`;
  - `update_policy_exists = false`.
- `supabase db advisors --linked --type security --fail-on none` foi executado
  sem findings retornados.

## Deploy

- Produção publicada em 11/09/2026.
- Deployment: `dpl_DByeKxqkkhPdgtbZbgZHAsGj9SoL`.
- URL de produção: `https://mapadapesquisa.com.br`.
- Smoke test via Vercel em `/api/health` retornou `status: ok`, com Supabase,
  Gemini, Resend e Research Starter configurados.

A Change 064 está concluída.
