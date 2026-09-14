# Notas

- A troca muda o contexto de uso, não a conta autenticada.
- O usuário não perde projetos ao trocar; fica ativa a biblioteca criada naquele
  perfil. No modo Orientador, a fila de revisões é uma seção adicional.
- Trocar o modo nunca altera `authoring_role` nem transforma um projeto de
  Aluno supervisionado em projeto autônomo.
- O componente cliente nunca decide autorização e não recebe dados sensíveis.
- Se a RPC ainda não tiver grant, a flag impede a exposição da ação.
