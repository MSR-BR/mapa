# Evidências de encerramento — Change 089

**Status:** concluída em 19/09/2026.

## Resultado funcional

- Projeto criado como Aluno pode ser editado e salvo como rascunho sem vínculo.
- O primeiro avanço exige o e-mail do Orientador e cria uma revisão pendente.
- A etapa permanece no mesmo estado até a aprovação da conta vinculada.
- As quatro APIs de progressão usam o mesmo gate.
- O trigger do PostgreSQL impede bypass pela Data API.
- Projeto criado como Orientador continua autônomo.
- O smoke visual corrigiu a última mensagem “supervisão opcional” para
  “supervisão obrigatória para avançar”.

## Migration de produção

- Projeto Supabase: `aeaweherkrqmlqnxsmib`.
- Migration:
  `20260919123000_c089_require_student_advisor_approval.sql`.
- A CLI autenticada retornou HTTP 403 por privilégio insuficiente de
  organização; nenhuma alteração foi feita por esse caminho.
- O SQL Editor autenticado foi confirmado no projeto correto.
- Antes da aplicação, função e trigger retornaram `false/false`.
- O editor recebeu os 7.017 caracteres do arquivo; as 176 diferenças detectadas
  eram exclusivamente normalizações `LF→CR`, sem qualquer outra divergência.
- A transação retornou “Success. No rows returned”.
- Depois da aplicação, função e trigger retornaram `true/true`.

## E2E e RLS

- E2E aluno–orientador: `status=ok`, 8 revisões, 7 aprovações e cleanup.
- O avanço do Aluno sem orientador foi recusado sem alterar o workflow.
- Vínculo, leitura, correção, aprovações, conclusão, referências e isolamento
  foram aprovados.
- Exportações do Aluno: DOCX 11.901 bytes; PDF 426.797 bytes.
- Exportações do Orientador: DOCX 11.904 bytes; PDF 426.797 bytes.
- Matriz RLS consciente do modo: 15 verificações aprovadas.
- Matriz autenticada entre proprietários: 6 verificações aprovadas.
- Acesso anônimo a projetos e workflows: negado como esperado.

## Gates

- `npm run check`: lint, typecheck, 123/123 testes, exportações e build
  Next.js 16.3.5 aprovados.
- `npm run supabase:verify-student-advisor-gate`: PostgreSQL 17 aprovado.
- `npm run security:audit`: aprovado; a verificação remota foi executada
  separadamente.
- `npm audit --offline --omit=dev`: zero vulnerabilidades no cache local.
- `git diff --check`: aprovado.

## Produção e CPD

- Versão: `v19092026.1`.
- Deployment final: `dpl_DHKUXF8BMmtdBjd2tTDQ5SFZRYYe` — READY.
- Artefato:
  `https://mapadapesquisa-os80lafz1-msr-brs-projects.vercel.app`.
- Alias: `https://mapadapesquisa.com.br`.
- Health: `status=ok`; quatro provedores configurados.
- Research Starter: HTTP 200, três referências.
- Gemini: `gemini-3.6-flash`, schema 1.0.0 válido.
- Logs: nenhum erro e nenhum HTTP 500 nos 15 minutos pós-rollout.
- Smoke autenticado: perfil Aluno, cópia obrigatória correta e versão pública
  correta; sessão sintética encerrada ao final.

## Commits

- `96a8777` — implementação funcional e proteção no banco.
- `3366d8c` — versão pública do rollout.
- `9ce3d5f` — correção da cópia identificada no smoke autenticado.

## Roll-forward

O código pode ser corrigido por novo deployment. Alterações no trigger, RLS ou
funções devem usar migration aditiva; migrations já aplicadas não devem ser
editadas ou revertidas destrutivamente.
