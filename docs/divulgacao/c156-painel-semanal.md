# C156 — Primeiro painel semanal de divulgação e uso

**Consulta:** 27/10/2026, 19h20–19h23 (`America/Sao_Paulo`; horário aproximado das leituras). **Estado:** relatório local, somente leitura; nenhum dia 27 parcial foi incluído. GA4: propriedade 550650234, 20–26/10/2026, dias completos em `America/Rio_Branco`, com exclusão por `sessionSourceMedium` de `codex_validation / qa` e `mapa_team / internal`. Search Console: `sc-domain:mapadapesquisa.com.br`, pesquisa web, dados **finalizados** de 20–24/10, fuso da plataforma; 25–26/10 não estavam finalizados. Ads: conta MSR-BR 383-835-9068, campanha 24325133699, 20–26/10 em `America/Sao_Paulo`, moeda EUR. GA4 usa BRL; não convertemos moedas. A [home pública](https://mapadapesquisa.com.br/) foi consultada somente leitura em 27/10, com cópia rastreada no dia anterior; mostra a entrada para criar o mapa e informa que a pessoa pode preparar a ideia sem login.

## Três indicadores principais

| Indicador | Valor observado | Leitura correta |
|---|---:|---|
| Alcance e engajamento no site (GA4) | **230 usuários ativos**, **344 sessões**, **186 sessões engajadas** (54,1% de 344) | Pessoas medidas após consentimento; sessões não equivalem a pessoas. |
| Início de projeto (GA4) | **62 eventos `project_start` por 47 pessoas medidas** | Eventos e pessoas não são projetos distintos; não é uma taxa de conversão de visitantes. |
| Avanço persistido por projeto distinto | **Indisponível** | Falta o agregado operacional definido na [C152](c152-contrato-metricas.md). `stage_completed` não resolve esse denominador. |

## Origem das sessões no GA4

| Origem / canal | Sessões | Parcela das 344 sessões | Observação |
|---|---:|---:|---|
| Direto / sem origem | 174 | 50,6% | Pode conter acessos internos sem etiqueta. |
| `uff.br / referral` | 103 | 29,9% | Referência UFF, sem equivalência automática com pessoas novas. |
| `google / organic` | 44 | 12,8% | Sessões do GA4; cliques do Search Console têm outra definição e janela. |
| `google / cpc` | 10 | 2,9% | Apenas **1 sessão** traz o ID do piloto; as outras 9 estão sem ID. Não atribuir os 2 `project_start` dessas sessões ao piloto. |
| `scanned.page / referral` | 7 | 2,0% | Possível leitura de QR; só **1 pessoa medida**, portanto amostra concentrada e origem física não comprovada. |
| Demais origens e `(not set)` | 6 | 1,7% | Classroom 2; Bing, ChatGPT, Instagram e sem origem definida 1 cada. |

As linhas de sessões somam 344. Pessoas por origem podem aparecer em mais de uma linha e **não foram somadas**. A exclusão remove apenas as duas origens etiquetadas; tráfego interno direto continua possível.

## Uso, progressão e falhas

| Evento GA4 em 20–26/10 | Ocorrências | Pessoas medidas | Interpretação |
|---|---:|---:|---|
| `stage_completed` | 175 | 33 | Etapas concluídas, com possíveis repetições por projeto/pessoa. |
| `project_completed` | 6 | 5 | Não usar como numerador contra `project_start` da semana. |
| `export_pdf_completed` | 9 | 8 | Exportações concluídas, não projetos únicos. |
| `generation_failed` | 18 | 8 | Falhas repetidas são possíveis; investigar tipo e recuperação antes de estimular retry. |
| `generation_retry` | 11 | 6 | Não há vínculo confiável aqui entre falha, retry e sucesso por tentativa. |
| `project_resumed` | 1 | 1 | Marca rascunho retomado no formulário; não mede todo retorno a projeto salvo. |

Não calculamos conclusão, exportação, recuperação ou retenção dividindo esses eventos. A coorte de projetos distintos e a ordem das ações dependem de agregado restrito do desenvolvimento, sem texto, título, e-mail ou identificadores individuais. A conexão Supabase disponível nesta tarefa não lista um projeto identificado como Mapa; não foi feita consulta a banco nem inferida uma correspondência por nome.

## Busca orgânica — Search Console

Em **20–24/10**, a propriedade de domínio registrou **52 impressões, 22 cliques, CTR de 42,3% e posição média 9,52** na pesquisa web. A janela anterior de cinco dias comparáveis, **13–17/10**, teve **10 impressões e nenhum clique**; o volume é pequeno e não permite atribuir a mudança a SEO. A página `/` respondeu por 22 cliques e 39 impressões na tabela por página; `/home.html` teve 8 impressões e nenhum clique, `/mapa` 7 e nenhum. A soma das impressões por página pode divergir do agregado da propriedade; não a usamos como total. Consultas visíveis incluem “mapa da pesquisa uff” (3 cliques/4 impressões), enquanto consultas raras são ocultadas pelo Google; as linhas de consulta não fecham os 22 cliques totais. Indexação não foi reavaliada neste ciclo; a C153 havia classificado `/home.html` como redirecionamento com canonical `/`.

## Tráfego pago — Google Ads, campanha do Mapa

Em **20–26/10**, a campanha identificada registrou **810 impressões, 60 cliques, CTR de 7,4%, custo de €14,23 e zero conversões atribuídas**. O Ads informa status `ENABLED`, serviço `SERVING`, orçamento diário de **€2** e nenhuma data de término na consulta de 27/10. Isso **contradiz o estado histórico de encerramento em 19/10**, quando a conferência de 20/10 tinha 9 impressões, zero cliques e gasto zero. A consulta diária confirma entrega entre 20 e 26/10; um registro de alteração da campanha aparece em 20/10 às 14h12 no fuso do Ads, mas a lista de campos alterados veio vazia. **Causa e responsável pela mudança não foram estabelecidos.** Nenhuma alteração foi feita nesta análise.

No GA4, `google / cpc` teve 10 sessões; só 1 veio com `sessionGoogleAdsCampaignId = 24325133699` e não foi engajada. Os 2 eventos `project_start` em `google / cpc` estavam com o ID `(not set)`. Portanto, não há início comprovadamente atribuído ao piloto, mesmo havendo tráfego pago. Os termos de busca do Ads incluem intenções amplas, como “artigos” e “tcc”; revisar relevância antes de qualquer proposta de palavra negativa, sem mudança nesta etapa. Sessões, cliques e conversões das plataformas não precisam coincidir.

## Decisões deste ciclo

| Prioridade e decisão | Evidência | Efeito esperado | Custo ou risco | Verificação e estado |
|---|---|---|---|---|
| **1. Conferir o estado do piloto com o responsável pela conta, sem alterá-lo nesta Change** | Campanha `SERVING`, 60 cliques/€14,23 após a data histórica de término; zero conversões atribuídas. | Evitar gasto não intencional e estabelecer uma base correta para próximos testes. | Conferência operacional; pausar ou alterar sem autorização específica mudaria a campanha. | Reconsultar status, datas, orçamento, alterações e gasto diário no Ads; **ação na conta não autorizada**. |
| **2. Obter o agregado de avanço por projeto da C152** | 47 pessoas medidas com início, mas GA4 não fornece projetos distintos/ordem de avanço. | Medir uso real, retenção útil e exportação com denominadores válidos. | Trabalho técnico e proteção de privacidade; não exportar linhas individuais. | Desenvolvimento entregar contagens agregadas de coortes maturadas 7/30 dias, com definições e QA; **pendente do desenvolvimento**. |
| **3. Revisar as implementações locais C154-v1 e C155-v1 separadamente** | Referência UFF trouxe 103 sessões; o cartão existente pode anunciar etapa indisponível, hipótese ainda não comprovada. | Clareza na entrada e próximo passo correto para quem já voltou. | Mudança de UI e risco de confundir efeitos se lançadas juntas. | Diff e prévia real, testes de estados, acessibilidade e aprovação de cada revisão antes de publicar; **handoffs aprovados, implementação pendente**. |
| **4. Manter observação orgânica sem reescrever SEO agora** | 52 impressões/22 cliques em cinco dias; consultas visíveis incompletas. | Detectar se o alcance não associado à marca cresce. | Baixo custo; mudanças prematuras podem prejudicar páginas. | Repetir GSC em janelas finalizadas equivalentes, separar consultas de marca e páginas; **somente monitoramento**. |

**Hipóteses:** sustentar como candidata a clareza da entrada UFF e a utilidade de um próximo passo verdadeiro no dashboard; ajustar o diagnóstico pago diante da entrega pós-19/10; não inferir eficácia de anúncios, SEO ou cartão a partir de amostras pequenas e atribuição incompleta. **Próxima leitura:** sete dias completos de GA4/Ads e os dias finalizados correspondentes do GSC, com data/hora, fusos e filtros registrados novamente. Nenhuma automação recorrente foi criada.
