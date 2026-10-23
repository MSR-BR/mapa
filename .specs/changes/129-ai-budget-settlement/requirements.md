# Requisitos

1. Reservar antes do transporte e liquidar por tokens conhecidos, com tarifa identificada; não confundir com fatura do provedor.
2. Reserva e liquidação atômicas e idempotentes; isolamento por usuário autenticado e segredo apenas no servidor.
3. Falha sem uso comprovado mantém reserva; liquidação falha não descarta texto válido nem repete geração.
4. Preservar contador histórico e clientes antigos; nenhuma devolução retroativa estimada.

Não alterar Ads/GA4, chaves, textos dos usuários ou controles de orientação. Sem quota diária de mapas.
