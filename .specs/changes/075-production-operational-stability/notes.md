# Notas

- A credencial `RESEARCH_STARTER_MAPA_API_KEY` já foi validada funcionalmente
  em produção na Change 074.
- A chave local legada retornou HTTP 401 e não será substituída pela chave
  oculta de produção.
- O smoke publicado usará somente credenciais das contas E2E para chegar à rota
  autenticada; o segredo do Research Starter continuará exclusivamente no
  backend da Vercel.
- A ausência de credencial do Research Starter em Preview é deliberada para não
  expor segredo de produção a código de branches.
- O primeiro build limpo revelou `uuid@10` por `resend@6.9.2`; a atualização
  compatível para Resend 6.28 removeu essa cadeia transitiva.
- O gate de segurança encontrou vulnerabilidades corrigíveis em Next.js e em
  ferramentas transitivas. Foram aplicadas versões compatíveis, sem `--force`,
  até `npm audit` retornar zero ocorrências.
