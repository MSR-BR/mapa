# Evidências de encerramento — Change 042

Data de encerramento: 23/08/2026.

## Implementação

- `ResearchPromptInput` agora exibe sugestões locais de Tema, Formulação e
  Recorte a partir de oito caracteres.
- O Gemini continua sendo consultado a partir de 18 caracteres, com debounce,
  cancelamento e substituição das sugestões locais somente quando há retorno
  válido.
- O contrato do gerador foi ampliado para aceitar a categoria `recorte`.
- O fallback preserva o texto do usuário e não adiciona instituições, locais,
  períodos, populações ou métodos não informados.

## Verificações

- `npm run typecheck` — aprovado.
- `npm run lint` — aprovado.
- `npm test` — aprovado.
- Versão atualizada para `v23082026.1`.

## Limite da validação

A validação desta Change cobre o comportamento determinístico do componente e
o contrato da rota. A resposta real do Gemini continua sujeita à configuração,
limites e disponibilidade da conta de produção.
