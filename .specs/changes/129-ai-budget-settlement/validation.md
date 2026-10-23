# Validação local — 23/10/2026

Estado: IMPLEMENTED_LOCAL. Não publicada. Migration remota não aplicada.

- `npm test`: PASS, 280 testes (213 + 13 + 50 + 4), além dos harnesses data-api, sugestões autenticadas e lembretes.
- Após centralizar os avisos contábeis no observador e incluir C131–C134: `npm run test:ai` PASS 50/50; `npm run typecheck` PASS; `npm run lint` PASS, com um warning preexistente em tests/foundation.test.mjs.
- `supabase:verify-explicit-grants`: PASS (24 funções, 26 migrations, 14 tabelas).
- `supabase:verify-explicit-grants-local`: PASS, todas as 26 migrations em PostgreSQL 17 Docker descartável, sem rede.
- `supabase:verify-ai-settlement-local`: PASS em PostgreSQL descartável. Reserva idempotente; isolamento de proprietário/segredo; ACL sem anônimo/service_role/acesso direto; 50 admissões concorrentes respeitam teto; 50 liquidações repetidas devolvem uma única vez; concorrência mista concilia ledger; custo acima da reserva é registrado e bloqueia novas admissões; liquidação alcança o mês original; reservas legadas preservadas. CAS C130 idempotente e rejeita configuração inesperada.
- `security:audit`: PASS_WITH_ACCEPTED_RISK, sem novas falhas. Avisos existentes: limitação por instância, ausência de antivírus de anexos e verificações remotas não realizadas.
- `git diff --check`: PASS.
- `npm run build -- --webpack`: PASS com Next 16.4.2. O build Turbopack local ficou impedido pela restrição de porta do sandbox, depois de resolver o acesso às fontes públicas; não foi usado como evidência de falha do aplicativo.

A falha inicial da suíte era a contagem antiga do inventário; atualizada para os objetos adicionais. A auditoria também exigiu centralizar os novos avisos sanitizados, corrigido sem expor erro RPC ou conteúdo.

Logs disponíveis em [evidence](evidence). Testes sintéticos, nenhuma API de IA paga. Concorrência contábil não comprova 50 jornadas completas. Publicação e smoke do novo contrato ficam para um candidato exato de release.

## Antes de publicar

1. Rever o diff e a migration aditiva `20261023165336_c129_ai_budget_settlement.sql`.
2. Preparar candidato exato, build limpo e gate de publicação; confirmar destino, backup de definições e ausência de drift.
3. Aplicar primeiro a migration e confirmar grants/assinaturas; publicar depois a aplicação. Inverter a ordem bloqueia geração por falta da RPC v2.
4. Conferir uso e saldo por metadados. Se reverter o app, manter o ledger/migration; RPC legada continua compatível. Não apagar reservas nem reembolsar histórico estimado.

Uso ausente, modelo divergente e falha de liquidação mantêm a reserva conservadora; não há restituição automática por timeout. Custo é estimativa por tokens e tarifa aprovada, não fatura. Tarifas/modelos não foram alterados. Riscos de alias não reconhecido e reservas incertas ficam explícitos; não são contabilizados como custo zero.
