# Matriz de policies-alvo

| Recurso | Aluno | Orientador |
|---|---|---|
| `user_profiles` | SELECT próprio; INSERT inicial | SELECT próprio; INSERT inicial |
| `user_profile_role_events` | sem acesso Data API | sem acesso Data API |
| `legal_consents` | linha própria do modo ativo | linha própria do modo ativo |
| `projects` próprios de Aluno | CRUD se autoria=student | negado |
| `projects` próprios de Orientador | negado | CRUD se autoria=advisor |
| `projects` estudantis vinculados | negado | SELECT |
| `research_workflows` próprios de Aluno | CRUD via projeto student | negado |
| `research_workflows` próprios de Orientador | negado | CRUD via projeto advisor |
| `research_workflows` estudantis vinculados | negado | SELECT + UPDATE de revisão limitado por trigger |
| `generation_jobs` próprios | CRUD via projeto student | CRUD via projeto advisor |
| `research_structures` próprias | CRUD via projeto student | CRUD via projeto advisor |

A RPC de troca é comum aos dois modos porque é o único caminho autorizado para
mudar o próprio contexto.

Nenhuma policy usa apenas `owner_id`: a autoria do projeto precisa corresponder
ao modo ativo. Isso evita que a troca para Orientador libere autoaprovação de um
projeto criado como Aluno.
