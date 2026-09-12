# Evidências de encerramento — Change 078

## Coordenação e escopo

- Modelo coordenador: `gpt-5.6-sol` com raciocínio `xhigh`.
- A aplicação em produção não foi modificada nem republicada.
- A cena humana foi criada com o gerador de imagens; logo, textos, interface,
  link e QR Code foram compostos deterministicamente pelo gerador local.
- Nenhum material audiovisual de terceiro foi incorporado.

## Entrega

- MP4: `outputs/social-promo-c78/mapa-da-pesquisa-social-15s.mp4`.
- Capa: `outputs/social-promo-c78/cover.png`.
- Quadros de controle: `frame-flow.png` e `frame-final.png`.
- QR Code: `qr-mapadapesquisa.png`.
- Trilha original: `soundtrack-original.wav`.
- Fonte reproduzível: `scripts/generate-social-promo-c78.swift`.
- Manifesto e proveniência: `manifest.json` e `provenance.md`.

## Validação técnica

O relatório `technical-report.json`, produzido após abrir o MP4 final com
AVFoundation, confirmou:

- duração: `15.0` segundos;
- resolução: `1080 × 1920`;
- frame rate: `30 fps`;
- codec: H.264;
- uma trilha de áudio;
- QR Code com payload exato `https://mapadapesquisa.com.br`.

O QR isolado e o QR inserido no quadro final foram lidos por Vision antes da
aprovação. Capa, fluxo e encerramento foram inspecionados em resolução original;
a primeira exportação, verticalmente invertida, foi rejeitada e regenerada após
corrigir a transformação do canvas.

## CPD

- `swiftc -parse-as-library -typecheck scripts/generate-social-promo-c78.swift`:
  aprovado.
- `npm run check`: aprovado.
- `npm audit --audit-level=moderate`: aprovado, zero vulnerabilidades.
- `npm run security:audit`: aprovado.
- `git diff --check`: aprovado.
- Hashes SHA-256 e tamanhos registrados em `outputs/social-promo-c78/manifest.json`.
