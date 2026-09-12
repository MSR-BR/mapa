# Evidências de encerramento — Change 081

## Resultado

- O vídeo fornecido foi incorporado à landing page pública `/home.html`, logo
  após o hero.
- O botão `Assistir ao vídeo` leva diretamente à seção `#apresentacao`.
- O player nativo usa controles, `playsInline`, dimensões declaradas, poster e
  `preload="none"`, sem autoplay.
- A seção combina resumo textual, destaques do produto e o vídeo vertical em um
  frame responsivo.
- Em telas de até 520 px, os botões do hero são empilhados para impedir overflow
  horizontal.

## Integridade e mídia

- MP4 público: 12.256.548 bytes, H.264 + AAC, 576 × 976 e 76,57 segundos.
- SHA-256 do original e da cópia pública:
  `8c1e80c2a52c7a27fd5e14805d9ed93043ce6b7609f8a643731cd3c2f841418a`.
- Poster extraído do quadro de 72 segundos: 576 × 976 e 581.754 bytes.
- A resposta local do vídeo inclui `Content-Type: video/mp4` e
  `Accept-Ranges: bytes`.
- Uma requisição `Range: bytes=0-1023` retornou `206 Partial Content` com 1.024
  bytes.

## Validação

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run test`: 96 testes aprovados.
- `npm run build`: aprovado com Next.js 16.3.5.
- `/home.html`, MP4 e poster: `200 OK` no servidor local.
- Revisão visual desktop: aprovada.
- Revisão visual móvel em 500 px: aprovada, sem recorte ou overflow.
- `git diff --check`: aprovado.

## Escopo respeitado

- Os vídeos das Changes 078 e 079 não foram alterados.
- O conteúdo do MP4 recebido não foi editado nem recomprimido.
- Nenhuma credencial, banco de dados ou configuração de produção foi alterada.
- Nenhum commit, push ou deploy foi executado; a publicação permanece pendente
  de solicitação de CPD.
