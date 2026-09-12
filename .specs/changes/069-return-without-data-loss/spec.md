# Change 069 — Retorno sem perda de dados

**Status:** concluída

## Objetivo

Ao voltar a uma etapa anterior e avançar sem editar o conteúdo, preservar objetivos e capítulos já existentes em vez de regenerá-los e substituir o trabalho do usuário.

## Escopo

- reutilizar objetivo geral quando a problemática não mudou;
- reutilizar objetivos específicos quando o objetivo geral não mudou;
- reutilizar Capítulo 4 quando o Capítulo 2 não mudou;
- regenerar descendentes somente depois de uma alteração real na origem;
- manter as versões existentes e a rastreabilidade atual.

## Critérios de aceite

1. Voltar de objetivos à problemática e avançar sem edição mantém o objetivo geral.
2. Voltar de objetivos específicos ao objetivo geral e avançar sem edição mantém os OEs.
3. Voltar de Capítulo 4 ao Capítulo 2 e avançar sem edição mantém o Capítulo 4.
4. Editar uma origem continua invalidando e regenerando os descendentes necessários.

## CPD

- **Check:** lint, typecheck, testes, exportação e build.
- **Persist:** reutilização preserva elementos, IDs e versões já salvas.
- **Deploy/document:** produção, health check e evidência de fechamento.
