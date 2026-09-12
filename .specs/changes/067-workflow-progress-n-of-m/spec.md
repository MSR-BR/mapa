# Change 067 — Progresso da jornada em N/M

**Status:** concluída

## Objetivo

Deixar explícita, em todas as telas principais da jornada, a macroetapa atual no formato `N/M`.

## Escopo

- indicador único com quatro macroetapas: Definição, Objetivos, Capítulos, Metodologia e encerramento;
- mostrar `Etapa N/4` em descoberta, definição, capítulos, metodologia e mapa final;
- preservar os subpassos detalhados existentes;
- manter estados e identificadores internos do workflow inalterados.

## Critérios de aceite

1. Cada workspace principal apresenta a etapa atual e o total de quatro macroetapas.
2. A definição usa 1/4 para problemática e 2/4 para objetivos.
3. Capítulos usam 3/4; metodologia e mapa final usam 4/4.
4. O indicador é acessível por navegação e marca a etapa atual.

## CPD

- **Check:** lint, typecheck, testes, exportação e build.
- **Persist:** não altera estados nem dados persistidos do workflow.
- **Deploy/document:** produção, health check e evidência de fechamento.
