# Change 033 — Destinatários institucionais do suporte

## Objetivo

Garantir que as mensagens enviadas pelo formulário de suporte sejam recebidas
simultaneamente por Mario Reis e Sérgio França nos respectivos e-mails
institucionais.

## Escopo

- Enviar para `marioreis@id.uff.br` e `sfranca@id.uff.br` usando a mesma chamada
  segura do Resend.
- Manter o endereço informado pelo usuário como `reply-to`, para que a equipe
  possa responder diretamente à pessoa que abriu o chamado.
- Preservar a validação, o limite antiabuso e o remetente
  `suporte@mapadapesquisa.com.br`.

## Critérios de aceite

1. Uma mensagem válida possui os dois destinatários institucionais no payload.
2. O `reply-to` permanece o e-mail informado no formulário.
3. Typecheck, lint, testes e build passam.
4. A versão pública é atualizada para `v19082026.6`.
