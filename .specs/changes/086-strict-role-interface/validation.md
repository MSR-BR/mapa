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
