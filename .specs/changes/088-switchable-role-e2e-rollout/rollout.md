# Rollout e recuperação

## Pré-condições

- C83 aplicada e reconciliada.
- Código C84–C86 publicado e testado com flag desligada.
- Backup/restore e queries de verificação documentados.

## Ativação

1. Liberar RPC conforme C87.
2. Ativar flag na aplicação compatível.
3. Smoke da troca com contas de teste.
4. Aplicar policies estritas.
5. Repetir smoke UI/API/Data API e advisors.
6. Observar erros 403/409/5xx e suporte sem PII.

## Recuperação

- Erro de UI: corrigir/roll-forward mantendo RLS estrita.
- Erro da RPC: desligar a flag para impedir novas trocas; modos atuais seguem
  protegidos.
- Erro de policy: aplicar migration corretiva explícita e auditada; nunca editar
  migration já publicada nem usar reset destrutivo.
