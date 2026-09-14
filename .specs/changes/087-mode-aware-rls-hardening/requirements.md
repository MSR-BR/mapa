# Requisitos

- Criar helper SQL seguro para obter somente o modo da própria `auth.uid()`.
- Nas policies de proprietário de `projects`, exigir simultaneamente
  `owner_id=auth.uid()` e `authoring_role=active_role`; permitir CRUD tanto
  para Aluno quanto para Orientador no projeto compatível.
- Nos recursos filhos (`research_workflows`, `generation_jobs` e
  `research_structures`), validar propriedade e autoria pelo projeto pai.
- Exigir modo Orientador, vínculo real e projeto `authoring_role=student` nas
  policies de leitura/revisão por vínculo.
- Negar ao proprietário abrir no modo Orientador um projeto criado como Aluno e
  abrir no modo Aluno um projeto criado como Orientador.
- Manter UPDATE direto de `user_profiles` revogado.
- Conceder EXECUTE apenas à RPC de troca e às funções necessárias, nunca a
  `public` ou `anon`.
- Endurecer `set_project_advisor` para modo Aluno, propriedade,
  `authoring_role=student` e anti-auto-orientação.
- Endurecer `claim_pending_advisor_projects` para modo Orientador.
- Endurecer o trigger de revisão para exigir modo Orientador, vínculo e projeto
  criado como Aluno, mantendo conteúdo acadêmico protegido.
- Impedir vínculo de orientador em projeto `authoring_role=advisor`.
- Restringir consentimento direto ao modo ativo e preservar as duas linhas.
- Preservar políticas administrativas e de relatos não relacionadas ao perfil.
- Aplicar rollout em duas migrations/revisões para reduzir janela de incompatibilidade.
