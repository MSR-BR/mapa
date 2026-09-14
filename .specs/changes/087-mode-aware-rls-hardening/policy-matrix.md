# Matriz de policies-alvo

| Recurso | Aluno | Orientador |
|---|---|---|
| `user_profiles` | SELECT próprio; INSERT inicial | SELECT próprio; INSERT inicial |
| `user_profile_role_events` | sem acesso Data API | sem acesso Data API |
| `legal_consents` | linha própria do modo ativo | linha própria do modo ativo |
| `projects` próprios | CRUD | negado |
| `projects` vinculados | negado | SELECT |
| `research_workflows` próprios | CRUD | negado |
| `research_workflows` vinculados | negado | SELECT + UPDATE limitado por trigger |
| `generation_jobs` próprios | CRUD | negado |
| `research_structures` próprios | CRUD | negado |

A RPC de troca é comum aos dois modos porque é o único caminho autorizado para
mudar o próprio contexto.
