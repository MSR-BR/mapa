# C153 — Diagnóstico de entrada, falhas e qualidade do tráfego

**Consulta somente de leitura:** 27/10/2026, 18h24–18h27 (America/Sao_Paulo). **Janela principal:** 06–26/10/2026, dias completos no GA4 (`America/Rio_Branco`) e no Ads (`America/Sao_Paulo`). Search Console: 06–24/10, busca Web com dados finais no calendário do Pacífico. O dia 27/10, parcial, foi excluído. Dados recentes podem ser revistos pelas plataformas.

## Leitura principal

O obstáculo mais verificável é a **falha de geração na descoberta**, observada em 44 eventos de 12 pessoas medidas; o código de motivo mais frequente é `provider_invalid_response` (28 eventos, 5 pessoas). Já os 114 eventos `stage_blocked` misturam **90 validações previstas do fluxo** e **24 falhas**. Repetições dominam parte do volume: 54 bloqueios de validação na metodologia vieram de uma única pessoa medida. Esses eventos não são 44 nem 114 incidentes independentes, e não demonstram que a audiência geral esteja travada nessa proporção.

Na entrada, a UFF é o segmento a investigar primeiro: 103 sessões, sendo 91 com pouso na página inicial, e 100 das 103 entre 23 e 26/10. No funil sequencial, 84 pessoas com primeira visita observada via `uff.br / referral` passaram para 15 logins e 6 inícios de projeto. A sequência completa foi **6/84 (7,1%)**; a amostra é pequena e de poucos dias. A página inicial concentra 212 das 225 primeiras visitas medidas de todas as origens, portanto uma hipótese de clareza da mensagem ou de transição para login pode ser testada na C154. Os dados atuais **não provam** que a página ou o login causaram a diferença: intenção da audiência, divulgação concentrada, consentimento e maturação desigual também podem explicá-la.

## Onde a entrada acontece

| Canal ou origem | Sessões no GA4 | Pouso na página inicial | Sequência `first_visit` → login → início | Limite de leitura |
|---|---:|---:|---:|---|
| `uff.br / referral` | 103 | 91 | 84 → 15 → 6 pessoas | Volume concentrado em 23–26/10; não há teste de causalidade |
| `google / organic` | 52 | 36 | 24 → 10 → 9 pessoas | Primeiras visitas e inícios ainda poucos |
| `scanned.page / referral` | 27 | 14 | Sem primeira visita observada nessa origem | **Uma pessoa medida** gerou as 27 sessões e 15 eventos `project_start`; possível QR não confirmado |
| Direto | 251 | 133 | 103 → 37 → 27 pessoas | Pode conter equipe sem etiqueta e entradas em rotas autenticadas |
| `google / cpc` | 10 | 10 | 10 → 2 → 2 pessoas | Só 1 sessão tem ID confirmado da campanha; não atribuir os 2 inícios ao piloto |

O total agregado filtrado é **454 sessões** de **239 usuários ativos**, mas as linhas por origem somam **453 sessões**; a diferença de uma sessão permanece sem explicação e não foi repartida artificialmente. Usuários entre origens não foram somados. A comparação entre segmentos é descritiva: pessoas, sessões e eventos são unidades diferentes. `first_visit` significa primeira visita vista pelo GA4 **depois de consentimento**, não necessariamente primeiro contato com o site; o funil exige eventos em sequência dentro da janela, sem acompanhamento fixo de 7 dias.

Há sinais de avanço nas origens, mas sem vínculo ao mesmo projeto: o GA4 associou **9 eventos `stage_completed` a 3 usuários** em `uff.br / referral`, **57 a 8** em `google / organic` e **59 a 1** em `scanned.page / referral`. Não dividir esses eventos pelos inícios nem usá-los para ordenar a qualidade dos canais; o agregado por projeto distinto da C152 ainda falta.

O Search Console registrou **77 impressões e 26 cliques** na busca Web final de 06–24/10. As quatro consultas visíveis explicam apenas 3 cliques; as raras são anonimizadas, então não há base para caracterizar toda a intenção orgânica. A página `/` teve 25 cliques; `/home.html` teve 1 clique e 25 impressões, mas a inspeção da URL retornou **“Página com redirecionamento”**, canonical do Google e declarado apontando para `/`. Isso, isoladamente, não é um erro de indexação a corrigir. Cliques do Search Console não são sessões do GA4.

