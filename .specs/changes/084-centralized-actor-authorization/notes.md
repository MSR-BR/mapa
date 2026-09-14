# Notas

- `cache()` pode deduplicar a leitura durante um render React, mas o modo não
  deve ser persistido em cache compartilhado entre requisições.
- O DAL entrega DTO mínimo ao cliente: modo, rótulo e versão; nunca claims ou
  campos desnecessários da conta.
- Administração de relatos continua uma permissão independente, baseada no
  controle administrativo existente.
- “Orientador” não significa somente revisor: nesse modo a conta também é autora
  de projetos autônomos. Autoria própria e revisão vinculada são contextos
  distintos e nunca devem ser inferidos apenas pelo modo.
- A flag é mecanismo de rollout, não autorização.
