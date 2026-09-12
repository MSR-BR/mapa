# Evidências de encerramento — Change 079

## Resultado criativo

- Modelo coordenador: `gpt-5.6-sol` com raciocínio `xhigh`.
- A C78 foi preservada byte a byte; o MP4 original mantém SHA-256
  `bd844d18ca7ee994f8b40459a10fd59173b7ea32a5f08c5ad476ccde2c5e5448`.
- O novo anúncio possui quatro atos: interrupção, transformação, valor e
  conversão.
- O gancho `TRAVOU?` está visível no quadro de `0,28 s`.
- O produto protagoniza a transformação por meio de um mockup com as quatro
  macroetapas reais.
- A mensagem de valor explicita IA, Orientador e controle do usuário.
- O encerramento preserva logo, CTA, link e QR Code até o último quadro.

## Música

A faixa simples da versão anterior foi substituída por uma faixa eletrônica
instrumental gerada para anúncios de app no catálogo Astral do HeyGen, ID
`aa1ba64cd12042e89800c7356498ff40`. O arquivo-fonte tem dois canais, 44,1 kHz e
38 segundos; o vídeo usa os primeiros 15 segundos com fade de 0,12 s na entrada
e 0,65 s na saída. Nos 15 segundos usados, a análise registrou pico de
`-1,85 dBFS` e RMS de `-20,35 dBFS` antes do fade final.

## Validação visual e técnica

- `frame-hook.png`, `cover.png`, `frame-product.png`, `frame-value.png` e
  `frame-final.png` foram inspecionados em 1080 × 1920.
- Vision leu o QR isolado e dentro do quadro final como
  `https://mapadapesquisa.com.br`.
- AVFoundation confirmou MP4 H.264, 15 segundos, 1080 × 1920, 30 fps e uma
  trilha de áudio.
- Logo, textos, interface, URL, QR Code e safe areas foram compostos de forma
  determinística; a geração visual foi limitada à cena humana de abertura.
- Manifesto, hashes e proveniência estão em `outputs/social-promo-c79/`.

## CPD

- Typecheck do gerador Swift: aprovado.
- `npm run check`: aprovado, incluindo lint, tipos, 95 testes, exportações e
  build Next.js 16.3.5.
- O primeiro gate detectou apenas uma expectativa textual do teste novo; ela foi
  ajustada às duas linhas reais de composição e o gate completo foi repetido.
- `npm audit --audit-level=moderate`: zero vulnerabilidades.
- `npm run security:audit`: aprovado.
- `git diff --check`: aprovado.
- A aplicação em produção não foi modificada nem republicada.
