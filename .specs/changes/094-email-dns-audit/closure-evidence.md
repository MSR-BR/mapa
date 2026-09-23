# Evidências de encerramento — Change 094

**Status:** concluída em 22/09/2026.

## Inventário público

- NS: `d.sec.dns.br` e `e.sec.dns.br` — DNS externo no Registro.br.
- A do domínio raiz: `76.76.21.21` — Vercel.
- AAAA: ausente; `www`: deliberadamente não publicado, conforme C38.
- MX raiz: prioridade 10 para
  `inbound-smtp.sa-east-1.amazonaws.com` — recebimento preservado.
- DKIM: `resend._domainkey` publicado.
- Return-Path `send`: MX para
  `feedback-smtp.sa-east-1.amazonses.com` e TXT
  `v=spf1 include:amazonses.com ~all`.
- DNSSEC: DS e DNSKEY publicados.
- DMARC: ausente em `_dmarc.mapadapesquisa.com.br`.

## Conclusão

SPF já está correto no subdomínio técnico usado pelo Resend. Não deve ser criado
um segundo SPF no domínio raiz: isso não melhora o alinhamento do Return-Path e
pode criar configuração incorreta. A única lacuna confirmada é DMARC, tratada na
C95 com política inicial de monitoramento.
