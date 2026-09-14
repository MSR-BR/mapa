# Tarefas

1. Verificar produção de forma somente leitura e comparar com migrations locais.
2. Criar snapshot sanitizado de contagens por papel, autoria inferida, perfis
   ausentes, proprietários órfãos e vínculos anômalos.
3. Escrever migration aditiva para versão, horário, eventos e
   `projects.authoring_role`.
4. Backfillar autoria pelo perfil imutável atual do proprietário e abortar em
   qualquer linha ambígua, sem conversão silenciosa.
5. Criar trigger que deriva autoria no INSERT e impede sua alteração posterior.
6. Criar função/trigger de auditoria de modo com `search_path` seguro.
7. Criar RPC transacional de troca, sem conceder EXECUTE nesta Change.
8. Backfillar versão/horário e evento-base preservando `active_role`.
9. Validar autonomia dos projetos de Orientador e a ausência de auto-orientação.
10. Atualizar `database.types.ts` e testes de contrato SQL.
11. Executar migration local/branch, lint SQL, advisors e rollback ensaiado.
12. Publicar somente após todos os gates e executar CPD.
