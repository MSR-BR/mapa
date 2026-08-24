# Evidências de encerramento — Change 049

- Auditoria local e produção executadas em 23/08/2026–24/08/2026.
- Versão final: `v23082026.8`.
- `npm test`: 71/71; `npm run lint`, `npm run typecheck`, `npm run build`,
  `npm run security:audit` e `npm run exports:verify`: concluídos sem falhas.
- Supabase: migrations locais/remotas sincronizadas até `20260823120000`, RLS
  anônimo negado, isolamento autenticado confirmado e fluxo aluno–orientador
  confirmado com 8 revisões, correção, aprovação, mapa final e 3 referências.
- Integrações: Gemini validado; Research Starter validado com status `partial`,
  3 referências e confiança `medium` (resposta válida do provedor); descoberta
  de propostas validada com 6 propostas, 20 referências e 3 sugestões rápidas.
- Produção: `/api/health`, `/`, `/home.html`, recuperação de senha, robots, sitemap
  e asset CBL responderam HTTP 200; health retornou todos os provedores
  `configured` e `status: ok`; `mapadapesquisa.vercel.app` redireciona 308 para o
  domínio canônico.
- Avisos não bloqueantes do advisor foram registrados: as RPCs de vínculo precisam
  ser `SECURITY DEFINER` executáveis por usuários autenticados; a proteção de
  senhas vazadas permanece desligada por decisão explícita para o plano gratuito.
