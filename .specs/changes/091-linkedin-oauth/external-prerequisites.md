> **Status: cancelada em 22/09/2026.** O responsável decidiu não criar uma Página pública no LinkedIn e manter somente o login Google. Este arquivo permanece como histórico e não autoriza implementação ou ativação do LinkedIn.

# Pré-requisitos externos

## LinkedIn

- Aplicativo LinkedIn pertencente ao responsável pelo produto.
- Produto “Sign In with LinkedIn using OpenID Connect” habilitado.
- Callback do Supabase cadastrado exatamente.
- Client ID e Client Secret configurados somente no Supabase.

## Supabase e aplicação

- Provedores habilitados no projeto correto
  `aeaweherkrqmlqnxsmib`.
- Redirect canônico e redirects de teste separados na allowlist.
- Acesso administrativo auditável; a credencial CLI local com HTTP 403 deve ser
  regularizada ou substituída por procedimento autorizado e conferido.
- Contas reais de teste sem dados acadêmicos sensíveis.

Referências oficiais:

- https://supabase.com/docs/guides/auth/social-login/auth-linkedin
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-identity-linking
