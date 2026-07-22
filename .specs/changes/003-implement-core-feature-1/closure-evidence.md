# Evidências de encerramento — Change 003

Data: 22/07/2026.

## Resultado

- CRUD, duplicação e exclusão lógica permanecem protegidos por proprietário.
- Briefing possui limites explícitos, validação no cliente e no servidor e mensagens por campo.
- Valores válidos permanecem no formulário após rejeição do servidor.
- Alterações não salvas exibem estado visível e confirmação antes da navegação.
- Entrada central guarda o rascunho somente em `sessionStorage`; nenhuma consulta ao Supabase ocorre antes do login.
- O isolamento RLS continua coberto pelo teste autenticado de dois usuários encerrado na Change 002; a Change 003 não alterou schema ou políticas.

## Verificações

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Navegação real: formulário, indicador de alterações e diálogo de descarte confirmados.
- Responsividade: grids convertem para uma coluna em até 600 px e o shell de autenticação em até 860 px.

## Decisão

A Change 003 está encerrada. Testes abrangentes de jornada permanecem também no escopo transversal da Change 005.
