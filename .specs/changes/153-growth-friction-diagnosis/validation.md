# Validação prevista

- Conferir totais por motivo e data com total de falhas na mesma janela.
- Verificar se segmentos com poucos usuários são descritos como amostra pequena.
- Revisar manualmente alegações causais e fronteira com o projeto de desenvolvimento.

Estado da validação: CONCLUÍDA PARA O DIAGNÓSTICO, 27/10/2026.

- `generation_failed`: motivos 28 `provider_invalid_response` + 15 `unknown` + 1 `network` = 44 eventos, 12 pessoas no total. Datas 12 + 8 + 8 + 6 + 4 + 3 + 2 + 1 = 44. O funil por pessoa 12 → 10 retry → 8 conclusão não foi interpretado como recuperação da mesma tentativa/projeto.
- `stage_blocked`: 90 `validation`/`blocked` + 24 `failed` = 114. Motivos dos 24: 12 `unknown` + 7 `prerequisite_required` + 3 `provider_invalid_response` + 2 `provider_unavailable`. Por etapa: 59 metodologia + 53 literatura + 2 definição = 114. Os 54 eventos de validação da metodologia pertencem a uma pessoa medida; sem inferência de incidente único.
- UFF: 91 pousos em `/` dentro de 103 sessões; 36 + 42 + 9 + 13 = 100 sessões em 23–26/10. Funil 84 → 15 → 6 pessoas; 6/84 = 7,1%. As amostras e o limite de consentimento estão descritos.
- Search Console 06–24/10 `final`, busca Web: 77 impressões e 26 cliques; `/home.html` inspecionada como redirecionamento com canonical `/`. Ads 06–26/10: 819 impressões, 60 cliques, €14,23, zero conversões. No GA4, 1/10 sessões `google/cpc` tinha ID da campanha e nenhum dos 2 `project_start` tinha o ID.
- Revisão de causalidade e escopo: cada hipótese tem observação, efeito esperado, custo/risco e teste. `scanned.page` permanece QR possível não confirmado, e direto pode conter interno. Somente consulta de leitura e documentação; sem conteúdo privado ou alteração externa.
