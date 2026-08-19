# Change 034 — Recebimento direto do suporte

## Objetivo

Permitir que mensagens enviadas diretamente para `suporte@mapadapesquisa.com.br`
sejam recebidas e encaminhadas automaticamente para:

- `marioreis@id.uff.br`
- `sfranca@id.uff.br`

## Escopo pendente

- Escolher e configurar o mecanismo de recebimento de e-mail compatível com o
  domínio (Resend Receiving ou provedor de caixas postais).
- Configurar os registros DNS/MX exigidos sem interromper SPF e DKIM usados para
  envio.
- Testar uma mensagem externa para `suporte@mapadapesquisa.com.br` e confirmar a
  entrega nos dois destinatários.
- Manter separado o fluxo do formulário interno, que já envia via Resend.

## Critério de encerramento

Uma mensagem enviada de fora do app para `suporte@mapadapesquisa.com.br` deve
chegar aos dois endereços institucionais, com preservação dos cabeçalhos de
resposta e sem expor chaves ou conteúdo em logs.
