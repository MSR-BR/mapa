# Change 100 — Prontidão para Google Ads e Consent Mode v2

Status em 06/10/2026: **código implantado; aceite completo de medição em acompanhamento na C108**. Consentimento, preferência revisável, sanitização e criação persistida/deduplicada foram validados. Vínculo e campanha pertencem às C109/C110. A nova autorização de 06/10 permitiu o piloto após checks operacionais, sem declarar concluída a baseline longa; ver [lançamento C110](../110-google-ads-controlled-pilot/launch-2026-10-06.md).

## Objetivo

Preparar mensuração e governança para uma futura campanha sem criar, vincular ou gastar antes da aprovação explícita.

## Gates de entrada

Os gates abaixo registram o plano original. A espera de 14 dias foi substituída como condição de lançamento pela autorização posterior registrada na C110; continua necessária para o aceite da baseline.

- 14 dias de atribuição limpa após C097;
- Search Console e sitemap verificados em C098;
- landing canônica e desempenho aprovados em C099;
- pelo menos um key event comprovado ponta a ponta;
- política de privacidade e responsável pelo tratamento revisados.

## Requisitos

- tornar a preferência de métricas revisável;
- implementar e validar analytics_storage, ad_storage, ad_user_data e ad_personalization;
- definir modo básico ou avançado, regiões e comportamento de revogação;
- criar padrão UTM e nomenclatura de campanhas;
- escolher uma única conversão principal para eventual importação;
- definir público, geografia, orçamento, CPA alvo, palavras negativas e stop-loss;
- vincular GA4/Ads e lançar somente em uma Change posterior com autorização de gasto.

## Não objetivos

- não criar campanha nesta Change sem autorização específica;
- não habilitar remarketing ou personalização por padrão;
- não enviar e-mail, projeto, UUID ou conteúdo acadêmico ao Google.

## Aceite

- Tag Assistant/DebugView comprova todos os estados de consentimento;
- evento principal mantém atribuição correta;
- política e interface explicam analytics e publicidade;
- checklist de campanha fica pronto, porém sem gasto ativo;
- rollback e stop-loss documentados.

## Modelo recomendado

gpt-5.6-sol com raciocínio xhigh.
