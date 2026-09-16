# Tarefas

1. Verificar produção de forma somente leitura e comparar com migrations locais.
2. Criar snapshot sanitizado de contagens por papel, autoria inferida, perfis
   ausentes, proprietários órfãos e vínculos anômalos.
3. Escrever migration aditiva para versão, horário, eventos e
   `projects.authoring_role`.
4. Backfillar a autoria por regra determinística: projeto de conta orientadora
   sem supervisão ou auto-orientado é de Orientador; supervisão por terceiro
   preserva autoria histórica de Aluno.
5. Criar trigger que deriva autoria no INSERT e impede sua alteração posterior.
6. Criar função/trigger de auditoria de modo com `search_path` seguro.
7. Criar RPC transacional de troca, sem conceder EXECUTE nesta Change.
8. Backfillar versão/horário e evento-base preservando `active_role`.
9. Validar autonomia dos projetos de Orientador e a ausência de auto-orientação.
10. Atualizar `database.types.ts` e testes de contrato SQL.
11. Executar migration local/branch, lint SQL, advisors e rollback ensaiado.
12. Publicar somente após todos os gates e executar CPD.

## Execução em 16/09/2026

- Tarefas 1–11 concluídas e verificadas localmente e no projeto remoto
  `aeaweherkrqmlqnxsmib`.
- O preflight autenticado confirmou 13 perfis, 65 projetos, zero órfãos, seis
  auto-orientações de contas orientadoras e uma supervisão externa.
- A migration `20260916163351_account_mode_database_foundation` foi aplicada em
  transação única e registrada como a 14ª migration.
- O postflight confirmou 50 projetos de Orientador, 15 de Aluno, 13 eventos-base,
  nenhuma autoria ausente e nenhum projeto de Orientador supervisionado.
- Security e Performance Advisors ficaram com zero erros; os avisos restantes
  pertencem a funções e policies anteriores à C83.
- A publicação de schema foi concluída. O CPD de repositório/deploy permanece
  separado e aguarda comando explícito.
