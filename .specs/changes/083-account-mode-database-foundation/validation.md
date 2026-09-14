# Validação

- Comparação de migrations remotas/locais antes da DDL.
- `npm run supabase:verify-migration-local` ou ambiente equivalente isolado.
- Queries agregadas pré/pós-migration: quantidade total, por modo, por autoria,
  projetos sem perfil/autoria, vínculos incompatíveis, versões inválidas e
  eventos-base; nenhuma linha com e-mail ou conteúdo.
- Tentativas de criar projeto com autoria falsificada e de alterar
  `authoring_role` após o INSERT.
- Testes de projeto criado como Aluno e como Orientador, incluindo ausência de
  supervisão no segundo caso.
- Tentativas autenticadas de SELECT/INSERT/UPDATE/DELETE na tabela de eventos.
- Tentativas de UPDATE direto de perfil e EXECUTE prematuro da RPC.
- Supabase Security e Performance Advisors.
- `npm run check`, `git diff --check` e smoke público sem troca de modo.
