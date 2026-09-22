# Critérios de aceite

1. Google, Facebook e LinkedIn aparecem apenas quando suas flags estão ativas.
2. Facebook autentica uma conta de teste real e retorna pelo callback canônico.
3. LinkedIn usa `linkedin_oidc`, autentica uma conta real e retorna pelo callback
   canônico.
4. Destinos externos ou iniciados por `//` não são aceitos no parâmetro `next`.
5. Cancelamento, recusa e falha voltam ao login com mensagem específica e sem
   loop ou perda do rascunho.
6. Conta existente com o mesmo e-mail verificado mantém o mesmo usuário, modo,
   projetos e permissões após vincular cada provedor.
7. E-mail diferente ou ausente não mescla contas automaticamente e fornece um
   caminho seguro de suporte.
8. Aluno e Orientador preservam troca de perfil, autoria, supervisão e RLS.
9. Nenhum segredo aparece no cliente, build, repositório ou logs.
10. Termos, Privacidade, acessibilidade, testes, build e smoke passam.
11. E-mail/senha continua disponível durante a homologação da C91.
12. A C92 permanece bloqueada até os dois provedores estarem públicos e a matriz
    de continuidade estar aprovada em produção.
