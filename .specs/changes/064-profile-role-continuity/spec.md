# Change 064 — Papel de conta imutável e linguagem de revisão

**Status:** concluída

## Objetivo

Manter o papel escolhido no primeiro acesso — estudante ou orientador — por toda
 a vida da conta. A área de revisão não deve repetir o rótulo “orientador” em
 ações, cabeçalhos ou mensagens que já são contextualizadas pelo papel ativo.

## Escopo

- remover a troca de papel do menu da conta;
- aceitar a escolha de papel apenas quando ainda não existe perfil;
- impedir atualização direta de `user_profiles.active_role` pelo banco;
- preservar o vínculo pendente de projetos somente quando o papel inicial for
  de revisão;
- tornar neutra a linguagem da área de revisão e das ações de validação;
- manter “orientador” apenas onde o estudante precisa informar, visualizar ou
  contatar a pessoa vinculada ao projeto.

## Critérios de aceite

1. Uma conta que entra como estudante não consegue mudar para revisão depois.
2. Uma conta que entra como orientador não consegue mudar para estudante depois.
3. O menu mostra a área configurada, sem ação de troca de papel.
4. A área de revisão não mostra “modo orientador”, “validar como orientador” ou
   “comentários do orientador”.
5. O banco recusa atualização do papel por usuários autenticados.
6. Login, recarga e reabertura preservam o papel e as permissões correspondentes.

## CPD

- **Check:** testes de fluxo por papel e auditoria de textos visíveis.
- **Persist:** RLS/grants impedem alteração do papel após sua criação.
- **Deploy/document:** lint, typecheck, testes, build e evidência de fechamento.
