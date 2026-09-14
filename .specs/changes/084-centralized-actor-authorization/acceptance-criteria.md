# Critérios de aceite

1. Não existe fallback de autorização para `student` em erro ou perfil ausente.
2. Todas as mutações acadêmicas passam por gate de modo, autoria e relação.
3. Acesso sem relação retorna 404 sem título ou conteúdo do projeto.
4. Modo incorreto retorna 403 tipado e nenhuma mutação ocorre.
5. Versão obsoleta retorna 409 e orienta atualizar a sessão de interface.
6. Consentimento é registrado somente para o modo lido do banco.
7. Aluno e Orientador conseguem criar e operar integralmente projetos próprios
   cujo `authoring_role` corresponda ao modo ativo.
8. Somente projeto de Aluno aceita orientador e fluxo de supervisão.
9. Projeto próprio de Orientador conclui o fluxo sem aprovação externa.
10. A revisão exige simultaneamente modo Orientador, vínculo real e projeto
    criado como Aluno.
11. Duplicação e integração não cruzam nem alteram o perfil de autoria.
12. Com a flag desligada, a produção preserva o comportamento anterior.
13. Testes cobrem todas as linhas da matriz de endpoints.
