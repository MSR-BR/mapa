# Evidência de encerramento — Change 063

- Causa confirmada: `promoteObjectiveId: null` era enviado pela tela e recusado
  pelo schema Zod antes de qualquer transição do workflow.
- API passou a aceitar `null` por compatibilidade com clientes em cache; a tela
  nova omite o campo quando não há promoção.
- `npm run check` aprovado: lint, typecheck, 78 testes, verificação de
  exportações e build de produção.
- Deploy limpo da produção: `dpl_8WgAsNyEEifYdMQZHVLXupNcLuF8` (READY), com
  cache ignorado e sem o arquivo local `po_magico` ou artefatos temporários.
- Smoke público: `/login` respondeu HTTP 200 e `/api/health` respondeu `status=ok`
  com os quatro provedores configurados. A varredura de logs de erro da última
  hora não encontrou registros.
- Versão pública: `v26090426.1`.
