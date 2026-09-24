# Relatório de auditoria — SEO, indexação e GA4

Data: 23/09/2026

## Resultado executivo

A base existe e está tecnicamente saudável em vários pontos, mas o sistema ainda não está pronto para investimento em Google Ads. O GA4 recebe dados, porém a atribuição está contaminada pelo parâmetro customizado source; não há evento principal configurado; o funil existente retorna vazio; Search Console não está vinculado nem acessível na conta auditada; e duas entradas públicas competem pelo papel de home canônica.

Veredito:

- site e GA4 operacionais: sim;
- dados confiáveis para aquisição: não;
- indexação governada por Search Console: não comprovada;
- pronto para Google Ads: não;
- alteração de produção durante a auditoria: nenhuma.

## Pontos fortes verificados

- domínio técnico da Vercel redireciona por HTTP 308 para o domínio canônico;
- raiz, home.html, robots.txt, sitemap.xml e ativos públicos respondem corretamente;
- áreas autenticadas redirecionam visitantes anônimos para login;
- GA4 usa o Measurement ID G-MKFYYRZG87 e o stream confirma tráfego nas últimas 48 horas;
- 42 eventos apareceram nos últimos 28 dias, incluindo jornada, geração, orientador, literatura, exportação e conclusão;
- as 11 dimensões customizadas estão cadastradas no GA4;
- Enhanced Measurement está ativo para page views, scroll e outbound clicks, entre outros;
- a camada de código bloqueia GA4 até a aceitação e usa allowlist para evitar PII e conteúdo acadêmico;
- a raiz obteve Lighthouse mobile 95 em desempenho, 100 em acessibilidade e 100 em SEO;
- CSP, HSTS, referrer policy e proteção de frames permanecem presentes.

## Achados priorizados

| Severidade | Achado e evidência | Impacto | Correção proposta | Prova de encerramento |
|---|---|---|---|---|
| P0 | O parâmetro customizado source sobrescreve ou confunde a origem de aquisição. O GA4 mostra sessões com source dashboard, advisor_dashboard, resume e unknown; 84 sessões ficaram em Unassigned no período, cerca de 76% do total exibido. | Atribuição orgânica e futura atribuição paga não são confiáveis. | C097: retirar source do contrato, adotar app_surface, anotar a quebra histórica e observar uma janela limpa. | Source/medium volta a conter apenas origens de aquisição; Unassigned cai para limiar aprovado em 14 dias. |
| P1 | Não há key events de negócio. O painel mostra zero key events; a única entrada na aba era purchase sem dados do stream. | O GA4 não mede ativação ou valor e não há conversão segura para importar em Ads. | C097: escolher e validar project_start, project_completed e, se estratégico, advisor_approved. | Jornada controlada gera uma ocorrência por resultado e aparece como evento principal. |
| P1 | A exploração Mapa — Jornada principal existe, mas retorna No data available no período de 28 dias. | O funil não responde às perguntas da Change 054. | C097: reconstruir passos, janela, escopo e breakdowns depois da nova taxonomia. | Teste conhecido aparece no funil e as taxas são reproduzíveis. |
| P1 | stage_number ainda usa 1–6; metodologia e final usam 6, embora a interface atual tenha quatro macroetapas e passos internos. | Relatórios por etapa não correspondem à experiência atual. | C097: separar app_macro_stage 1–4 de app_step e descontinuar stage_number sem apagar histórico. | Eventos do E2E exibem macroetapa e passo corretos. |
| P1 | GA4 não tem vínculo com Search Console. As propriedades sc-domain e URL-prefix não estavam acessíveis à conta autenticada; não há TXT público google-site-verification. | Não existe visão integrada de consultas, cliques, páginas e conversão. | C098: criar ou obter acesso à propriedade de domínio, verificar por DNS, enviar sitemap e vincular ao GA4. | Propriedade verificada, sitemap processado e vínculo visível nos dois produtos. |
| P1 | Raiz e home.html retornam 200, têm canonicals próprios e ambas estão no sitemap para a mesma marca/intenção principal. home.html tem prioridade 1 e a raiz 0,9. | Sinais de relevância, links e métricas ficam divididos; o Google pode escolher uma URL diferente. | C099: tornar a raiz a única home canônica, incorporar o conteúdo necessário e redirecionar home.html por 308. | Um único canonical indexável, um único item no sitemap e redirect permanente. |
| P1 | A landing home.html teve Lighthouse mobile 76 e LCP de 7,1 s; a raiz teve 95 e LCP de 2,9 s. O poster do vídeo usa cerca de 582 KiB, com aproximadamente 548 KiB de economia possível. | Piora experiência, descoberta e eficiência futura de campanhas. | C099: otimizar poster em AVIF/WebP responsivo, priorização/LCP e JavaScript não usado. | LCP de laboratório abaixo de 2,5–3,0 s e performance acima de 90 no perfil aprovado. |
| P2 | login retorna 200, não contém noindex e é bloqueado no robots.txt. O Google informa que URLs bloqueadas podem aparecer sem conteúdo porque o crawler não vê noindex. | URL utilitária pode aparecer no índice e consumir sinais sem utilidade. | C099: aplicar noindex às rotas de autenticação/utilidade e permitir que o crawler leia essa diretiva; manter áreas privadas sob autenticação. | HTML ou header mostra noindex e robots não bloqueia a leitura da regra. |
| P2 | O sitemap mantém lastmod fixo em 18/08/2026 apesar de alterações significativas posteriores. | O sinal perde credibilidade e não representa atualizações reais. | C099: derivar lastmod de release/conteúdo significativo ou removê-lo quando não confiável. | Datas conferem com a última alteração relevante. |
| P2 | home.html não renderiza og:image nem twitter:image; a raiz usa um wordmark 1050×289. | Compartilhamentos ficam sem imagem ou com recorte fraco. | C099: criar cartão 1200×630, declarar dimensões e usar Twitter summary_large_image. | Debuggers e HTML mostram a imagem correta, acessível e estável. |
| P2 | SoftwareApplication não contém offers.price, propriedade obrigatória para elegibilidade atual do rich result. FAQPage deixou de gerar rich result no Google em 2026. | Dados estruturados não produzem o benefício esperado e podem gerar expectativa incorreta. | C099: validar WebApplication/SoftwareApplication com oferta gratuita coerente; remover FAQPage ou mantê-lo apenas como semântica sem promessa de rich result. | Rich Results Test sem erro aplicável e documentação atualizada. |
| P2 | Filtro Internal Traffic está em Testing, não em Active. | A equipe continua contaminando relatórios padrão; os 34 usuários ativos não representam necessariamente usuários externos. | C097: validar regra interna e ativar o filtro somente após conferir a dimensão de teste e o rollback. | Tráfego interno de teste fica excluído/segmentado sem apagar tráfego legítimo. |
| P2 | Consentimento básico bloqueia o tag até aceite, porém não há controle visível para rever a preferência. No GA4, analytics_storage, ad_storage, ad_user_data e ad_personalization aparecem inativos. | A implementação atual é conservadora para analytics, mas não está pronta para mensuração ou personalização de anúncios. | C100: desenhar preferências revisáveis e Consent Mode v2 antes de vincular Ads. | Estados default/update, revogação, política e DebugView/Tag Assistant comprovados. |
| P3 | Retenção está em dois meses para eventos e 14 meses para usuários. | Explorações longitudinais acima de dois meses ficam limitadas; a configuração pode ser deliberadamente conservadora. | C097: registrar decisão de privacidade e necessidade analítica antes de manter ou mudar. | Decisão aprovada e documentada; nenhuma alteração implícita. |
| P3 | O título de home.html repete a marca por combinar título completo com template global. | Snippet menos conciso. | C099: usar título relativo ou absoluto sem duplicação. | Head final sem repetição. |

