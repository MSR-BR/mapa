# C152 — Base de ativação e avanço

**Consulta:** 27/10/2026, 18h20–18h21 (America/Sao_Paulo). **Estado:** baseline de mensuração concluída; taxa por projeto distinto ainda indisponível. Nenhuma configuração externa ou código do produto foi alterado.

## Resultado que já pode orientar decisões

De **06 a 26/10/2026**, o GA4 contou **239 usuários ativos, 454 sessões e 260 sessões engajadas** após excluir as origens etiquetadas `codex_validation / qa` e `mapa_team / internal`. A taxa de engajamento observada foi **57,3% (260/454 sessões)**. Trata-se apenas de pessoas que aceitaram métricas; acessos internos sem etiqueta podem permanecer, especialmente no tráfego direto.

No **funil sequencial de novos visitantes medidos**, **225 pessoas** tiveram `first_visit`; **67** tiveram `login_success` depois disso; **45** tiveram `project_start` depois do login, tudo dentro da janela consultada. Assim, **20,0% (45/225)** dos novos visitantes medidos percorreram essa sequência completa; **29,8% (67/225)** chegaram ao login e **67,2% (45/67)** dos que chegaram ao login iniciaram um projeto na sequência. As linhas por origem do primeiro passo somam exatamente 225, sem linhas de QA/equipe, e o relatório de eventos com filtro de QA confirma 225 pessoas com `first_visit`. O funil mede **pessoas e ordem dos eventos**, não projetos únicos. `first_visit` significa primeira visita *observada pelo GA4*, que só carrega após consentimento.

| Origem da primeira visita no funil | `first_visit` | Depois, `login_success` | Depois, `project_start` | Leitura |
|---|---:|---:|---:|---|
| Direto | 103 | 37 | 27 | Pode conter equipe sem etiqueta |
| `uff.br / referral` | 84 | 15 | 6 | **7,1% (6/84)** completaram a sequência; amostra pequena para concluir causa |
| `google / organic` | 24 | 10 | 9 | Segmento pequeno; não comparar como teste causal |
| `google / cpc` | 10 | 2 | 2 | Não atribuir ao piloto sem ID confirmado |
| Outros | 4 | 3 | 1 | Bases muito pequenas |

As origens são as do detalhamento do funil, não uma soma de usuários por sessão. Os **100 eventos** `project_start` no período vieram de **55 usuários medidos** após o filtro; o funil de primeira visita inclui somente **45** dessas pessoas porque exige a sequência `first_visit` → `login_success` → `project_start` dentro da janela. Não dividir 100 por 225 nem chamar 100 de projetos distintos. Entre os inícios, houve **62 eventos com papel `advisor` e 38 com papel `student`**, e **65 em modo `quick` e 35 em `advanced`**. Esses desdobramentos são de eventos; o mesmo usuário pode aparecer em mais de um papel ou modo e não há denominador equivalente de elegíveis por segmento. Por isso, ainda não há taxas por papel ou modo.

**Avanço real por projeto:** indisponível. O GA4 registrou **299 eventos `stage_completed` por 41 usuários** e **10 `project_completed` por 7 usuários**, mas não expõe no relatório o vínculo de cada etapa com o projeto criado. Não é válido dividir esses totais por eventos de início. O [contrato de métricas](c152-contrato-metricas.md) especifica o agregado mínimo de projetos distintos que o desenvolvimento deve fornecer para avanço em 7 e 30 dias, sem conteúdos nem identificadores individuais.

## Fontes relacionadas, sem misturar unidades

