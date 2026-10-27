# Validação prevista

- Recalcular numeradores/denominadores e reconciliar categorias aditivas com totais.
- Comparar GA4 com agregado operacional somente após compatibilizar unidade, janela e consentimento.
- Inspecionar eventos e filtros da consulta executada; tratar limitação do conector de funil como lacuna, não como zero.

Estado da validação: CONCLUÍDA COM LACUNA EXPLÍCITA, 27/10/2026.

- O funil sequencial retornou 225 → 67 → 45 pessoas. Recalculadas as taxas: 67/225 = 29,8%; 45/67 = 67,2%; 45/225 = 20,0%. As linhas por origem do primeiro passo somam 225, sem QA/equipe, e o relatório de eventos com exclusão dessas origens confirma 225 pessoas com `first_visit`.
- O relatório geral filtrado do GA4 trouxe 239 usuários ativos, 454 sessões e 260 engajadas; 260/454 = 57,3%. As linhas por origem e por data somam 453 sessões, uma a menos que o total filtrado; diferença preservada no relatório, sem forçar reconciliação.
- O relatório de eventos filtrado trouxe 100 `project_start` por 55 usuários; a diferença para 45 no funil decorre da exigência de primeira visita e login na sequência. Não foi feita divisão entre eventos e pessoas ou projetos.
- Search Console final até 24/10: 26/77 = 33,8% de CTR. Ads: campanha 24325133699, 819 impressões, 60 cliques, €14,23 e zero conversões atribuídas em 06–26/10; meta específica 6459352879 contém ação 7825220596. Das 10 sessões GA4 `google/cpc`, uma tinha o ID da campanha e nenhuma das duas ocorrências `project_start` tinha esse ID.
- Primeira etapa concluída por **projeto distinto** em 7/30 dias não é verificável com o GA4 atual. Está marcada indisponível e há especificação de agregado sem dados privados no contrato.
- Revisão de escopo: somente consultas de leitura e edição de documentação local; nenhuma mudança em Ads, GA4, Search Console, consentimento, site ou produto.
