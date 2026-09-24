# C099 — Evidência de implementação e CPD

Data: 24/09/2026

## Resultado

A raiz é a única home pública canônica. O conteúdo útil da landing, o início
Rápido/Avançado e o vídeo foram consolidados em `/`; `/home.html` redireciona
permanentemente; sitemap, robots, noindex, metadados sociais e dados
estruturados estão coerentes.

Commits funcionais:

- `c3d93f3` — consolidação canônica, assets e controles de indexação;
- `5b33f1c` — estabilização do LCP e imagens responsivas.

Produção:

- deployment: `dpl_5fuuXKdrcddu8FsNzQDBuyVh4Sex`;
- URL técnica: `https://mapadapesquisa-51ccknwgn-msr-brs-projects.vercel.app`;
- domínio: `https://mapadapesquisa.com.br`;
- versão: `v24092026.1`;
- estado Vercel: READY.

## CPD

### Contexto

A C098 confirmou duas páginas no sitemap e duas homes autocanônicas. A landing
`/home.html` tinha Lighthouse móvel 76 e LCP de 7,1 s; a raiz tinha
performance 95 e LCP de 2,9 s.

### Problemas tratados

- intenção pública dividida entre `/` e `/home.html`;
- sitemap e canonicals contraditórios;
- rotas com noindex também bloqueadas no robots, impedindo a leitura da
  diretiva pelo crawler;
- título duplicado e card social sem formato 1200×630;
- JSON-LD e oferta gratuita sem uma prova integrada na página;
- poster de vídeo com 568 KB;
- logos enviados muito acima da dimensão renderizada;
- troca tardia de fonte afetando a estabilidade do LCP em rede móvel lenta.

### Decisões

- preservar `/` como única URL indexável e usar 308 no legado;
- manter páginas privadas crawlable, porém com noindex por metadata e
  `X-Robots-Tag`; somente `/api/` permanece bloqueada no robots;
- publicar WebApplication com Offer gratuito coerente com o texto visível;
- não inventar rating, review ou elegibilidade a rich result;
- usar card social e poster gerados deterministicamente;
- usar fonte `optional`, retirar preload da fonte mono e declarar `sizes`
  reais nos logos;
- medir mais de uma amostra de produção e registrar a variância, sem escolher
  somente o melhor resultado.

## Gates locais

- `npm run check`: lint, tipos, 129/129 testes, PDF/DOCX e build aprovados;
- `npm run security:audit`: todos os checks estáticos aprovados; permaneceu
  apenas o aviso esperado sobre E2E/RLS remoto depender de credenciais;
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades;
- `git diff --check`: aprovado;
- auditoria rápida de segurança: 12 arquivos inspecionados, zero gatilhos
  sensíveis;
- release gate: PASS; não houve migration, schema, alteração de autorização,
  segredo ou provedor.

## Evidência HTTP e funcional em produção

- `/`: HTTP 200, canonical `https://mapadapesquisa.com.br`;
- `/home.html`: HTTP 308, `Location: /`;
- `/login`: HTTP 200 e
  `X-Robots-Tag: noindex, nofollow, noarchive`;
- `/sitemap.xml`: uma URL, somente a raiz, lastmod 24/09/2026;
- `/robots.txt`: allow da raiz e disallow somente de `/api/`;
- `/api/health`: status ok, versão `v24092026.1`, quatro integrações
  configuradas;
- social card: HTTP 200, `image/png`, 332453 bytes;
- poster: HTTP 200, `image/webp`, 30060 bytes;
- HTML: OG 1200×630, Twitter large card, WebApplication, Offer BRL 0 e ausência
  de FAQPage;
- emulação CDP 390×844: largura interna, client e scroll iguais a 390; sem
  overflow; login, Rápido e Avançado presentes; sem overlay Next;
- alternância para Mapa Rápido: `aria-expanded=true`, textarea presente,
  Avançado recolhido;
- vídeo: MP4 preservado, poster WebP e `preload=none`;
- logs: nenhum erro e nenhum HTTP 500 no deployment final.

O caminho anônimo foi exercitado em produção. A continuidade autenticada,
callback seguro e redirecionamento de sessão permaneceram cobertos pela suíte
de regressão; não foi criada sessão Google artificial para o teste.

## Lighthouse móvel

Produção final, duas amostras independentes:

| Amostra | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 96 | 100 | 96 | 100 | 2,7 s | 0 | 30 ms |
| 2 | 95 | 100 | 96 | 100 | 3,0 s | 0 | 3 ms |

O gate de performance acima de 90 passou e o LCP caiu mais de 58% em relação
aos 7,1 s da landing antiga. O valor de laboratório ainda oscila acima do
limiar “bom” de 2,5 s; por isso permanece como observação de campo, não como
alegação de Core Web Vitals aprovado. A ausência de dados de campo no Search
Console continua distinta de zero ou aprovação.

## Search Console

O sitemap absoluto foi reenviado na propriedade
`sc-domain:mapadapesquisa.com.br`. O provedor respondeu “Sitemap submitted
successfully”, status Success, e a contagem passou de duas para uma página
descoberta, coerente com o XML publicado.

## Rollback

- código: retornar ao commit `a8033eb`;
- Vercel: promover
  `dpl_9Cbsri68KvXY6t4ppoPsn2WtqNz4`, último deployment de produção anterior
  à C099;
- configuração: restaurar `NEXT_PUBLIC_APP_VERSION=v22092026.3`;
- não há rollback de banco, DNS, autenticação ou dados.
