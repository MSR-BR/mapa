# Evidências de encerramento — Change 029

- `QuickStartForm` recupera rascunhos recentes sem depender exclusivamente de
  `resume=1`.
- O `localStorage` não é apagado antes da confirmação de criação; a limpeza é
  feita por `PendingProjectCleanup` na página do projeto.
- Rascunhos expirados ou inválidos continuam sendo descartados com segurança.
- Verificações executadas: `npm run typecheck`, `npm run lint` e `npm test`.
- Versão liberada: `v19082026.1`.
