# Fontes técnicas

## Projeto

- Changes 064, 071, 076 e 077.
- Módulos de perfil, autenticação, dashboard, projetos e consentimento.
- Migrations locais de perfis, projetos, workflow e revisão.
- Verificador `scripts/verify-advisor-student-flow.ts`.

## Evidência operacional recebida

- PDF `Universidade Federal Fluminense Mail - Complete your domain setup for
  mapadapesquisa.com.br.pdf`, gerado em 16/09/2026 a partir de mensagem da
  Vercel de 15/09/2026.
- A mensagem registra domínio configurado na Vercel, DNS ainda administrado por
  provedor externo, alternativa de delegação para `ns1.vercel-dns.com` e
  `ns2.vercel-dns.com` e propagação estimada em até 48 horas.
- SHA-256:
  `41716607ae6556f802d70b69392b9cc4f4c5cd2f85a13fd422da7916a620a6eb`.

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
- Vercel — configuração de domínio customizado:
  https://vercel.com/docs/domains/set-up-custom-domain
- Vercel — adição e configuração de domínio:
  https://vercel.com/docs/domains/working-with-domains/add-a-domain
