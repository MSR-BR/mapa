# Change 034 — Recebimento direto do suporte

## Objetivo

Permitir que mensagens enviadas diretamente para `suporte@mapadapesquisa.com.br`
sejam recebidas e encaminhadas automaticamente para:

- `marioreis@id.uff.br`
- `sfranca@id.uff.br`

## Implementação

- O domínio usa o Resend Receiving e o MX raiz foi verificado no Registro.br.
- O webhook `email.received` deve apontar para
  `https://mapadapesquisa.com.br/api/inbound/resend`.
- A rota valida o webhook, filtra o destinatário `suporte@mapadapesquisa.com.br`,
  recupera corpo/cabeçalhos/anexos pela Receiving API e encaminha a mensagem para
  os dois endereços institucionais.
- O encaminhamento usa `replyTo` para o remetente original, preserva o threading
  por `In-Reply-To`/`References`, limita anexos encaminhados a 30 MB e usa uma
  chave idempotente baseada no ID do e-mail recebido.
- O segredo do webhook fica somente em `RESEND_WEBHOOK_SECRET` no ambiente da
  Vercel; nunca deve ser versionado.
- O fluxo do formulário interno permanece separado.

## Critério de encerramento

Uma mensagem enviada de fora do app para `suporte@mapadapesquisa.com.br` deve
chegar aos dois endereços institucionais, com corpo, anexos disponíveis e
preservação dos cabeçalhos de resposta. O webhook deve rejeitar assinaturas
inválidas, evitar duplicações e não expor chaves ou conteúdo em logs.
