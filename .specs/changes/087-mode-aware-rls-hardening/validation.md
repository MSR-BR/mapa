# Validação

- Matriz direta via clientes autenticados sintéticos para SELECT/INSERT/UPDATE/
  DELETE e RPC nos dois modos.
- Matriz cruzada de proprietário nos quatro pares
  modo×`authoring_role`, incluindo recursos filhos.
- Tentativas anônimas e sem perfil.
- Concorrência com `expected_version` correto e obsoleto.
- Teste de que trocar modo não altera autoria, projetos, workflows ou vínculos.
- Teste de ciclo completo de projeto autônomo de Orientador e negação de
  qualquer vínculo de supervisão.
- Testes do trigger: comentário permitido; conteúdo, propriedade e revisões
  anteriores imutáveis.
- Query de grants, `pg_policies` e funções `SECURITY DEFINER` com `search_path`.
- Supabase Security/Performance Advisors.
- `npm run supabase:verify-*`, `npm run check`, security audit e smoke publicado.

## Resultado final — 2026-09-16

- PostgreSQL 17 local, `npm run check` com 119/119 testes, build Next.js 16.3.5
  e auditoria de segurança aprovados.
- As migrations `20260917003926` e `20260917003928` foram aplicadas e
  registradas no Supabase de produção.
- A primeira matriz autenticada identificou que a policy de leitura baseada em
  helper recusava um projeto válido no `INSERT ... RETURNING`, operação exata
  usada pelo app. A migration corretiva `20260917015508` substituiu essa policy
  por um predicado direto de proprietário e modo ativo.
- A matriz remota final aprovou 15 verificações: troca idempotente e concorrente,
  criação nos dois modos, isolamento entre contas e modos, supervisão válida,
  negações de auto-orientação e mutação indevida, limpeza e restauração.
- O E2E profundo Aluno–Orientador foi aprovado, incluindo vínculo, leitura
  supervisionada, bloqueio de edição acadêmica, comentários, correções,
  aprovações, mapa final e referências.
- Security Advisor: zero erros e três avisos aceitos para RPCs `SECURITY
  DEFINER` autenticadas; a proteção de senhas vazadas permanece uma configuração
  de Auth preexistente. Performance Advisor: zero erros e três avisos aceitos
  pela separação deliberada entre policies próprias e supervisionadas.
- `ACCOUNT_MODE_SWITCH_ENABLED=true` foi ativada somente em Production após a
  aprovação da matriz. O seletor foi confirmado na página autenticada de
  configurações sem alterar o perfil real usado na inspeção.
- Deployment `dpl_2SZj3hikYutHnXpDkSeuEgh5178x` ficou `READY` em
  `https://mapadapesquisa.com.br`; raiz, health, redirecionamentos, gate anônimo
  da API e varredura de logs foram aprovados.
