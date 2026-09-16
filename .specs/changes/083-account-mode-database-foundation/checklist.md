# Checklist

- [x] Preflight remoto completo sem PII no projeto `mapa-da-pesquisa`.
- [x] Histórico remoto alinhado: 13 migrations antes da DDL, terminando em
  `20260911190000 lock_user_profile_role`.
- [x] Autoria histórica reconciliada por sinais explícitos: 6 auto-orientações
  convertidas em autoria de Orientador e 1 supervisão externa preservada como
  autoria de Aluno.
- [x] Migration aditiva revisada e aplicada atomicamente.
- [x] Backfill preserva todos os modos e não deixa perfil ou projeto incompleto.
- [x] `authoring_role` obrigatório, derivado no INSERT e imutável.
- [x] Projetos de Orientador confirmados como autônomos.
- [x] Auditoria append-only protegida por RLS e revokes.
- [x] RPC criada, testada e ainda sem EXECUTE para papéis da aplicação.
- [x] Tipos atualizados e typecheck aprovado.
- [x] Security/Performance Advisors e smokes pós-migration aprovados.
- [x] E2E real Aluno–Orientador aprovado com limpeza do projeto temporário.
- [ ] CPD concluído — evidência de produção aprovada; commit, push e deploy ainda
  não foram executados nesta etapa.
