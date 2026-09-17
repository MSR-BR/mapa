# Validação

- Testes positivos e negativos da matriz C82 para cada modo.
- Snapshot/asserções de que componentes proibidos não entram na árvore renderizada.
- Abertura direta, nos dois modos, de projeto próprio compatível e incompatível,
  além de projeto vinculado no modo Aluno, sem vazamento de metadados.
- Fluxo completo Rápido/Avançado e exportação de projeto próprio de Orientador.
- Asserções de ausência de orientador/supervisão no projeto próprio de
  Orientador e presença opcional no projeto de Aluno.
- Busca estática por branches `isAdvisorOwner` ainda baseados somente no perfil
  atual e por cópias antigas de perfil permanente.
- Testes de analytics com `profile_role` correto e sem e-mail/ID de projeto.
- Auditoria visual desktop/móvel, teclado e reduced motion.
- `npm run check`, security audit e `git diff --check`.

## Resultado local — 2026-09-16

- Matriz simulada aprovada para Aluno proprietário, Orientador proprietário,
  Orientador vinculado e acessos incompatíveis/terceiros negados.
- A URL direta passa primeiro pela DAL com uma projeção mínima, antes da busca
  de título, estado ou conteúdo.
- A autonomia usa `authoring_role=advisor`; trocar o modo da conta não converte
  projeto, vínculo ou supervisão.
- Todas as mutações acadêmicas do cliente enviam `role_version`; respostas
  obsoletas falham fechadas no servidor.
- `npm run test`: 113/113 testes aprovados.
- `npm run lint`, `npm run typecheck`, verificação de exportação, build
  Next.js 16.3.5 e `git diff --check`: aprovados.
- `npm run security:audit`: aprovado em 531 arquivos, 8 tabelas públicas com
  RLS e 14/14 rotas acadêmicas sob autorização centralizada.
- Não há migration na C86. A documentação atual do Supabase confirmou o modelo
  de RLS + grants; o grant remoto permanece reservado à C87.
- A ferramenta `agent-browser` não está instalada e a alternativa CUA não
  inicia porque o sandbox rejeita o caminho Dropbox com componente simbólico.
  Responsividade, foco, labels, reduced motion e ausência de componentes
  proibidos permanecem cobertos pela auditoria estática e pela suíte.
- `ACCOUNT_MODE_SWITCH_ENABLED` permanece ausente em Production, com fallback
  seguro `false`; nenhuma interface nova está exposta antes da C87.

## Resultado de produção — pendente do CPD

- Commit, deployment, smokes remotos e logs serão registrados após a publicação.
