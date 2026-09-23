# Critérios de aceite

1. A tela de login mostra somente Google.
2. LinkedIn e formulário de e-mail/senha estão ausentes do bundle e da UI.
3. Cadastro, recuperação e redefinição por senha não possuem Server Actions.
4. Rotas antigas redirecionam ao login Google com explicação.
5. Callback aceita somente Google e sanitiza next.
6. Uma conta Google existente entra, sai e retorna preservando seus dados.
7. E-mail continua disponível para perfil, avisos e vínculo do orientador.
8. Aluno e Orientador preservam modos, autoria, supervisão e RLS.
9. Nenhum segredo, token ou PII aparece em código, bundle ou logs.
10. Testes, segurança, build, preview, produção, logs e CPD passam.
11. Rollback pode reabrir temporariamente senha sem recriar usuários.