## Evidência GA4 em 16–22/09/2026

- usuários ativos: 34;
- novos usuários: 22;
- contagem de eventos: 3,1 mil;
- eventos principais: 0;
- sessões por canal: Unassigned 84, Direct 18, Organic Search 5 e Referral 3;
- source/medium incluiu unknown, dashboard, advisor_dashboard e resume;
- stream Mapa da Pesquisa — Web recebeu tráfego nas últimas 48 horas;
- 11 definições personalizadas cadastradas;
- Internal Traffic em estado Testing;
- retenção: eventos dois meses, usuários 14 meses;
- sinais de consentimento de analytics e publicidade inativos;
- zero vínculos Search Console e zero vínculos Google Ads.

## Evidência de indexação

A pesquisa pública por site:mapadapesquisa.com.br e pela marca não retornou a página oficial no mecanismo consultado; retornou materiais acadêmicos não relacionados. Esse resultado é um indício, não uma prova de ausência do índice. A prova autoritativa exige a propriedade Search Console, hoje não acessível na conta auditada.

## KPIs recomendados

Primários:

1. taxa de ativação = app_project_start dividido por usuários autenticados elegíveis;
2. taxa de conclusão = app_project_completed dividido por app_project_start em coorte de 30 dias;
3. sessões orgânicas qualificadas = sessões orgânicas engajadas em landing canônica divididas por sessões orgânicas.

Diagnósticos:

- login success rate;
- geração concluída/falha;
- avanço por macroetapa e passo;
- bloqueio por validação ou aprovação;
- uso de Mapa Rápido/Avançado;
- aprovação do orientador;
- exportação concluída;
- consulta orgânica, landing page, país, dispositivo e Core Web Vitals.

Guardrails:

- zero PII/conteúdo acadêmico no GA4;
- zero eventos antes do consentimento aplicável;
- source/medium sem valores internos do produto;
- tráfego interno controlado;
- duplicidade de eventos abaixo de 1%;
- taxa de erro/bloqueio acompanhada por etapa.

## Gate para Google Ads

Google Ads permanece bloqueado até concluir C097–C099 e observar pelo menos 14 dias de baseline limpo. C100 prepara consentimento, link, conversão principal, UTMs, orçamento, geografia, palavras negativas e stop-loss; a campanha só pode ser criada após nova autorização explícita.

## Referências oficiais

- Canonicalização: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Noindex versus robots: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Sitemap e lastmod: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- SoftwareApplication: https://developers.google.com/search/docs/appearance/structured-data/software-app
- Atualizações de rich results: https://developers.google.com/search/updates
- Dimensões personalizadas GA4: https://support.google.com/analytics/answer/14240153
- Enhanced Measurement: https://support.google.com/analytics/answer/9216061
- Consent Mode: https://developers.google.com/tag-platform/security/concepts/consent-mode
