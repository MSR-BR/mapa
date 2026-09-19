# Critérios de aceite

1. Projeto de Aluno sem orientador mostra a exigência na primeira decisão.
2. O aluno pode editar e salvar rascunhos, mas o botão de validar fica
   indisponível até o e-mail ser salvo.
3. Uma chamada direta à API de validação sem orientador recebe conflito
   `student_advisor_required` e não altera o workflow.
4. Com e-mail informado, validar cria revisão pendente e não avança a etapa.
5. Somente a aprovação da conta vinculada avança o workflow.
6. A Data API recusa avanço direto do proprietário de projeto estudantil.
7. Navegação para trás e salvamento de rascunho continuam permitidos.
8. Projeto próprio de Orientador valida e avança sem supervisor externo.
9. Testes, lint, tipos, build, segurança e PostgreSQL isolado passam.
10. Migration remota e produção só são encerradas após autorização e validação.
