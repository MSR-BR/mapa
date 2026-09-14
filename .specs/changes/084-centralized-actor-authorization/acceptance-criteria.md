# Critérios de aceite

1. Não existe fallback de autorização para `student` em erro ou perfil ausente.
2. Todas as mutações acadêmicas passam por um gate de modo no servidor.
3. Acesso sem relação retorna 404 sem título ou conteúdo do projeto.
4. Modo incorreto retorna 403 tipado e nenhuma mutação ocorre.
5. Versão obsoleta retorna 409 e orienta atualizar a sessão de interface.
6. Consentimento é registrado somente para o modo lido do banco.
7. A revisão exige simultaneamente modo Orientador e vínculo real.
8. Com a flag desligada, a produção preserva o comportamento anterior.
9. Testes cobrem todas as linhas da matriz de endpoints.
