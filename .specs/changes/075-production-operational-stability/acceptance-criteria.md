# Critérios de aceite

- O código ativo não consulta `RESEARCH_STARTER_API_KEY`.
- A Vercel Production contém `RESEARCH_STARTER_MAPA_API_KEY` e não contém a
  variável legada.
- O smoke autenticado publicado retorna HTTP 200 e referências reais.
- Nenhum segredo aparece em código, diff, logs ou documentação.
- `package.json` fixa Node.js em `22.x`.
- Os scripts transitivos auditados têm política explícita e o build continua
  funcional.
- Next.js e dependências diretas relacionadas ficam em versões corrigidas e
  `npm audit` retorna zero vulnerabilidades conhecidas.
- `npm run check` e `git diff --check` passam.
- O deployment fica `READY`, o domínio canônico responde 200, o health fica
  `ok` e o scan de logs não encontra erro.
- Roadmap, evidência de encerramento e memória do projeto ficam atualizados.
