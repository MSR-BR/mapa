# Evidência de implementação — Change 087

## Implementação e validação local

- Duas migrations de rollout foram criadas: liberação mínima da RPC e
  endurecimento de RLS, funções, privilégios e trigger.
- Helpers internos usam schema privado, identidade da sessão e `search_path`
  seguro; grants públicos e atualização direta do modo permanecem revogados.
- O verificador isolado em PostgreSQL 17 aprovou modo, autoria, vínculo,
  recursos filhos, RPC, grants e trigger.
- C83, C85 e C87 foram revalidadas em banco isolado.
- `npm run check` aprovou 118/118 testes, lint, tipos, exportações e build
  Next.js 16.3.5.
- A auditoria de segurança local foi aprovada.

## Produção — fase 1

- Preflight confirmou C83 aplicada, dados consistentes e ausência da C87.
- `20260917003926 c087_grant_switch_active_role` foi aplicada e registrada de
  forma transacional no Supabase.
- Conta sintética autenticada confirmou RPC funcional e idempotente.
- UPDATE direto de `user_profiles` permaneceu negado.

## Pendente — fase 2 e encerramento

- `20260917003928 c087_harden_mode_aware_rls` está preparada no SQL Editor, mas
  não foi executada porque a alteração tem alcance de produção e requer
  autorização explícita.
- A flag `ACCOUNT_MODE_SWITCH_ENABLED` permanece desligada.
- Após autorização: aplicar fase 2, executar pós-flight, matriz remota,
  Security/Performance Advisors, smokes, observabilidade e registrar o CPD final.
- A C88 continua obrigatória para homologação E2E e rollout dos modos.

## Recuperação

- Falha de interface ou RPC: manter/desligar a flag e corrigir por roll-forward.
- Falha de policy: usar migration corretiva explícita e auditada; não alterar
  migration já publicada nem executar reset destrutivo.
