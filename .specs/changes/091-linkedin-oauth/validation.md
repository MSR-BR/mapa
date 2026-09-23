> **Status: cancelada em 22/09/2026.** O responsável decidiu não criar uma Página pública no LinkedIn e manter somente o login Google. Este arquivo permanece como histórico e não autoriza implementação ou ativação do LinkedIn.

# Validação

## Local e contrato

- Testes unitários da allowlist de provedores e do destino seguro.
- Testes de interface para flags desligadas, botões, foco e nomes acessíveis.
- Callback PKCE: sucesso, código inválido, cancelamento e erro por provedor.
- Scanner de segredos e confirmação de que IDs secretos não chegam ao bundle.
- `npm run check`, auditoria de segurança e `git diff --check`.

## Produção controlada

- Uma conta nova por Google e LinkedIn.
- Uma conta existente por senha com e-mail verificado vinculada ao LinkedIn.
- Casos de e-mail diferente, e-mail indisponível e consentimento cancelado.
- Logout, nova entrada, recarga, sessão expirada e duas abas.
- Perfil Aluno e Orientador, troca de modo, projetos próprios, revisão vinculada,
  exportações e RLS.
- Health, domínio canônico, redirects, logs 4xx/5xx e ausência de PII.
- Matriz de identidades e relatório de prontidão obrigatório antes da C92.
