# C099 — Proveniência dos assets

Data: 24/09/2026

## Processo

Os dois assets foram compostos deterministicamente por
`scripts/generate-discovery-assets-c099.mjs`, usando `sharp`. Nenhuma imagem,
fonte ou ilustração de terceiro foi introduzida.

Fontes preservadas:

- `public/brand/mapa-da-pesquisa-wordmark.png`;
- `public/brand/mapa-da-pesquisa-app-icon.png`;
- `public/media/mapa-da-pesquisa-apresentacao-poster.png`.

## Saídas

### Card social

- arquivo: `public/brand/mapa-da-pesquisa-social-card.png`;
- dimensões: 1200×630;
- tamanho: 332453 bytes;
- SHA-256:
  `dfb1048c47e428ec91c76ceb284559cd48a202973e786c52581dec4c56e79722`;
- cópia exata:
  “Da situação-problema ao projeto de pesquisa.”,
  “Mapa Rápido ou Avançado · IA + revisão humana”,
  “COMECE SEU MAPA” e `mapadapesquisa.com.br`.

### Poster do vídeo

- arquivo: `public/media/mapa-da-pesquisa-apresentacao-poster.webp`;
- dimensões: 576×976;
- tamanho: 30060 bytes;
- SHA-256:
  `1ecb6d778c600625f50d64c1a58814ad72381643ead92e3b89c483fe7ede843f`;
- origem: conversão do poster PNG preservado, qualidade WebP 78 e effort 6.

## Verificação

- geração reproduzida pelo script;
- dimensões verificadas com `sips`;
- hashes verificados com `shasum -a 256`;
- card inspecionado visualmente;
- ambos responderam HTTP 200 no domínio canônico;
- metadados OG/Twitter apontam para o card;
- o vídeo usa o poster WebP e mantém o MP4 original.

O diretório local `outputs/social-card-c099/` é somente uma saída de trabalho
ignorada pelo Git. Os hashes canônicos permanecem neste documento versionado.
