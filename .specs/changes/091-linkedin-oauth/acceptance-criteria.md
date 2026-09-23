> **Status: cancelada em 22/09/2026.** O responsável decidiu não criar uma Página pública no LinkedIn e manter somente o login Google. Este arquivo permanece como histórico e não autoriza implementação ou ativação do LinkedIn.

# Critérios de aceite

1. Google e LinkedIn aparecem apenas quando suas flags estão ativas.
2. LinkedIn usa `linkedin_oidc`, autentica uma conta real e retorna pelo callback
   canônico.
3. Destinos externos ou iniciados por `//` não são aceitos no parâmetro `next`.
4. Cancelamento, recusa e falha voltam ao login com mensagem específica e sem
   loop ou perda do rascunho.
5. Conta existente com o mesmo e-mail verificado mantém o mesmo usuário, modo,
   projetos e permissões após vincular o LinkedIn.
6. E-mail diferente ou ausente não mescla contas automaticamente e fornece um
   caminho seguro de suporte.
7. Aluno e Orientador preservam troca de perfil, autoria, supervisão e RLS.
8. Nenhum segredo aparece no cliente, build, repositório ou logs.
9. Termos, Privacidade, acessibilidade, testes, build e smoke passam.
10. E-mail/senha continua disponível durante a homologação da C91.
11. A C92 permanece bloqueada até o LinkedIn estar público e a matriz de
    continuidade estar aprovada em produção.
