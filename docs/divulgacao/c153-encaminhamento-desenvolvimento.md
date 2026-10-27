# C153 — Encaminhamento técnico para o projeto de desenvolvimento

**Estado:** documento revisável; nenhuma tarefa foi enviada a terceiros nem houve alteração no aplicativo. **Base:** [diagnóstico C153](c153-diagnostico-friccao.md), consulta de 27/10/2026, dados agregados 06–26/10 no GA4 (fuso `America/Rio_Branco`), excluindo origens etiquetadas de QA/equipe. Os sinais abaixo não incluem textos de projetos, IDs, e-mails ou respostas de provedores.

## 1. Diagnosticar a falha da descoberta

**Observado:** `generation_failed` registrou 44 eventos em 12 pessoas; 28 eventos/5 pessoas com `provider_invalid_response`, 15/6 com `unknown` e 1/1 com `network`. Todos os eventos foram da etapa `discovery` e `app_result=failed`. Em 16 e 17/10, ocorreram 8 eventos por dia, cada dia com uma pessoa medida; não sabemos se foi a mesma pessoa nos dois dias. O funil por pessoa mostra 12 com falha → 10 com retry → 8 com geração concluída posteriormente, sem vínculo entre operação ou projeto.

**Hipótese a verificar:** o código `provider_invalid_response` agrupa respostas vazias do Research Starter, referências não verificadas e formato inválido de proposta, conforme `discovery-failure.ts`. O `unknown` pode ocultar outra causa recorrente. O GA4 não diferencia essas subcausas nem permite contar tentativas independentes.

**Pedido técnico:** em ambiente controlado e sem ler conteúdo acadêmico, produzir contagem **agregada** por semana, código seguro do servidor, resultado da tentativa (falhou, repetiu, concluiu) e projetos distintos afetados. Confirmar se o briefing permanece salvo e se uma nova tentativa não duplica projeto/estado. Não enviar logs brutos, payloads, prompts, títulos, IDs ou dados pessoais ao relatório de divulgação.

**Aceite do diagnóstico:** cada uma das 44 ocorrências pode ser classificada ao menos na categoria técnica já disponível, ou a parcela `unknown` permanece explicitamente sem causa; testes controlados exercitam resposta vazia, formato inválido, indisponibilidade e rede, com mensagem adequada e estado preservado. Qualquer correção de código é decisão e implementação do desenvolvimento.

## 2. Separar validação normal de falha de etapa

**Observado:** `stage_blocked` teve 114 eventos em 14 pessoas: 90 com `validation` e `app_result=blocked`, 24 com `app_result=failed`. Os 24 se dividem em `unknown` 12, `prerequisite_required` 7, `provider_invalid_response` 3 e `provider_unavailable` 2. A metodologia concentrou 54 validações em uma pessoa; a origem `scanned.page` concentrou 56 bloqueios em uma pessoa, sem prova de identidade comum. O código da interface registra HTTP 422 como validação e falhas de requisição separadamente em trechos examinados.

**Pedido técnico:** confirmar em agregado quantas tentativas e projetos distintos sofreram cada motivo, por macroetapa, sem texto de mapa; verificar se o usuário recebe orientação para resolver validação e se falhas preservam o trabalho. Para `unknown` e `prerequisite_required`, documentar o comportamento esperado e o código de resposta, sem transformar validações normais em incidentes de produção.

**Aceite do diagnóstico:** uma tentativa de validação prevista e uma falha técnica controlada produzem sinais distintos, mensagem adequada e estado recuperável. Repetições da mesma pessoa/projeto não são contadas como novos afetados. Não mudar regras metodológicas para melhorar artificialmente a métrica.

## 3. Verificar contexto de `project_start`

**Observado:** 28/100 eventos `project_start` tinham `app_stage` preenchido com etapas variadas, embora `ProjectCreatedAnalytics` envie esse evento sem `app_stage`. `setAnalyticsContext` combina contexto novo com o anterior, e `trackAnalyticsEvent` mescla contexto e parâmetros; herança de etapa anterior é uma hipótese plausível.

**Pedido técnico:** com conta de teste etiquetada `codex_validation / qa` e consentimento aceito, criar um projeto após navegar por etapas e observar apenas parâmetros enumerados no DebugView. Definir qual deve ser o valor semântico de `app_stage` em `project_start` e verificar se ele não herda estado antigo. Não criar novo evento, dimensão ou conversão por causa desta análise.

**Aceite do diagnóstico:** o evento de criação possui somente dimensões válidas para criação, sem etapa residual, e continua sendo emitido uma vez por criação confirmada no teste. Qualquer correção de instrumentação deve ser proposta e autorizada no fluxo do desenvolvimento antes de implantação.

## 4. Verificar preservação de atribuição após consentimento

**Observado:** em 10 sessões `google / cpc`, só uma tinha `sessionGoogleAdsCampaignId=24325133699`; as duas ocorrências `project_start` dessa origem não tinham o ID. O Ads informou zero conversões atribuídas ao piloto no período. Isso não prova defeito do aplicativo nem resultado pago da campanha.

**Pedido técnico:** desenhar teste etiquetado como QA para entrada com parâmetros de campanha autorizados, decisão de consentimento, login e criação, verificando no GA4 o ID de campanha e o evento sem expor `gclid`, tokens ou identificadores no relatório. Reconciliar com a definição de atribuição do Ads; não alterar orçamento, campanha, consentimento, conversão ou vínculos nesta etapa.

**Aceite do diagnóstico:** fica documentado em quais condições o ID é preservado ou perdido e quais casos permanecem não atribuíveis; qualquer ajuste de configuração ou código é uma proposta específica posterior.

## Limite do encaminhamento

Este arquivo **não autoriza execução técnica**. A equipe de divulgação só acompanhará contagens agregadas, coortes e resultados de testes controlados. O [contrato C152](c152-contrato-metricas.md) continua sendo o pedido separado para primeiro avanço por **projeto distinto** em 7/30 dias.
