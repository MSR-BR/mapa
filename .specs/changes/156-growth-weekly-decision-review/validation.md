# Validação prevista

- Recalcular percentuais e reconciliar categorias; conferir fusos e moedas.
- Conferir que usuários por dia/origem não foram somados e que coortes têm janela completa.
- Revisar fontes, limitações e gates com o relatório 001 e os entregáveis C152–C155.

Estado da validação: EXECUTADA em 27/10/2026. As dez linhas de origem do GA4 somam 344 sessões; 186/344 = 54,1%. O Ads retornou 810 impressões e 60 cliques em 20–26/10 (CTR 7,4%), €14,23 e zero conversões; a série diária confirmou a janela. O GSC final de 20–24/10 retornou 22/52 = 42,3% de CTR, com janela anterior equivalente 13–17/10 separada. GA4 20–26/10 usa America/Rio_Branco; Ads usa America/Sao_Paulo, sem comparação dia a dia. Linhas de pessoas não foram somadas; eventos não foram divididos para formar taxa de projetos. Consultas raras do GSC e atribuição paga incompleta foram registradas. Os 11 arquivos da C156 passaram na conferência de links locais e whitespace; `git diff --check` passou. A conexão Supabase não identificou um projeto Mapa, portanto nenhum banco foi consultado.
