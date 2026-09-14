# Requisitos

- Adicionar link `Configurações` no menu da conta.
- Criar rota autenticada `/dashboard/settings`.
- Mostrar os dois modos, o modo atual e uma explicação curta do que muda.
- Usar rótulos de ação `Usar como Aluno` e `Usar como Orientador`.
- Exigir confirmação explícita antes de sair do modo atual.
- Enviar `expectedVersion` à Server Action/RPC e tratar conflito 409.
- Desabilitar duplo envio e tornar repetição do mesmo alvo idempotente.
- Após sucesso, revalidar o shell e redirecionar ao dashboard do novo modo.
- Atualizar outras abas por sinal local; cada aba deve buscar o modo no servidor.
- Se faltar consentimento vigente no novo modo, exibir seu gate após a troca.
- Permanecer oculto/inativo enquanto a feature flag estiver desligada.
