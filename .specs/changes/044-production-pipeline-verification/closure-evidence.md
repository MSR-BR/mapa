# Evidências de encerramento — Change 044

## Integrações externas

- Gemini: passou; saída estruturada compatível com o schema 1.0.0.
- Research Starter: passou; `status=partial`, 3 referências e confiança
  `medium` no smoke de contrato.
- Descoberta completa: passou; 3 sugestões rápidas, 6 propostas avançadas,
  20 referências normalizadas e `reportId` retornado.

## Fluxo autenticado

O runner `scripts/verify-advisor-student-flow.ts` passou com as contas E2E
configuradas no ambiente. Foram verificados login/cadastro, perfis, vínculo,
leitura do projeto supervisionado, bloqueio de edição pelo orientador,
comentário, solicitação de correção, aprovação das etapas, mapa final e
referências. O projeto temporário foi limpo ao final.

Resultado registrado pelo runner: 8 revisões, 7 aprovações e 3 referências no
mapa final.

## Qualidade local

- PDF de teste gerado com 14.682 bytes.
- 65 testes automatizados aprovados.
- Typecheck, lint, build de produção e `git diff --check` aprovados.
- O smoke isolado usa a condição Node `react-server` para respeitar o pacote
  `server-only`; a dependência foi declarada explicitamente no projeto.

## Versão

`v23082026.3`

## Deploy e smoke público

- Deployment Vercel `dpl_L4CE1edxVRYNJ66y26yygMozthCm` ficou `READY` e foi
  aliasado a `https://mapadapesquisa.com.br`.
- Home, `/api/health`, `robots.txt` e `sitemap.xml` retornaram HTTP 200.
- `/api/health` retornou `{"service":"mapa-da-pesquisa","status":"ok"}`.
- O host Vercel antigo redirecionou para o domínio canônico.
