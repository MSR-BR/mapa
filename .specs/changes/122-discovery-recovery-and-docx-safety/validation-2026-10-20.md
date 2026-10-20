# Validação local da C122 — 20/10/2026

Candidato: árvore de trabalho sobre `f096d9f` (sem commit). Natureza: estático, unit/mocks e integração local simulada. Nenhuma chamada paga ou remota; nada publicado.

## Reproduções (antes × depois)

| Cenário | HEAD | Corrigido |
|---|---|---|
| Reserva "discovering" de 60 min, `scripts/verify-discovery-claim-recovery.mjs` (rota real, persistência sintética) | `failed`: 409 "A descoberta já está em andamento." | `passed`: 200, `choosing_problem`, 6 cartões |
| Reserva de 5 s | — | 409 e 0 escritas |
| Duas retomadas simultâneas de reserva expirada | — | statuses `[200,409]`, 2 escritas |
| Falha ao salvar propostas | etapa atribuída a "literature" (leitura de código) | 502, etapa `saving`, estado `failed` |
| DOCX com `\u000B`, `\u0007`, `\u000C` (`tests/docx-xml-safety.test.ts`) | `not ok` (`document.xml` com caractere inválido) | `ok` |

## Comandos e resultados

| Comando | Resultado |
|---|---|
| `npm run check` (lint, typecheck, grants, test, `exports:verify`, build) | exit 0; `test`: 196 + 13 + 38 = 247, 0 falhas; lint com 1 aviso preexistente |
| `node --import tsx --test tests/discovery-failure.test.ts` | 4/4 |
| `node --import tsx --test tests/docx-xml-safety.test.ts` | 2/2 |
| `npm run test:research-starter` | 12/12; resiliência C120 8 cenários; recuperação de claim passed |
| `npm run test:cards` / `test:limits` / `test:methodology` / `test:exports` | passed (13 cenários; C118; C117 e C119; rotas de exportação C121) |
| `npm run security:audit` | `PASS_WITH_ACCEPTED_RISK` |
| `git diff --check` | ok |

Não executado: `supabase:release-gate` (sem migration nesta Change), navegador real, Word, qualquer verificação em produção. Preexistente fora do escopo: `security:gate` falha por `npm audit` em dependências de desenvolvimento (SEC-14 da auditoria).

## Critérios de aceite

| Critério | Estado |
|---|---|
| Reserva expirada recuperável; recente e concorrência preservadas | Atendido (local) |
| Motivos distintos no GA4 e sem mensagem bruta | Atendido (local, unit); efeito em produção NÃO verificado |
| `proposal_viewed` sem duplicidade | Atendido por leitura e tipagem; sem teste automatizado de componente |
| Word sem caracteres inválidos; PDF e dados inalterados | Atendido (local) |
| Contratos próximos (C114, C117–C121) | Atendido (suítes passam) |
| Publicado e verificado em produção | **Pendente** (fora da autorização) |