No Ads, a campanha `24325133699` segue `ENABLED / ELIGIBLE`: **819 impressões, 60 cliques, €14,23 e zero conversões atribuídas** em 06–26/10. No GA4, das 10 sessões `google / cpc`, só 1 traz `sessionGoogleAdsCampaignId=24325133699`; as 2 ocorrências `project_start` em `google/cpc` não trazem esse ID, conforme a [C152](c152-baseline-ativacao.md). Atribuição ao piloto não está comprovada. O Ads usa EUR e fuso de São Paulo; não se converteu para BRL nem se compararam dias como equivalentes.

## Falhas e bloqueios, sem confundir repetição com alcance

| Sinal GA4 | Eventos | Pessoas afetadas | Classificação observada | Interpretação prudente |
|---|---:|---:|---|---|
| `generation_failed`, etapa `discovery` | 44 | 12 | 28 `provider_invalid_response` (5 pessoas), 15 `unknown` (6), 1 `network` (1); `app_result=failed` em todos | Há falhas reais reportadas, porém tentativas repetidas; o código inválido reúne várias causas de servidor |
| `generation_retry` | 24 | 10 | 13 com razão anterior `provider_invalid_response`, 10 `unknown`, 1 `network` | Sinal de tentativa, não garantia de recuperação |
| Funil de pessoas após falha | 12 → 10 → 8 | Pessoas em sequência | `generation_failed` → `generation_retry` → `generation_completed` na janela | As 8 conclusões podem ser de outra tentativa ou projeto; não calcular taxa de sucesso por operação |
| `stage_blocked` | 114 | 14 | 90 `validation`/`blocked` (7 pessoas) e 24 `failed` (7 pessoas) | Validação é fluxo esperado; falhas exigem triagem separada |
| `export_pdf_failed` | 2 | 2 | `network` nas duas ocorrências | Amostra pequena; acompanhar recorrência |

As 44 falhas de geração se distribuem por data em **12 (23/10), 8 (16/10), 8 (17/10), 6 (10/10), 4 (18/10), 3 (24/10), 2 (21/10) e 1 (25/10)**. Somam 44; os 12 usuários do período não podem ser obtidos somando usuários diários. A origem direta teve 28 eventos em 8 usuários; orgânico 8 em 1; `scanned.page` 6 em 1; UFF 1 em 1; `google/cpc` 1 em 1. Sem identificador de operação no GA4, não sabemos quantas tentativas independentes falharam.

Nos bloqueios de etapa, os motivos somam **90 `validation` + 12 `unknown` + 7 `prerequisite_required` + 3 `provider_invalid_response` + 2 `provider_unavailable` = 114**. As etapas somam **59 `methodology` + 53 `literature` + 2 `definition` = 114**. Só na metodologia, **54 eventos de validação vieram de uma pessoa medida**. A origem `scanned.page` contém **56 dos 114 bloqueios**, também de uma pessoa medida; não há evidência de que seja a mesma pessoa da metodologia. Por papel, houve 105 eventos `stage_blocked` com `advisor` e 9 com `student`; por modo, 51 `advanced`, 28 `quick` e 35 sem modo. São **eventos**, sem denominador de pessoas elegíveis por papel/modo e possivelmente com acesso interno não marcado; não permitem taxas de risco por segmento.

## Hipóteses e próximos testes, em ordem

