# C122 — Recuperação da descoberta, diagnóstico de falhas e Word seguro

Origem: [auditoria independente de 20/10/2026](../../audits/claude-20261020/AUDITORIA_MAPA_APP_GA4_ADS.md) (achados DSC-01, DSC-02, JR-05, EX-04). Autorização: pedido de 20/10/2026 para abrir esta Change com as correções locais da auditoria, **sem commit nem deploy**.

## Estado

`PUBLICATION_STATE: APPROVAL_PENDING`. Implementação do Claude revisada pelo Codex na Ordem 1 de 20/10; commit local autorizado, sem push ou deploy. [Revisão e nova validação](review-codex-2026-10-20.md). O pacote de publicação identifica o SHA resultante. O [patch da auditoria](../../audits/claude-20261020/local-fixes.patch) é o snapshot original sobre `f096d9f`, não um manifesto de publicação. Versão pública anteriormente observada: `v16102026.2`; proposta de próxima versão: `v20102026.1`, ainda não aplicada. Gate de produção `BLOCKED`, pelos limites registrados na revisão.

## Escopo e aceite

1. **DSC-01 — reserva "discovering" recuperável.** Uma reserva de descoberta mais antiga que 150 s (maxDuration 120 s + margem) pode ser retomada, com a mesma trava otimista por `revision`/`state`. Reserva recente continua devolvendo 409; duas retomadas simultâneas resultam em uma execução e um 409. Falha ao salvar relata a etapa `saving`.
2. **DSC-02 — falhas de descoberta diagnosticáveis.** O motivo registrado no GA4 vem do `errorCode` declarado pelo servidor e do status HTTP; cancelamento é `app_result:"cancelled"`; nenhuma mensagem bruta de exceção é exibida; o retry carrega o motivo real; o rótulo de etapa inclui "salvamento das propostas". Sem novo valor na taxonomia de motivos.
3. **JR-05 — `proposal_viewed` sem duplicidade** ao escolher um card (chaveado por `reportId`).
4. **EX-04 — Word sem caracteres de controle inválidos em XML** (`U+0000–0008`, `000B`, `000C`, `000E–001F`), preservando tab, LF e CR, sem alterar a entrada.

Fora do escopo (permanecem na auditoria): qualquer migration/Auth/RLS (SEC-01, SEC-03, SEC-05), limites de custo de IA, retry amplo de `PGRST303` (SEC-07), PDF Unicode (EX-03), exportação com revisão pendente (EX-01/02), atribuição UTM (GA-04), timeout cliente morto de 110 s (JS-01), Ads, GA4 e chaves.

## Decisões

- O prazo de 150 s é uma constante única (`DISCOVERY_CLAIM_TTL_MS`) exportada com o classificador, testada para ultrapassar `maxDuration`.
- Eventos `generation_failed` de descoberta passam a ter `app_result:"cancelled"` quando o usuário cancela; as séries do GA4 antes e depois desta Change **não são comparáveis**.
- Remoção de caracteres de controle altera apenas texto invisível em exportação Word; o PDF e o texto armazenado não mudam.
- A causa das falhas históricas de 17–18/10 continua **não comprovada**; esta Change torna as próximas ocorrências separáveis, não prova a causa.

## Arquivos

Modificados: `app/api/projects/[id]/discover/route.ts`, `modules/research-workflow/proposal-discovery-workspace.tsx`, `modules/export/docx.ts`, `package.json`.
Novos: `modules/research-workflow/discovery-failure.ts`, `modules/export/xml-safe.ts`, `scripts/verify-discovery-claim-recovery.mjs`, `tests/discovery-failure.test.ts`, `tests/docx-xml-safety.test.ts`.

## Rollback

Reverter os quatro arquivos modificados e remover os cinco novos (nenhuma migration, nenhum dado remoto). Em produção, promover o deployment anterior.

## Próximos passos (exigem autorização)

Concluir o commit local e registrar seu SHA no pacote; resolver os bloqueios técnicos e de identificação pública; obter autorização explícita para o candidato exato antes de push/deploy. Uma tentativa real de descoberta que invoque IA continua fora desta rodada e exige autorização própria. Nenhum CPD foi declarado.
