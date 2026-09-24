# C104 — Rollout remoto dos grants explícitos do Supabase

## Objetivo

Comprovar no projeto Supabase de produção `aeaweherkrqmlqnxsmib` que migrations,
schemas expostos, grants, RLS, policies e funções correspondem ao contrato
versionado pela C103 e que os fluxos anônimo e autenticado permanecem seguros.

O caminho padrão é somente leitura e validação. SQL remoto só poderá ser
aplicado se uma divergência real for demonstrada, reproduzida localmente e
corrigida pelo menor artefato revisável possível.
