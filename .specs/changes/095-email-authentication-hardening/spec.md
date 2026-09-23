# Especificação — Change 095

## Alteração autorizada

- Host: `_dmarc`.
- Tipo: `TXT`.
- Valor: `v=DMARC1; p=none; rua=mailto:suporte@mapadapesquisa.com.br`.
- TTL: padrão do Registro.br.

`p=none` inicia observação sem rejeitar nem colocar em quarentena mensagens
legítimas. O endereço de relatórios usa o recebimento já homologado do suporte.

## Validação

1. Confirmar exatamente um registro DMARC público.
2. Revalidar NS, A, MX raiz, SPF de `send`, DKIM e DNSSEC.
3. Confirmar site/health e envio/recebimento sem regressão.
4. Observar relatórios antes de propor `quarantine` ou `reject`.

## Rollback

Remover somente o TXT `_dmarc` criado nesta Change. Não alterar os demais
registros da zona.
