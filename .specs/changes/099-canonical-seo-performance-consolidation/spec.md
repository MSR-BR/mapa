# Change 099 — Consolidação canônica, SEO e desempenho

Status: planejada; não executada

## Objetivo

Transformar a raiz na única entrada pública principal, eliminar ambiguidade de indexação e elevar a landing ao padrão de desempenho e compartilhamento do produto.

## Requisitos

- incorporar na raiz o conteúdo útil da landing sem perder Mapa Rápido/Avançado;
- redirecionar home.html para a raiz por HTTP 308;
- manter somente a raiz no sitemap com lastmod confiável;
- aplicar noindex às rotas utilitárias e revisar robots.txt;
- corrigir título duplicado e metadados;
- criar imagem social 1200×630 e Twitter summary_large_image;
- validar SoftwareApplication/WebApplication e oferta gratuita coerente;
- remover expectativa de rich result FAQ obsoleto;
- otimizar poster do vídeo, imagens responsivas e recursos não usados;
- preservar domínio canônico, autenticação, rascunho e CTA.

## Aceite

- uma URL canônica por intenção e redirect permanente de home.html;
- Lighthouse mobile acima de 90 e LCP no limiar aprovado;
- HTML publicado contém social card completo;
- sitemap, robots e Search Console concordam;
- fluxos anônimo/autenticado, rápido/avançado e vídeo passam sem regressão.

## Modelo recomendado

gpt-5.6-sol com raciocínio xhigh.
