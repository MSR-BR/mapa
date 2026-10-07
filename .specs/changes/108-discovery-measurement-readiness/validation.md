# Validação

- Evidência local: código e testes de analytics, metadata, sitemap, robots, consentimento e releases.
- Evidência pública: HTTP, HTML renderizado, XML, Lighthouse móvel repetido e screenshots datados.
- Evidência de propriedade: Search Console e GA4 no navegador do Codex, incluindo captura dos estados necessários sem dados pessoais.
- Registrar data, conta/propriedade, amostra e limitações; não inferir estado de painel a partir do código.
- Na auditoria inicial, conferir ausência de mutações externas; nas correções posteriores autorizadas, registrar escopo, readback e reversão.

## Execução de 05/10/2026

Leitura autenticada do GA4 concluída parcialmente: stream/tag e coleta confirmados; conversão, atribuição e medição automática ainda não aprovadas. Evidências e limitações em [ga4-review-2026-10-05.md](ga4-review-2026-10-05.md). C109/C110 permanecem bloqueadas; nenhuma configuração externa alterada e TERMO preservado.

## Continuação corretiva de 05/10/2026

Após pedido explícito para corrigir, foram desativados os eventos da medição otimizada, adicionada a referência indesejada exata `accounts.google.com` e marcado `project_start` como evento-chave após teste real persistido e recebido uma vez no Realtime, sem repetição após reload. A suíte local de analytics passou 14/14. Atribuição processada, segmentação interna e janela completa ainda não aprovadas. Readback, reversão e limites em [ga4-remediation-2026-10-05.md](ga4-remediation-2026-10-05.md). Cadastro Ads separado iniciado, sem campanha/gasto; TERMO preservado.

## Releitura de 06/10/2026, pela manhã

O relatório de Session source / medium para 05/10 ainda apresenta **mostly complete data**: 17 sessões, 145 eventos, um evento-chave. Linhas exibidas: direct/none 12 sessões; not set 11; data not available 1; dashboard/ 1. Ainda não reconciliam com o total e não mostram a campanha QA. Não declarar atribuição íntegra a partir desse estado.

O aviso de not set informa ausência de informação para a dimensão e que alterações podem levar 24–48 horas para afetar relatórios futuros. A [documentação de atualização](https://support.google.com/analytics/answer/11198161) confirma processamento de 24–48 horas. A [documentação de not set](https://support.google.com/analytics/answer/13504892?hl=en) também relaciona Session source / medium sem valor à ausência de session_start e a determinadas falhas de consentimento. Portanto, latência é uma possibilidade, não diagnóstico conclusivo: a próxima validação deve comprovar sessão nova com UTMs e session_start antes de fechar esse item. Nenhuma configuração GA4 adicional modificada em 06/10 nesta execução.

## Correção publicada em 06/10/2026

`v06102026.1` corrigiu a perda de UTMs no redirecionamento automático de visitantes autenticados. A propriedade 550650234 recebeu `page_location` com as três UTMs do teste. Acesso comum à raiz ainda retoma o projeto, sem criar outro. Lint, tipos, 172 testes, exportações e build remoto passaram. Atribuição processada e baseline ainda não aprovados. [Release, evidências e limites](campaign-attribution-fix-2026-10-06.md).

## Continuidade de 06/10 — integração sem ativação

Após o vínculo GA4/Ads e importação isolada de project_start na C109, a reconsulta de Traffic acquisition em 06/10 ainda exibiu zero sessões/eventos; atribuição processada não validada. Recibo Realtime permanece apenas prova de coleta. Janela após v06102026.1 requer pelo menos 14 dias observáveis e tráfego suficiente, a partir de 20/10, sem aceite automático por data ou ausência de dados. A automação diária `mapa-concluir-ads-e-acompanhar-piloto` dará continuidade aos gates; C097 de 08/10 preservada.

## Nova autorização e lançamento operacional em 06/10

Após “faça 1, 2 e 3. Se tudo estiver funcionando, pode lançar”, foram confirmados coleta, First user source=codex_validation, URLs sanitizadas, projeto QA persistido e nenhuma conversão por revisita. Piloto C110 ativado. A espera fixa de 14 dias deixou de bloquear o lançamento; **a baseline e a atribuição processada continuam pendentes**, sem reclassificá-las como aprovadas. [Provas e limites](../110-google-ads-controlled-pilot/launch-2026-10-06.md).

## Reconsulta após C112 — 06/10/2026

Traffic acquisition da propriedade 550650234, período 06/10–06/10: **2 sessões, 7 eventos e 0 eventos-chave**. Canais: Direct (1 sessão/2 eventos) e Unassigned (1 sessão/5 eventos). Realtime estava sem usuários nos últimos 30 minutos. A consulta comprova dados processados, mas não separa tráfego técnico nem valida origem/mídia da sessão QA ou de Ads. Não inferir aquisição paga desses números. Nenhuma configuração foi modificada nessa consulta. [Fechamento documental](../110-google-ads-controlled-pilot/cpd-documental-2026-10-06.md).

## Acompanhamento de 07/10 — mesmo recorte de 06/10

Origem/mídia processada agora mostra `codex_validation / qa`: 2 sessões, 16 eventos e zero eventos-chave. Atribuição dessa origem técnica comprovada e excluída da avaliação de aquisição. Total do relatório: 10 sessões, 157 eventos, 5 eventos-chave (3 project_start). `(not set)` continua com 7 sessões e as linhas somam 13 frente ao total 10; relatório informa mostly complete/intraday e ausência de dados de atribuição. Não declarar íntegra a atribuição geral nem contar eventos de direct/not set como conversões pagas ou externas comprovadas. Ads ainda tem zero cliques. Reconsultar janela completa e separar uso interno. [Evidência, limites e decisão de manter o piloto](../110-google-ads-controlled-pilot/monitor-2026-10-07.md).
