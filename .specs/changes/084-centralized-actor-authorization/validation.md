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

## Resultado — 2026-09-16

- `npm run check`: aprovado, com 102 testes e build de produção.
- `npm run security:audit`: aprovado em 521 arquivos e 14/14 rotas acadêmicas.
- `git diff --check`: aprovado.
- Deployment final `dpl_CXCa1RFjZRaGWTD5yysKNy6PCkFg`: `READY` em Production,
  no domínio canônico `https://mapadapesquisa.com.br`.
- `ACCOUNT_MODE_SWITCH_ENABLED` ausente em Production: fallback seguro `false`
  confirmado e troca de modo desligada.
- Smoke remoto: raiz `200`, health `ok`, dashboard anônimo `307` para `/login`
  e API protegida `401 authentication_required`.
- Logs de erro do deployment após o smoke: nenhum registro encontrado.
- O primeiro deploy revelou um log de exceção no render paralelo do dashboard
  anônimo; o hotfix `7e62bf5` passou por toda a suíte e eliminou o registro no
  deployment final.
