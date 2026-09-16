# Validação

- Testes de Server Action/RPC: sucesso A→O, O→A, no-op, versão obsoleta e papel
  inválido.
- Teste de que o logout não é chamado durante a troca.
- Teste de revalidação e destino do redirect.
- Teste das duas bibliotecas próprias e da fila vinculada do Orientador após
  trocas sucessivas, sem alteração de autoria ou supervisão.
- Teste de duas abas: evento local apenas dispara refresh; servidor decide modo.
- Auditoria de acessibilidade, foco, labels, confirmação e reduced motion.
- Viewports desktop e móvel.
- `npm run check`, security audit e `git diff --check`.
- Preview/Production com flag desligada.

## Resultado local — 2026-09-16

- `npm run check`: aprovado, com 107 testes e build de produção no Next.js
  16.3.5.
- `npm run security:audit`: aprovado em 529 arquivos, 8 tabelas públicas com
  RLS e 14/14 rotas acadêmicas sob autorização centralizada.
- `npm run supabase:verify-account-mode-settings`: aprovado em PostgreSQL 17
  isolado para Aluno→Orientador, Orientador→Aluno, replay idempotente, conflito
  de versão e preservação de autoria.
- `npm run lint`, `npm run typecheck`, `npm run test` e `git diff --check`:
  aprovados após a revisão final dos componentes React.
- Smoke HTTP local: raiz `200`, configurações anônimas `307` para `/login` e
  página de login `200`.
- A captura visual autenticada não pôde ser automatizada no ambiente atual
  porque o navegador de teste não está instalado e a alternativa CUA não
  aceita o caminho Dropbox com componente simbólico. A rota permanece oculta
  pela flag e os contratos de UI estão cobertos pela suíte estática.
- `ACCOUNT_MODE_SWITCH_ENABLED` permanece `false` por padrão. O grant remoto da
  RPC continua deliberadamente revogado até a C87; portanto, a troca ainda não
  fica exposta em produção.
