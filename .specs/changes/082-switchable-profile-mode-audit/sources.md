# Fontes técnicas

## Projeto

- Changes 064, 071, 076 e 077.
- Módulos de perfil, autenticação, dashboard, projetos e consentimento.
- Migrations locais de perfis, projetos, workflow e revisão.
- Verificador `scripts/verify-advisor-student-flow.ts`.

## Documentação oficial

- Next.js 16.3.5 incluído no projeto: guia `authentication.md`; recomenda DAL,
  checagem perto da fonte de dados e autorização própria em Server Actions e
  Route Handlers.
- Supabase — Row Level Security:
  https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase — Custom Claims e RBAC:
  https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac
- Supabase — Custom Access Token Hook:
  https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- Supabase — Sessions:
  https://supabase.com/docs/guides/auth/sessions
- Supabase — exposição explícita de novas tabelas públicas:
  https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
