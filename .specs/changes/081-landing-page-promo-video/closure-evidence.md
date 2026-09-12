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

## CPD e produção

- Gate oficial `npm run check`: aprovado, incluindo lint, tipos, 96 testes,
  exportação e build Next.js 16.3.5.
- `npm audit --audit-level=moderate`: zero vulnerabilidades.
- `npm run security:audit`: aprovado.
- Commit de implementação: `d212165`.
- Push: branch remota `codex/change-003-004` atualizada.
- Deployment: `dpl_G8kNnBN9DayztcX1VM3U9EbuwUUU`, estado READY e alvo
  Production.
- Artefato:
  `https://mapadapesquisa-46zyde7ka-msr-brs-projects.vercel.app`.
- Domínio canônico: `https://mapadapesquisa.com.br`.
- `/home.html`, MP4 e poster retornaram HTTP 200 em produção.
- A landing publicada contém a seção, o CTA, o MP4 e o poster esperados.
- A requisição parcial do vídeo retornou HTTP 206 para os bytes 0–1023.
- `/api/health` retornou `status=ok`, com Gemini, Resend, Research Starter e
  Supabase configurados.
- A inspeção visual do domínio publicado foi aprovada.
- Nenhum log de erro foi encontrado no período pós-deploy inspecionado.

## Escopo respeitado

- Os vídeos das Changes 078 e 079 não foram alterados.
- O conteúdo do MP4 recebido não foi editado nem recomprimido.
- Nenhuma credencial, banco de dados ou configuração de produção foi alterada.
