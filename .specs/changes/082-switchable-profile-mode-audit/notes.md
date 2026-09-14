# Notas

- A conta autenticada é a identidade; `Aluno` e `Orientador` passam a ser modos
  de operação escolhidos pelo próprio usuário.
- Por requisito de produto, toda conta autenticada pode usar os dois modos. Não
  será criada uma tabela de “habilitações” sem uma regra real de elegibilidade.
- Se no futuro houver credenciamento institucional de orientadores, isso deve
  ser uma autorização separada do modo ativo e exige nova Change.
- O nome físico `active_role` será mantido para reduzir risco de migration; o
  contrato e os comentários passarão a tratá-lo como modo ativo.
- Os dois modos possuem autoria. O diferencial do Orientador é criar projetos
  autônomos e também revisar projetos de estudantes vinculados.
- Cada projeto registra `authoring_role`; esse valor não muda com a troca de
  modo e impede que um projeto de Aluno contorne a supervisão.
- As regras anteriores de imutabilidade permanecem válidas em produção até a
  conclusão coordenada da C88.
