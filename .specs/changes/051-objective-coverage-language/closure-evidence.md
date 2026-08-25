# Evidência de encerramento — Change 051

## Implementação

- `OBJECTIVE_COVERAGE_LABELS` centraliza os rótulos sem alterar os valores
  persistidos `partial` e `full`.
- O seletor de grau de cobertura aparece nos capítulos 2 e 4, incluindo o
  objetivo geral no capítulo 4.
- Avisos de coerência e relações antigas de rastreabilidade traduzem os graus
  legados para a linguagem aprovada.
- O mapa final e a exportação PDF apresentam a cobertura de cada tópico por
  OE/OEG.

## Verificações

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run exports:verify`
- `npm run security:audit`
- `npm run supabase:verify`
- `npm run supabase:verify-advisor-student`
- smoke público após o deploy em `https://mapadapesquisa.com.br`

## Compatibilidade

Não houve migration nem alteração de RLS. Projetos salvos continuam aceitando
os graus `partial` e `full` e passam a exibir os rótulos atualizados.

## Versão

`v25082026.2`.