| Prioridade | Observação | Hipótese, ainda não comprovada | Efeito esperado se confirmada | Custo ou risco | Como verificar |
|---|---|---|---|---|---|
| 1. Triar geração | 44 falhas/12 pessoas; 28 `provider_invalid_response`; 8 pessoas chegaram a `generation_completed` depois de falhar e tentar de novo | Algumas respostas do provedor ou validações da resposta interrompem a descoberta de forma recuperável | Menos pessoas impedidas de obter propostas e menor repetição de tentativa | Investigação do desenvolvimento; cuidado para não expor briefing ou resposta do provedor | Diagnóstico agregado por código seguro e tentativa, teste controlado de falha/retry e comparação de pessoas afetadas após correção |
| 2. Testar entrada da UFF | 84 primeiras visitas → 15 logins → 6 inícios; 91/103 sessões pousaram em `/` | A mensagem inicial ou a transição para login talvez não esclareça o valor/compromisso ao visitante da UFF | Mais logins e inícios qualificados da mesma coorte | Mudança de landing exige prévia e autorização; risco de elevar inícios sem avanço real | C154: variante concreta e comparação em janela/coorte equivalentes; guardar falhas e primeiro avanço como guardrails |
| 3. Distinguir validação de falha | 90 bloqueios são validação; 24 são falhas; 54 validações na metodologia de uma pessoa | Repetições de validação podem refletir orientação insuficiente ou clique repetido, mas o volume não prova defeito geral | Menos tentativas improdutivas e mensagens mais úteis, se a hipótese se confirmar | Alterações no app pertencem ao desenvolvimento; não relaxar critérios metodológicos sem decisão própria | Agregado por tentativa/projeto e motivo, sem conteúdo; teste das mensagens e do estado preservado |
| 4. Limpar atribuição de canais | `scanned.page` = 27 sessões de uma pessoa; direto pode conter interno; 1/10 sessões `google/cpc` têm ID do piloto | Etiquetas e consentimento limitam a leitura de qualidade por canal | Decisões de divulgação menos enviesadas | Inventário de peças e teste etiquetado; eventual instrumentação exige proposta e autorização | Confrontar destino/UTM de links e QR com sessões e IDs; reavaliar avanço apenas com agregado por projeto |

## Nota de mensuração para o desenvolvimento

O GA4 mostra **28 dos 100 eventos `project_start` com `app_stage` preenchido** (`discovery` 11, `problem` 10, `final` 3, `literature` 3, `definition` 1). O componente local de criação envia `project_start` sem `app_stage`, enquanto a camada de analytics combina os parâmetros do evento com um contexto persistente em memória. **Hipótese técnica:** parte desses valores pode ser herdada de uma etapa anterior da sessão. Não usar `app_stage` para classificar onde o projeto foi iniciado antes de validar essa semântica. O [encaminhamento técnico](c153-encaminhamento-desenvolvimento.md) descreve um teste sem acessar projetos reais.

### Fontes, filtros e limites de consulta

- **GA4 Data API via HYPD:** propriedade `550650234`, 06–26/10, `runReport` com filtro `NOT sessionSourceMedium IN (codex_validation / qa, mapa_team / internal)`. Dimensões consultadas: `sessionSourceMedium`, `landingPage`, `date`, `eventName`, `customEvent:app_reason_code`, `customEvent:app_result`, `customEvent:app_stage`, `customEvent:app_role`, `customEvent:app_entry_mode`; métricas `sessions`, `engagedSessions`, `activeUsers`, `eventCount`, `totalUsers`. Funis `first_visit` → `login_success` → `project_start` por origem e landing, e `generation_failed` → `generation_retry` → `generation_completed` por origem. O conector de funil não aceita o filtro de exclusão: as linhas iniciais de ambos os funis não contêm QA/equipe e coincidem com os totais filtrados por evento (225 e 12). Funis são de pessoas, não de projetos/ operações.
- **Search Console API via HYPD:** `sc-domain:mapadapesquisa.com.br`, busca Web, `dataState=final`, 06–24/10, totais, consultas e páginas; inspeção individual de `https://mapadapesquisa.com.br/home.html`. A consulta até 25/10 indicou `estimatedDataFinalizedThrough=2026-10-24`; 25 ficou fora dos números finais. Consultas anonimizadas e agregação por URL limitam somas.
- **Google Ads API via HYPD:** conta `383-835-9068`, campanha `24325133699`, métricas e estado de 06–26/10 em EUR e fuso `America/Sao_Paulo`. GA4 por `sessionGoogleAdsCampaignId` reconsultado em 27/10.
- **Código local somente leitura:** `modules/research-workflow/proposal-discovery-workspace.tsx`, `modules/research-workflow/discovery-failure.ts`, formulários de etapas, `modules/analytics/analytics.ts` e `modules/projects/project-created-analytics.tsx`. Não foram lidos textos de mapas, dados pessoais, tokens ou chaves.
