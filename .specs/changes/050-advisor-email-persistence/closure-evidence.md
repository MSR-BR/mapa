# Evidência de encerramento — Change 050

## Resultado

Concluída em 25/08/2026. O painel de orientação agora mostra o e-mail salvo e
se o vínculo foi confirmado ou permanece pendente. O campo só reaparece após
a ação explícita **Alterar orientador**; salvar, alterar e remover atualizam o
estado sem apagar o projeto.

## Persistência e segurança

- O valor continua sendo lido de `projects.advisor_email` ao reabrir o projeto.
- O vínculo confirmado continua sendo indicado por `projects.advisor_id`.
- Vínculos pendentes continuam usando `set_project_advisor` e podem ser
  concluídos pelo `claim_pending_advisor_projects` quando o orientador cria ou
  acessa a conta.
- Nenhuma migration foi necessária; não houve mudança de RLS ou exposição de
  dados.

## Verificações

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run supabase:verify-advisor-student`
- `npm run exports:verify`
- `npm run security:audit`
- smoke público em `https://mapadapesquisa.com.br`

## Versão

`v25082026.1`.
