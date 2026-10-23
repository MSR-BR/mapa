# C129 — Contabilização correta da IA

Estado: IMPLEMENTED_LOCAL; publicação pendente. Criada em 23/10/2026.

Autorização: criar C129–C134 e iniciar C129/C130; aumento de orçamento autorizado. C131–C134 apenas especificadas neste pacote. Sem commit/deploy solicitado nesta etapa.

- Reservar antes do transporte e liquidar por tokens conhecidos, com tarifa identificada; não confundir com fatura do provedor.
- Reserva e liquidação atômicas e idempotentes; isolamento por usuário autenticado e segredo apenas no servidor.
- Falha sem uso comprovado mantém reserva; liquidação falha não descarta texto válido nem repete geração.
- Preservar contador histórico e clientes antigos; nenhuma devolução retroativa estimada.

[Critérios](acceptance-criteria.md) · [Tarefas](tasks.md) · [Validação](validation.md).
