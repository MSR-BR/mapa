# Validação — 23/10/2026

Estado: BUDGET_APPLIED; validação de capacidade completa pendente.

Autorização humana explícita para aumento de orçamento. Teto interno mensal elevado de US$5 para US$100 no projeto Mapa `aeaweherkrqmlqnxsmib`, sem recarga, compra, alteração de plano ou chave. Aplicado às 13:56:37 BRT; SELECT independente às 13:58:16 BRT confirmou persistência.

| Campo | Antes | Depois confirmado |
|---|---:|---:|
| Teto mensal | US$5 | US$100 |
| Valor reservado histórico | US$4,99825 | US$4,99825 |
| Tentativas aceitas | 501 | 501 |
| Saldo para novas reservas | US$0,00175 | US$95,00175 |

[Leitura estruturada](budget-readback.json) · [Captura do painel](budget-confirmed-2026-10-23.png) · [SQL guardado](budget-update.sql).

O script altera exclusivamente o teto, com trava e comparação do valor anterior. Testado localmente: segunda aplicação não altera consumo; valor inesperado aborta. O teto vale para o orçamento compartilhado Gemini/OpenAI; não cria cota diária por usuário/mapa e não aumenta cotas dos provedores.

## Dimensionamento e pendências

[capacity.json](capacity.json) explicita 50 mapas/dia × 30 dias × US$0,05 = US$75 + US$25 de margem. US$0,05 é hipótese, não custo medido de um mapa completo. Amostra observada: 62 chamadas, 52 Gemini e 10 OpenAI, custo estimado US$0,215494 em 30 minutos; não corresponde a 62 mapas nem permite medir custo por conclusão.

Faltam custo por jornada completa, cotas RPM/TPM/RPD verificadas e teste representativo de turma. Não declarar 50 conclusões garantidas. Até publicar C129, a aplicação ainda acumula reservas máximas; o teto maior dá folga, mas não corrige sozinho esse comportamento.

## Reversão

Não executada. Uma decisão futura pode reduzir somente `monthly_limit_micros`, com comparação do valor 100000000 e SELECT independente. Nunca resetar contador ou tentativas. Voltar a US$5 com o consumo atual quase esgotaria a capacidade e poderia bloquear a turma; por isso não há reversão automática. Reverter aplicação C129 não exige reverter este teto nem remover tabelas.

Gate da alteração de configuração: PASS (escopo autorizado, destino identificado, CAS local, aplicação e leitura independente). Gate de publicação C129 separado e pendente. Sem Ads/GA4, modelos, credenciais, deploy ou novas migrations remotas nesta etapa.
