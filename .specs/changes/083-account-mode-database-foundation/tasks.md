# Tarefas

1. Verificar produção de forma somente leitura e comparar com migrations locais.
2. Criar snapshot sanitizado de contagens por papel e vínculos anômalos.
3. Escrever migration aditiva para versão, horário e eventos.
4. Criar função/trigger de auditoria com `search_path` seguro.
5. Criar RPC transacional de troca, sem conceder EXECUTE nesta Change.
6. Backfillar versão/horário e evento-base preservando `active_role`.
7. Atualizar `database.types.ts` e testes de contrato SQL.
8. Executar migration local/branch, lint SQL, advisors e rollback ensaiado.
9. Publicar somente após todos os gates e executar CPD.
