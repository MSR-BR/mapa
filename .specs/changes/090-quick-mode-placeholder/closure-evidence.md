# Evidências de encerramento — Change 090

**Status:** concluída em produção em 22/09/2026.

## Resultado funcional

- O campo canônico do Mapa Rápido exibe exatamente:
  “Informe as palavras-chave (mínimo duas) ou escreva o tema da pesquisa.”
- O texto antigo iniciado por “Exemplo:” foi removido do código e do bundle de
  produção.
- Landing page e dashboard continuam usando o mesmo componente.
- Sugestões locais/IA, seleção em um clique e avanço permaneceram inalterados.

## Gates locais

- Teste direcionado: 55/55 aprovados.
- `npm run check`: lint, tipos, 123/123 testes, exportações PDF/DOCX e build
  Next.js 16.3.5 aprovados.
- Build adicional após o alinhamento da versão pública: aprovado.
- `git diff --check`: aprovado.

Durante o gate foi restaurado no estado do projeto o nome canônico já
homologado `RESEARCH_STARTER_MAPA_API_KEY`; nenhuma credencial ou integração foi
alterada.

## Produção e CPD

- Commit funcional: `40ae82f`.
- Versão pública: `v22092026.1`.
- Deployment: `dpl_BBVx5u3EUhR8pJ5Dito77vaSV7R1` — READY.
- Artefato validado antes da promoção:
  `https://mapadapesquisa-ljgbb80w7-msr-brs-projects.vercel.app`.
- Domínio canônico promovido: `https://mapadapesquisa.com.br`.
- Health: `status=ok`; Supabase, Gemini, Research Starter e Resend configurados.
- Home: HTTP 200; dashboard anônimo: redirect 307 para `/login`.
- Bundle cliente: novo texto presente e texto antigo ausente.
- Smoke DOM headless: Mapa Rápido expandido e placeholder renderizado em desktop
  e viewport móvel de 390 px; texto antigo ausente.
- Logs de erro dos 15 minutos pós-rollout: nenhum registro encontrado.

## Rollback

O rollback pode promover o deployment anterior. A C90 não altera banco,
autenticação, APIs, persistência ou serviços externos.
