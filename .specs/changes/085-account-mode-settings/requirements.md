# Requisitos

- Adicionar link `Configurações` no menu da conta.
- Criar rota autenticada `/dashboard/settings`.
- Mostrar os dois modos, o modo atual e uma explicação curta do que muda.
- Explicar que ambos criam projetos rápidos/avançados: Aluno pode receber
  supervisão; Orientador cria projetos autônomos e também revisa os vinculados.
- Usar rótulos de ação `Usar como Aluno` e `Usar como Orientador`.
- Exigir confirmação explícita antes de sair do modo atual.
- Enviar `expectedVersion` à Server Action/RPC e tratar conflito 409.
- Desabilitar duplo envio e tornar repetição do mesmo alvo idempotente.
- Após sucesso, revalidar o shell e redirecionar ao dashboard do novo modo.
- Mostrar no dashboard apenas a biblioteca própria criada no perfil ativo e, no
  modo Orientador, uma seção separada para projetos de estudantes vinculados.
- Atualizar outras abas por sinal local; cada aba deve buscar o modo no servidor.
- Se faltar consentimento vigente no novo modo, exibir seu gate após a troca.
- Permanecer oculto/inativo enquanto a feature flag estiver desligada.
