# Evidência de fechamento — Change 071

## Resultado

- O verificador autenticado não faz mais `upsert`, `INSERT` ou `UPDATE` em `user_profiles`.
- Ele confirma que cada conta de teste já possui o papel permanente esperado e falha de forma instrutiva quando isso não ocorre.
- A regra de imutabilidade da Change 064 permanece intacta.

## Check

Em 11/09/2026, concluíram com sucesso:

- `npm run check`: lint, typecheck, 84 testes, verificação de exportações e build;
- `npm run supabase:verify-advisor-student`: login das duas contas, vínculo, leitura supervisionada, bloqueio de edição indevida, comentário, solicitação de correção, 7 aprovações, mapa final e 3 referências.

O roteiro criou e removeu o projeto temporário `893d3ac7-7dc8-4989-8e0e-dbf86bfb7d49` durante a verificação.

## Deploy

Não há deploy para esta Change: ela altera somente o verificador e sua documentação; nenhuma rota, interface, migration ou configuração de produção foi modificada.
