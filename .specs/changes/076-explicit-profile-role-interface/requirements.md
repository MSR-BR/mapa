# Requisitos

- Exibir claramente `Perfil da conta: Aluno` ou `Perfil da conta: Orientador`.
- Manter a área de trabalho como informação secundária.
- Preservar a escolha inicial e a impossibilidade de troca posterior.
- Exibir o campo de e-mail do orientador somente para o perfil Aluno.
- Não mostrar ao Orientador controles de envio ou validação destinados ao Aluno.
- Manter referências a estudante quando o Orientador estiver revisando um
  projeto de estudante, pois nesse contexto elas são corretas.
- Não alterar schema, migrations, RLS, dados acadêmicos ou vínculos existentes.
- Preservar o fluxo de criação de projetos próprios pelo Orientador.