- **Search Console:** busca Web, propriedade `sc-domain:mapadapesquisa.com.br`, **06–24/10**, `dataState=final`: **77 impressões e 26 cliques**; CTR **33,8% (26/77)**. A consulta até 25/10 retornou 88/35, mas o próprio conector estimou consolidação só até 24/10; o dia 25 ficou fora da base. Fuso de referência do Search Console: Pacífico. Cliques de busca não equivalem a sessões do GA4.
- **Google Ads:** conta `383-835-9068`, campanha `24325133699`, **06–26/10** no fuso `America/Sao_Paulo`: **819 impressões, 60 cliques, €14,23 e zero conversões atribuídas**. A campanha segue `ENABLED / ELIGIBLE`. A meta específica da campanha é `Mapa | Projeto iniciado` (`6459352879`) e inclui a ação existente `7825220596`, habilitada, `ONE_PER_CLICK`. Ela aparece como observação no nível da conta; a inclusão na meta específica da campanha foi confirmada. Não houve mudança na campanha.
- **Atribuição paga no GA4:** houve **10 sessões `google / cpc`** em 06–26/10; apenas **uma** trouxe `sessionGoogleAdsCampaignId=24325133699`. As **duas ocorrências** `project_start` em `google / cpc` tinham o ID `(not set)`, e **nenhuma** estava na sessão com o ID confirmado. Logo, a atribuição de início ao piloto **não está comprovada**. Cliques do Ads e sessões do GA4 também diferem por consentimento, bloqueios e regras de atribuição; não se espera igualdade direta.

## Limitações e decisão

Os dias do GA4 e Ads até **26/10** estavam completos em seus calendários na consulta; **27/10 é parcial e foi excluído**. Dados recentes ainda podem ser ajustados pelo processamento. O GA4 usa `America/Rio_Branco` e BRL; o Ads usa `America/Sao_Paulo` e EUR. Não se converteu moeda nem se equipararam dias. O Search Console tem janela final mais curta.

Há uma divergência pequena ainda não explicada no GA4: o relatório agregado filtrado retorna **454 sessões**, enquanto as linhas detalhadas por origem e por data somam **453**. As linhas de origem foram usadas somente como contagens descritivas, sem parcelas que precisem fechar em 100%. Não somamos usuários por origem ou por dia. O funil de primeira visita foi validado de forma independente pelas 225 pessoas com `first_visit` no relatório de eventos filtrado e pelas 225 do primeiro passo.

O funil não impõe prazo de 7 dias: pessoas que entraram perto de 26/10 tiveram menos tempo para iniciar um projeto, e pessoas já autenticadas podem iniciar sem novo `login_success` registrado. Portanto, **20,0% é a taxa da sequência observada até o fim da janela**, não a taxa definitiva de ativação de toda a audiência. A amostra paga é especialmente pequena. A próxima decisão útil é obter o agregado restrito do desenvolvimento; até lá, não publicar taxa de avanço ou conclusão por projeto.

### Registro reproduzível das consultas

- **GA4 Data API / HYPD**, propriedade `550650234`, `runReport`, 06–26/10, filtro `NOT sessionSourceMedium IN (codex_validation / qa, mapa_team / internal)`. Relatório geral: `activeUsers`, `sessions`, `engagedSessions`. Relatório por `eventName`: `eventCount`, `totalUsers`; por `eventName × customEvent:app_role` e `eventName × customEvent:app_entry_mode`: mesmas métricas. Um relatório por `sessionSourceMedium` e outro por `date` testaram a reconciliação. `runFunnelReport` consultou a sequência `first_visit` → `login_success` → `project_start`, detalhada por `sessionSourceMedium`; o funil não aceita o filtro de exclusão neste conector, mas **não houve linha QA/equipe no primeiro passo** e seu total coincidiu com `first_visit` filtrado. O funil `login_success` → `project_start` separado mostrou 81→56 antes de retirar uma pessoa QA, mas não foi usado como taxa principal.
- **Search Console API / HYPD**, `searchAnalytics.query`, domínio acima, busca Web, 06–24/10, `dataState=final`, sem dimensão; uma consulta de maturação até 25/10 informou `estimatedDataFinalizedThrough=2026-10-24`.
- **Google Ads API / HYPD**, `campaign` filtrada por `campaign.id=24325133699` e `segments.date BETWEEN '2026-10-06' AND '2026-10-26'`; leituras de `conversion_goal_campaign_config`, `custom_conversion_goal` e `conversion_action` para confirmar a ação. Valores de custo apresentados em EUR da conta.
- **Código e operação locais, somente leitura:** `docs/operations.md`, `modules/analytics/analytics.ts`, `modules/analytics/login-attempt.ts` e `modules/projects/project-created-analytics.tsx`. O último emite `project_start` após o servidor reler o projeto recém-criado e deduplica por projeto apenas em `sessionStorage` da sessão; isso não substitui contagem global de projetos distintos.
