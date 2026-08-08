# Evidências de encerramento — Change 009

Data: 07/08/2026.

## Banco e segurança

- Migração `20260807225154_create_research_workflow_v2_foundation` aplicada no Supabase do Mapa.
- Migração `20260807225429_index_research_workflow_project_owner` aplicada após revisão do advisor.
- `research_workflows` criada com RLS habilitado e quatro políticas limitadas a `auth.uid() = owner_id`.
- Chave estrangeira `(project_id, owner_id)` impede associação com projeto de outro proprietário.
- Teste transacional com dois usuários confirmou uma linha própria visível e zero leitura/atualização cruzada; a transação foi revertida.
- Acesso anônimo real foi negado para `projects` e `research_workflows`.
- Consulta confirmou zero projetos com versão legada alterada.

## Aplicação

- Contrato `ResearchWorkflow` versionado em `2.0.0`.
- Estados estáveis, transitórios e de falha validados por Zod.
- Transições explícitas rejeitam saltos de etapas.
- Grafo de dependência calcula invalidação transitiva.
- Storage server-only exige `owner_id` e valida conteúdo recuperado.

## Verificações

- Lint, TypeScript e 31 testes passaram antes da aplicação remota.
- Advisor de performance não apresenta mais chave estrangeira sem índice.
- O aviso geral `auth_leaked_password_protection` já existia e não foi alterado por esta change.
