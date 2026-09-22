# Pré-requisitos externos

## Facebook

- Aplicativo Meta pertencente ao responsável pelo produto.
- Produto Facebook Login configurado com o callback do Supabase.
- Domínio, URLs de Privacidade, Termos e exclusão de dados preenchidos.
- Permissões mínimas `email` e `public_profile`.
- Contas de teste enquanto o app estiver em desenvolvimento.
- Aplicativo em modo Live e aprovações aplicáveis antes da liberação pública.

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

- https://supabase.com/docs/guides/auth/social-login/auth-facebook
- https://supabase.com/docs/guides/auth/social-login/auth-linkedin
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-identity-linking
