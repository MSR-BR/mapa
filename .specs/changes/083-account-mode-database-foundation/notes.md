# Notas

- A migration é expand-only: nenhuma coluna/tabela existente é removida ou
  renomeada.
- O backfill de `authoring_role` é seguro somente antes de liberar a troca de
  modo, pois o papel atual ainda representa o contexto em que o projeto nasceu.
- A migration não altera propriedade, conteúdo, status ou vínculos; se encontrar
  conflito histórico, deve parar para reconciliação auditável.
- O INSERT próprio de primeiro acesso permanece compatível; o trigger garante o
  evento mesmo se uma versão anterior do app criar o perfil.
- A função de troca não deve depender de e-mail, JWT custom claim ou
  `user_metadata`.
- Se o preflight remoto divergir das migrations locais, a execução para e uma
  Change de reconciliação precede esta migration.
