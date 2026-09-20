# Evidências locais — Change 089

**Estado:** implementação local aprovada; rollout concluído em 19/09/2026.

## Resultado funcional

- Projeto de Aluno sem e-mail mostra um aviso destacado na primeira decisão.
- O botão de validação fica desabilitado e aponta para o campo de orientador.
- Rascunhos e navegação para trás permanecem disponíveis.
- As quatro APIs de progressão recusam validação/conclusão sem orientador com
  `student_advisor_required`.
- Com e-mail, a etapa cria revisão pendente e permanece no estado atual.
- Projeto próprio de Orientador continua autônomo.

## Defesa no banco

O PostgreSQL 17 isolado confirmou:

- salvamento de rascunho por Aluno;
- recusa de avanço direto pelo proprietário;
- recusa de revisão sem e-mail;
- aceitação da revisão pendente com e-mail correspondente;
- nova recusa de bypass pelo Aluno;
- avanço somente após aprovação da conta Orientador vinculada;
- conclusão direta de projeto `authoring_role=advisor`.

## Gates executados

- `npm run check`: lint, typecheck, 123/123 testes, PDF/DOCX e build Next.js
  16.3.5 aprovados.
- `npm run supabase:verify-student-advisor-gate`: aprovado.
- `npm run security:audit`: 557 arquivos, sem segredo ou regressão crítica;
  verificação remota registrada como pendente.
- `npm audit --offline --omit=dev`: zero vulnerabilidades no cache local.
- `git diff --check`: aprovado.

## Resultado do rollout

A migration e o código foram publicados e verificados em produção. As
evidências remotas, E2E, health, smoke, logs e CPD estão registradas em
`closure-evidence.md`.
