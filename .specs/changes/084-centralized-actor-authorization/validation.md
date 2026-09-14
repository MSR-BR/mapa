# Validação

- Testes unitários do contexto: sem sessão, sem perfil, erro do Supabase, papel
  inválido, consentimento ausente e versões concorrentes.
- Testes de contrato 401/403/404/409 para cada família de endpoint.
- Testes negativos de Server Actions com payload de papel adulterado.
- Busca estática para impedir chamadas sensíveis que usem apenas
  `requireAuthenticatedUser`.
- `npm run check`, `npm run security:audit` e `git diff --check`.
- Deployment com flag desligada e smoke de regressão dos dois perfis atuais.
