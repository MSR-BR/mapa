# Rollout e recuperação

## Pré-condições

- C83 aplicada e reconciliada.
- Código C84–C86 publicado e testado com flag desligada.
- Backup/restore e queries de verificação documentados.
- Estratégia do `domain-dns-gate.md` aprovada. Se houver delegação de DNS, ela
  deve estar concluída e estável antes desta janela.

## Ativação

1. Liberar RPC conforme C87.
2. Ativar flag na aplicação compatível.
3. Smoke da troca e da criação de projeto autônomo de Orientador.
4. Aplicar policies estritas.
5. Repetir smoke UI/API/Data API e advisors.
6. Repetir smoke de domínio/SSL/health e, se DNS mudou, e-mail.
7. Observar erros 403/409/5xx e suporte sem PII.

## Recuperação

- Erro de UI: corrigir/roll-forward mantendo RLS estrita.
- Erro da RPC: desligar a flag para impedir novas trocas; modos atuais seguem
  protegidos.
- Erro de policy: aplicar migration corretiva explícita e auditada; nunca editar
  migration já publicada nem usar reset destrutivo.
- Erro de DNS: não alterar RLS para compensar; executar o rollback documentado da
  zona/nameservers e revalidar site, certificado e e-mail.

## Encerramento em 17/09/2026

O rollout terminou por roll-forward, sem rollback: migrations/RLS da C87
permaneceram ativas, a flag de troca continuou habilitada em Production e a C88
homologou a matriz remota, o E2E entre contas, exportações e produção. A
estratégia de DNS externo foi preservada em janela sem mudança de zona.
