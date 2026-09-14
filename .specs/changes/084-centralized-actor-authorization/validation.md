# Validação

- Testes unitários do contexto: sem sessão, sem perfil, erro do Supabase, papel
  inválido, consentimento ausente e versões concorrentes.
- Testes de contrato 401/403/404/409 para cada família de endpoint.
- Testes negativos de Server Actions com payload de papel adulterado.
- Matriz positiva de autoria rápida/avançada para Aluno e Orientador.
- Testes de incompatibilidade entre modo ativo e `authoring_role`, incluindo
  duplicação, integração, exportação e tentativa de contornar supervisão.
- Testes de que projetos próprios de Orientador não aceitam vínculo ou envio
  para supervisão.
- Busca estática para impedir chamadas sensíveis que usem apenas
  `requireAuthenticatedUser`.
- `npm run check`, `npm run security:audit` e `git diff --check`.
- Deployment com flag desligada e smoke de regressão dos dois perfis atuais.
