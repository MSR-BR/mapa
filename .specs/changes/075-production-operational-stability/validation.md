# Validação

- Busca estática por nomes de variáveis e prefixos públicos proibidos.
- Testes unitários e de contrato do Research Starter e do health.
- `npm run check`.
- `npm audit`.
- `npx vercel env ls production`.
- `npm run research-starter:verify:production`.
- `npx vercel inspect <deployment>`.
- Smoke HTTP do domínio e `/api/health`.
- Scan de logs de erro após o smoke.
- `git status --short --branch`.
