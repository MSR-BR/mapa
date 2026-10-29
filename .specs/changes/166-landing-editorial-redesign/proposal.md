# C166 — proposta local da landing editorial

Data: 2026-10-29 (America/Sao_Paulo)
Estado: prévia local aprovada pelo responsável em 2026-10-29; publicada em produção com a correção de ditado C167.

## Enquadramento Pó Mágico

- Fonte local consultada: `po-magico` `v20261020.002`, blueprint SITE e overlay SECURITY_AND_RESILIENCE.
- Classificação: revisão visual de site existente, sem mudança de fluxo do produto ou de dados.
- Checkpoints: classificação, Change, implementação, validação, prévia aprovada e publicação concluídos; entrega registrada em `release-2026-10-29.md`.
- Modelo executor: Codex baseado em GPT-6 (variante de execução não exposta nesta sessão).
- Delta adotado: hierarquia editorial clara e diagramas próprios, inspirados pela contenção visual do projeto Titular e pela organização visual da Tykyra, com a identidade verde do Mapa.

## Contrato de conteúdo

O texto e a ordem das seções públicas permanecem: hero com a promessa e o papel da IA, dois modos de entrada, vídeo e transcrição, três etapas de funcionamento, seis produtos acadêmicos, Research Starter e revisão humana, aluno/orientador, CTA final e links legais. Os destinos `/mapa`, `/mapa?modo=avancado`, `/mapa?modo=rapido`, `/login` ou `/dashboard` foram preservados. A página ganhou navegação por âncoras e legendas para duas figuras originais.

## Proposta visual

- Tipografia ampla, espaços maiores, superfície clara e contraste escuro, em linguagem editorial inspirada na página do Titular.
- Verde institucional preservado, com azul discreto no modo Rápido para diferenciar as escolhas.
- Diagramas SVG originais do percurso da ideia ao projeto e da ligação entre fontes, objetivos, tópicos e método. Não reutilizam arte, marca ou imagens de terceiros.
- Etapas em seção escura, lista de produtos sem caixas excessivas, CTA final concentrado.
- CSS isolado por `.landing-home`; `/mapa` e a interface interna não recebem o redesenho.

## Indexação, acessibilidade e verificação

- Título, descrição, canonical, Open Graph, Twitter, JSON-LD `WebApplication`, `robots: index, follow`, `/robots.txt` e `/sitemap.xml` mantidos. Apenas `lastModified` da homepage no sitemap passa a 2026-10-29; `/mapa` mantém sua data anterior.
- HTML renderizado: um H1, H2 ordenados, âncoras com alvos existentes, imagens com texto alternativo e carregadas, sem rolagem horizontal a 390 px. O vídeo mantém legenda, transcrição e controle de velocidade.
- `next build`, TypeScript, ESLint dos arquivos alterados, teste da landing canônica e validação XML dos SVGs passaram. Logs de erro/aviso do navegador local: nenhum no momento da inspeção.
- Prévia local: `http://127.0.0.1:3101/` (o servidor precisa permanecer ativo); capturas preservadas em `~/.codex/visualizations/2026/10/06/01a10eda-341c-76b1-a181-beefcd7013ef/landing-c166/`.

## Limites e próximo gate

O desenho foi visto em 1280 px e 390 px. A inspeção não substitui teste com usuários nem validação de tráfego orgânico após a publicação. Nenhum dado, segredo, serviço de IA, Ads, GA4 ou Supabase remoto foi alterado pela prévia. O responsável aprovou esta landing com “pode publicar esta otimo”. A publicação usou a revisão com C166 e C167, recompilada com o ambiente de Produção; a prévia com integrações ausentes não foi promovida diretamente.
