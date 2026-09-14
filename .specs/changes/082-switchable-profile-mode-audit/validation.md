# Validação

- Busca estática de `active_role`, `activeRole`, `student`, `advisor`, `owner_id`
  e `advisor_id` em código, testes e migrations.
- Leitura integral dos módulos de perfil, shell do dashboard, página de projeto,
  ações de projeto, consentimento e endpoints de revisão.
- Revisão das policies de `projects`, `research_workflows`,
  `generation_jobs`, `research_structures`, `user_profiles` e
  `legal_consents`.
- Conferência do guia de autenticação incluído no Next.js 16.3.5 instalado.
- Conferência da documentação oficial de RLS, sessões e RBAC do Supabase.
- `git diff --check` e auditoria dos arquivos de especificação.

A consulta remota via conector Supabase retornou falta de permissão em todas as
operações somente leitura. A validação do schema publicado foi convertida em
gate obrigatório da C83, antes de qualquer DDL.
