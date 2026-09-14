# Requisitos

- Criar helper SQL seguro para obter somente o modo da própria `auth.uid()`.
- Exigir modo Aluno nas policies de proprietário de `projects`,
  `research_workflows`, `generation_jobs` e `research_structures`.
- Exigir modo Orientador nas policies de leitura/revisão por vínculo.
- Manter UPDATE direto de `user_profiles` revogado.
- Conceder EXECUTE apenas à RPC de troca e às funções necessárias, nunca a
  `public` ou `anon`.
- Endurecer `set_project_advisor` para modo Aluno, propriedade e anti-auto-orientação.
- Endurecer `claim_pending_advisor_projects` para modo Orientador.
- Endurecer o trigger de revisão para exigir modo Orientador e vínculo.
- Restringir consentimento direto ao modo ativo e preservar as duas linhas.
- Preservar políticas administrativas e de relatos não relacionadas ao perfil.
- Aplicar rollout em duas migrations/revisões para reduzir janela de incompatibilidade.
