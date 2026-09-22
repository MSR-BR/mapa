# Critérios de aceite

1. A tela de login mostra somente Google e LinkedIn.
2. Cadastro, recuperação e redefinição por senha não são oferecidos nem aceitos
   por ações públicas da aplicação.
3. Rotas antigas retornam ao login social com explicação, sem página quebrada.
4. Cada conta existente do inventário entra por uma identidade social vinculada
   e mantém o mesmo `user.id` e os mesmos dados.
5. Uma conta nova pode ser criada por cada provedor habilitado.
6. E-mail continua disponível para perfil, avisos e convite do orientador.
7. Aluno e Orientador mantêm troca de modo, autoria, supervisão e RLS.
8. Cancelamento ou indisponibilidade de um provedor permite tentar outro, sem
   loop ou perda de rascunho.
9. Não há segredo, token ou PII nos logs e no bundle cliente.
10. E2E, segurança, lint, tipos, build, produção e CPD passam.
11. O procedimento de rollback reativa a contingência por senha sem alteração
    destrutiva das contas.
