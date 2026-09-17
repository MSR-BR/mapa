# Evidência de implementação — Change 087

## Banco e segurança

- `20260917003926 c087_grant_switch_active_role` liberou apenas a RPC
  autenticada de troca de modo; atualização direta de `user_profiles` continuou
  revogada.
- `20260917003928 c087_harden_mode_aware_rls` aplicou RLS consciente do modo,
  privilégios mínimos, funções com `search_path` seguro e trigger imutável.
- A matriz remota inicial encontrou uma incompatibilidade entre a policy de
  leitura por helper e `INSERT ... RETURNING`. A correção foi feita por
  roll-forward em `20260917015508 c087_fix_project_insert_returning`, sem editar
  migrations publicadas.
- O pós-flight confirmou três migrations registradas, RLS habilitada nas seis
  tabelas críticas, 24 policies, nenhum `UPDATE` sem `WITH CHECK`, grants mínimos,
  três índices, trigger ativo e zero dados inconsistentes.

## Validação

- PostgreSQL 17 local e o verificador remoto autenticado aprovaram modo, autoria,
  vínculo, recursos filhos, RPC, concorrência, grants e trigger.
- A matriz remota final aprovou 15 verificações e limpou os dados sintéticos,
  restaurando os modos originais.
- `npm run supabase:verify-advisor-student` aprovou o fluxo profundo entre contas.
- `npm run check` aprovou 119/119 testes, lint, tipos, exportações e build
  Next.js 16.3.5; `npm run security:audit` também foi aprovado.
- Security e Performance Advisors apresentaram zero erros. Os avisos restantes
  foram classificados: três RPCs `SECURITY DEFINER` são endpoints autenticados
  intencionais, a proteção de senhas vazadas é uma configuração preexistente de
  Auth, e as policies permissivas paralelas separam acesso próprio e
  supervisionado deliberadamente.

## Ativação e CPD

- `ACCOUNT_MODE_SWITCH_ENABLED=true` foi configurada exclusivamente em
  Production depois da matriz aprovada.
- O commit funcional `b1cda6c` foi publicado no deployment
  `dpl_2SZj3hikYutHnXpDkSeuEgh5178x`, estado `READY`, em
  `https://mapadapesquisa.com.br`.
- O seletor de perfil foi confirmado em sessão autenticada em
  `/dashboard/settings`; nenhum modo da conta real inspecionada foi alterado.
- Raiz e health responderam corretamente; dashboard/configurações redirecionam
  visitantes sem sessão; a API protegida nega acesso anônimo; nenhum erro foi
  encontrado nos logs da última hora após os smokes.

## Recuperação

- Problema de interface ou RPC: remover/desligar a flag de Production e
  redeployar, mantendo os dados e as policies.
- Problema de policy: corrigir por migration explícita de roll-forward. Não
  editar migrations aplicadas nem executar reset destrutivo em produção.
- A C88 permanece separada para homologação final observada, incluindo o gate de
  domínio/DNS/e-mail sem cutover automático de nameservers.
