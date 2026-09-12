# Change 068 — Coerência orientativa sem travar o fluxo

**Status:** concluída

## Objetivo

Impedir que regras acadêmicas de coerência travem a construção do mapa. O sistema deve explicar o que merece revisão, preservar o aviso e permitir o avanço.

## Escopo

- converter validações semânticas de problemática, objetivos, capítulos e metodologia em avisos persistidos;
- permitir encerramento do mapa com findings orientativos;
- manter erros técnicos, autenticação, concorrência, formato inválido e estado indevido como bloqueios reais;
- apresentar os antigos bloqueios finais como sugestões de revisão.

## Critérios de aceite

1. Cobertura incompleta, associação desatualizada, justificativa curta e redação acadêmica imperfeita não retornam `422` ao validar uma etapa estruturada.
2. Esses pontos são preservados como avisos no workflow e no mapa final.
3. O usuário pode encerrar o projeto com avisos.
4. Requisições inválidas, estado incorreto e falhas de infraestrutura continuam falhando com segurança.

## CPD

- **Check:** lint, typecheck, testes, exportação e build.
- **Persist:** findings orientativos permanecem no workflow e na exportação final.
- **Deploy/document:** produção, health check e evidência de fechamento.
