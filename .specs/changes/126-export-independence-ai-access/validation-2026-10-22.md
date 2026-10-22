# Validação C126 — 22/10/2026

Todos os dados e provedores de teste são sintéticos. Nenhuma sessão real, conteúdo
privado, chamada paga ou alteração remota. HEAD não alterado.

| Verificação | Resultado |
|---|---|
| `npm run check` | Lint, tipos, grants estáticos, testes e exportações PASS; build Turbopack bloqueado no ambiente. |
| Testes da suíte | 211 principais + 13 DOI + 39 IA = 263 PASS; 45 cenários Data API e harness de autenticação de sugestões PASS. |
| `npm run test:exports` | PASS: download real PDF/DOCX, cache privado, primeiro save manual, falha IA, concorrência, acesso negado, revisão pendente e gates de rascunho/aprovação. |
| `npm run exports:verify` | PASS: formato legado + Avançado/concluído/rascunho/Rápido/Unicode/sem reformulação; originais intactos. |
| Paridade | 553 campos de conteúdo compartilhado encontrados no PDF e Word, incluindo textos longos; `pdftotext` preserva exatamente a sequência Unicode exigida. |
| Fontes | `pdffonts` confirma DejaVu incorporada; trace final contém as três fontes e licença. |
| Navegador sintético | 5 fluxos PASS: manual+download, pendente+download, IA falha+download, visitante sem API, autenticado com saldo indisponível e digitação preservada. Toda rede interceptada. |
| PostgreSQL 17 local | `supabase:verify-ai-budget` PASS: auth/segredo, tabelas privadas, idempotência e 20 concorrentes para quatro reservas restantes sem ultrapassar o saldo. Banco descartável; não é Supabase remoto. |
| Build final | `npm run build -- --webpack` PASS. Fontes/licença conferidas em `.next/server/app/api/projects/[id]/exports/[format]/route.js.nft.json`. |
| Segurança | `security_fast_check.py --mode worktree` PASS, 136 arquivos inspecionados; auth/privacidade/originais/aprovação verificados no escopo. Não é aprovação de produção. |
| Qualidade final | Lint sem erros, um warning preexistente em `tests/foundation.test.mjs:887`; tipos PASS; diff sem whitespace inválido. |

## Inspeção visual

Renderização Poppler conferida: capa, introdução, metodologia, apêndice e sequência
Unicode em regular/negrito/oblíquo. Sem glifos quadrados, corte de conteúdo ou
sobreposição nas páginas inspecionadas. Layout acadêmico e conteúdo mantidos;
quebras podem diferir da fonte anterior. Interface móvel de 390 px conferida,
com originais e campos separados e botões com estilo do app.

## Limitações e tentativas recuperadas

- Primeiro build padrão não alcançou Google Fonts pela rede restrita. Segunda
  tentativa com acesso público chegou ao erro interno Turbopack de bind de porta.
  Webpack passou; não declarar `npm run check` integralmente aprovado.
- Chrome/Docker foram inicialmente barrados pelo sandbox; testes locais passaram
  com execução autorizada pelo revisor automático. Chrome usa perfil temporário,
  sem cookies pessoais; fixtures interceptam toda rede. A fixture teve charset
  UTF-8 corrigido após erro de regex; isso não era defeito do aplicativo.
- Sem teste contra Auth/PostgREST real; autorização e rota usam limites simulados,
  enquanto atomicidade do orçamento foi testada em PostgreSQL real local.
- Sem teste pago. Não comprova disponibilidade dos provedores ou saldo remoto.
- Não instalou novas dependências nem alterou lockfile, migrations ou configuração
  de Ads/GA4/Supabase/Vercel. Não houve commit, push ou deploy.

Logs e imagens selecionados em `evidence/`; binários sintéticos em `tmp/exports`
e renders adicionais em `tmp/c126-pdf-review` (ignorados pelo Git).
