# Notas

- A troca muda o contexto de uso, não a conta autenticada.
- O usuário não perde projetos ao trocar; apenas muda qual biblioteca fica ativa.
- O componente cliente nunca decide autorização e não recebe dados sensíveis.
- Se a RPC ainda não tiver grant, a flag impede a exposição da ação.
