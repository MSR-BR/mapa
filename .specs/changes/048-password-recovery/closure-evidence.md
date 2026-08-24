# Evidências de encerramento — Change 048

- `requestPasswordReset` aponta para `/auth/confirm?type=recovery&next=/reset-password`.
- `/auth/confirm` e o callback aceitam `token_hash` com `verifyOtp` e validam o destino.
- A mensagem do formulário continua neutra para não revelar contas existentes.
- Foram cobertos o retorno por `token_hash`, o fluxo legado por callback e a rejeição
  de destinos externos; lint, typecheck, 71 testes e build passaram.
- O fluxo em produção responde em `/forgot-password` e `/reset-password`; a
  confirmação final depende do link emitido pelo Supabase, sem registrar tokens.
