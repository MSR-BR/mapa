# Notas

- A permissão da C76 para o Orientador criar projetos próprios é preservada e
  passa a ser parte explícita do contrato.
- “Apenas features de orientador” significa não exibir controles de supervisão
  externa nos projetos próprios desse perfil; não significa remover autoria.
- Projetos criados como Orientador permanecem nesse perfil; projetos criados
  como Aluno permanecem no perfil Aluno.
- Ocultar interface é requisito de UX, não controle de segurança; C84 e C87 são
  obrigatórias para o resultado ser considerado robusto.

- A C86 não altera schema nem grants. A ativação remota e as provas de banco
  permanecem responsabilidade da C87.
- A versão do perfil acompanha toda mutação sensível; uma aba antiga recebe
  conflito em vez de agir no papel anterior.
- A consulta de autorização usa somente IDs, autoria e vínculo antes de liberar
  a consulta que contém metadados do projeto.
