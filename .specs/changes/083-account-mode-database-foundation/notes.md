# Notas

- A evolução de schema é expand-only: nenhuma coluna ou tabela anterior foi
  removida ou renomeada.
- O preflight revelou que o papel atual não bastava para inferir toda a autoria
  histórica. A regra passou a considerar os vínculos existentes.
- Conta orientadora sem supervisão ou auto-orientada indica projeto criado como
  Orientador. A auto-orientação redundante é removida antes da constraint.
- Conta orientadora com supervisor terceiro indica projeto histórico criado no
  modo Aluno; o vínculo é preservado.
- Em produção, seis vínculos de auto-orientação foram removidos e um vínculo
  externo foi preservado. Propriedade, conteúdo e status não foram alterados.
- O INSERT próprio de primeiro acesso permanece compatível; o trigger garante o
  evento mesmo se uma versão anterior do app criar o perfil.
- A função de troca não depende de e-mail, JWT custom claim ou `user_metadata`.
- A RPC existe, mas seu EXECUTE continua revogado até a Change 087.
- Nenhuma tela ou ação de troca foi liberada pela C83.
- O acesso administrativo via conector/CLI continuou retornando 403; o preflight
  e a execução foram feitos pela sessão autenticada do dashboard no Safari.
- O CPD é deliberadamente separado da migration remota e requer comando
  explícito.
