# CPD limpo — SEO, Search Console, GA4 e Google Ads

Data: 24/09/2026  
Escopo: consolidação das Changes 096–100 e verificação pública do domínio.  
Natureza desta revisão: documentação e leitura; nenhuma configuração externa,
campanha, vínculo com Google Ads ou gasto foi criado.

## Contexto

As Changes 097–099 corrigiram a taxonomia do GA4, criaram os key events,
verificaram a propriedade de domínio no Search Console, associaram Search
Console e GA4 e consolidaram a raiz como única home canônica. A C097 permanece
em observação até 08/10/2026; a C100 ainda não foi executada.

## Problema

“Instalado” e “pronto para investir” são estados diferentes. SEO técnico,
Search Console e coleta do GA4 estão operacionais, mas ainda não existe uma
janela limpa de 14 dias nem a camada exigida para mídia paga: Consent Mode v2,
preferências revisáveis, vínculo GA4/Google Ads, conversão de Ads selecionada,
UTMs, orçamento, stop-loss e autorização de gasto.

## Decisão

- considerar SEO técnico e Search Console prontos para operação e
  acompanhamento, não como trabalho orgânico encerrado;
- considerar o GA4 pronto para coleta e análise básica, porém ainda em
  observação para atribuição e uso em otimização paga;
- manter Google Ads bloqueado até o fechamento da janela limpa em 08/10/2026,
  execução e aceite da C100 e autorização explícita de orçamento;
- não tratar key event do GA4 como conversão de Google Ads antes da criação ou
  importação formal no produto Ads;
- revisar o CPD em 09/10/2026. Se todos os gates passarem, essa é a primeira
  data recomendada para autorizar uma campanha controlada.

## Estado resumido

| Frente | Estado | Evidência | Pendência |
| --- | --- | --- | --- |
| SEO técnico | Pronto | `/` em HTTP 200; `/home.html` em 308 para `/`; uma URL no sitemap; canonical, noindex, dados estruturados e cards coerentes; Lighthouse móvel 95–96 em performance e 100 em SEO | acompanhar LCP de campo, hoje sem volume suficiente; laboratório variou entre 2,7 e 3,0 s |
| Search Console | Pronto e processando | propriedade de domínio verificada; sitemap aceito; raiz indexada; associação com GA4 confirmada | aguardar dados de consultas, páginas, cobertura e Core Web Vitals; indisponível não significa zero |
| GA4 | Pronto para coleta; em observação para aquisição | taxonomia `app_*`; `source` reservado removido; 12 dimensões; `project_start` e `project_completed` como key events; funil salvo; teste controlado sem PII e sem duplicidade | auditar 14 dias até 08/10; confirmar aquisição, duplicidade, parâmetros e funil; decidir sobre filtro de tráfego interno ainda em Testing |
| Google Ads | Não pronto para lançamento | nenhum vínculo GA4/Ads e nenhuma campanha criada | executar C100: Consent Mode v2, preferências revisáveis, política, conversão principal, UTMs, público, geografia, orçamento, CPA/estratégia, palavras negativas, stop-loss, vínculo e validação |

## O que foi concluído

- raiz pública consolidada como única URL canônica;
- redirect permanente do legado e sitemap reconciliado;
- propriedade de domínio verificada no Search Console por DNS;
- sitemap processado e vínculo Search Console–GA4 confirmado nos dois produtos;
- GA4 com Measurement ID `G-MKFYYRZG87`, dimensões `app_*`, dois key events e
  funil principal;
- evento controlado validado sem parâmetro reservado, PII ou conteúdo
  acadêmico;
- consentimento básico conservador: a tag de analytics não carrega antes do
  aceite;
- desempenho, responsividade, metadata social, dados estruturados e segurança
  da release aprovados na C099.

## O que falta fazer

1. Encerrar a observação da C097 em 08/10/2026 e emitir o comparativo dos 14
   dias pós-migração.
2. Confirmar ausência de duplicidade, atribuição limpa e parâmetros `app_*`
   populados como previsto.
3. Manter ou ativar o filtro de tráfego interno somente após prova segura; não
   ativá-lo por inferência.
4. Implementar preferência revisável e Consent Mode v2 com
   `analytics_storage`, `ad_storage`, `ad_user_data` e
   `ad_personalization`, incluindo default, update e revogação.
5. Revisar a política e a interface de privacidade para analytics e
   publicidade.
6. Definir uma única conversão primária para Ads; manter as demais como
   secundárias ou diagnósticas.
7. Definir UTMs, nomenclatura, audiência, geografia, orçamento, estratégia de
   lance, palavras negativas, limite de perda e critério de pausa.
8. Só então vincular GA4 e Google Ads, importar/criar a conversão, validar no
   Tag Assistant/DebugView e solicitar autorização explícita de gasto.

## Gate para início do Google Ads

- Planejamento: já pode ser feito sem gasto.
- Execução da C100: permanece bloqueada pelo baseline até 08/10/2026 conforme o
  roadmap aprovado.
- Primeira revisão de lançamento: 09/10/2026.
- Lançamento: somente se a revisão aprovar os dados, a C100 estiver concluída e
  houver autorização explícita de campanha e orçamento.

## Evidência pública revalidada em 24/09/2026

- `https://mapadapesquisa.com.br/`: HTTP 200;
- `https://mapadapesquisa.com.br/home.html`: HTTP 308 para a raiz;
- `robots.txt`: permite o site e bloqueia somente `/api/`;
- `sitemap.xml`: uma URL, a raiz canônica, com `lastmod` de 24/09/2026.

## Referências oficiais

- Consent Mode: https://developers.google.com/tag-platform/security/guides/consent
- Vínculo entre GA4 e Google Ads: https://support.google.com/analytics/answer/9379420
- Key events e conversões de Ads: https://support.google.com/analytics/answer/13965727
- Importação de conversões do GA4: https://support.google.com/google-ads/answer/2375435

