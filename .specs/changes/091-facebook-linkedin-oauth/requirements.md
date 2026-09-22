# Requisitos

## Provedores e interface

- Manter “Continuar com Google”.
- Adicionar Facebook com o provedor Supabase `facebook`.
- Adicionar LinkedIn pelo provedor atual `linkedin_oidc`; não usar o provedor
  legado `linkedin`.
- Centralizar o início do OAuth em uma ação com allowlist explícita de
  provedores, destino interno seguro e mensagens específicas de falha.
- Exibir somente provedores habilitados e completamente configurados.
- Manter e-mail/senha, cadastro e recuperação durante toda a C91.

## Configuração e segredos

- Configurar aplicativos próprios no Meta for Developers e LinkedIn Developers.
- Usar no provedor o callback Supabase
  `https://aeaweherkrqmlqnxsmib.supabase.co/auth/v1/callback`.
- Manter `https://mapadapesquisa.com.br/auth/callback` na allowlist de redirects
  do Supabase e registrar separadamente os redirects de preview/teste.
- Solicitar do Facebook apenas `email` e `public_profile` no escopo inicial.
- Habilitar “Sign In with LinkedIn using OpenID Connect”.
- Armazenar Client IDs/secrets apenas nos painéis dos provedores e do Supabase;
  nunca em código, Git, logs ou variáveis `NEXT_PUBLIC_*`.
- Criar flags server-side fail-closed para Facebook e LinkedIn.

## Continuidade da conta

- Preservar o `user.id`, perfil ativo, autoria, projetos, revisões e vínculo com
  orientadores ao entrar por um novo provedor.
- Aceitar associação automática somente quando o Supabase confirmar identidades
  com o mesmo e-mail verificado.
- Detectar e impedir fusão silenciosa quando o provedor devolver e-mail ausente,
  não verificado ou diferente do cadastro existente.
- Não editar diretamente `auth.users` ou tabelas internas do Auth.
- Produzir inventário sem PII em logs sobre contas somente por senha, Google e
  identidades sociais vinculadas antes da C92.

## Privacidade e operação

- Atualizar Termos/Privacidade para identificar Meta e LinkedIn como provedores
  de autenticação e explicar os dados mínimos recebidos.
- Preservar o e-mail como atributo de identidade/contato e como chave de convite
  do orientador; esta Change não remove e-mails do produto.
- Tratar cancelamento, acesso negado, falta de e-mail e erro do provedor sem
  apagar rascunhos nem entrar em loop.
- Não ativar um provedor publicamente enquanto estiver em modo de desenvolvimento
  ou restrito a testadores.
