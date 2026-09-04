# Change 063 — Correção das ações de objetivos

**Status:** concluída

## Objetivo

Corrigir a regressão introduzida na revisão e promoção de objetivos que fazia a
API rejeitar ações legítimas da etapa de objetivos específicos com “Operação
inválida”.

## Escopo

- Aceitar `promoteObjectiveId` nulo quando o usuário ainda não promoveu um objetivo.
- Omitir o campo opcional no payload novo da tela.
- Preservar o fluxo de voltar, salvar, remover e validar objetivos.
- Manter a promoção de um objetivo específico para objetivo geral funcionando.
- Adicionar uma proteção de regressão ao teste estrutural da Change 011.
