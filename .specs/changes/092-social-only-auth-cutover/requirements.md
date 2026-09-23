# Requisitos

## Autenticação única

- Google é o único provedor público e aceito pela aplicação.
- LinkedIn, Facebook, senha, magic link e cadastro por e-mail não podem aparecer
  nem ser aceitos pelas ações públicas.
- A flag Google continua server-side e fail-closed.

## Interface e rotas legadas

- A tela de acesso mostra somente “Continuar com Google”.
- /signup, /forgot-password e /reset-password redirecionam ao login Google.
- /auth/confirm não consome OTP de cadastro ou recuperação.
- O callback OAuth aceita somente o provedor google e destinos internos.

## Conta e dados

- Não remover e-mail, usuários, identidades, senhas armazenadas, projetos,
  revisões ou preferências; a retirada inicial é reversível.
- E-mails divergentes não são mesclados automaticamente.
- Aluno, Orientador, troca de modo, autoria, supervisão e RLS não mudam.

## Supabase e segurança

- Confirmar Google ativo antes do rollout.
- Desabilitar novos fluxos de e-mail/senha no painel Auth somente depois do
  smoke Google no artefato publicado.
- Não editar auth.users nem tabelas internas diretamente.
- Manter rollback documentado sem apagar credenciais existentes.
