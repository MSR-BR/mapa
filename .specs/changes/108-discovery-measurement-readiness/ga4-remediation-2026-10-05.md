# C108/C100 — correções e teste real de medição

Data de referência: 05/10/2026, America/Sao_Paulo. Continuação posterior à auditoria `ga4-review-2026-10-05.md`, após pedido explícito do responsável para resolver os problemas e preparar o início do Google Ads. O relatório anterior permanece como histórico do estado antes das correções.

## Resultado comprovado

Propriedade **Mapa da Pesquisa `550650234`**, conta Analytics `346683903`, stream Web `15460310071`, tag `G-MKFYYRZG87`. A conta Analytics chamada “Google Ads Account” não é a identidade da conta Ads.

| Alteração remota | Estado anterior | Estado salvo/readback | Reversão |
|---|---|---|---|
| Medição otimizada do stream | Ativa, incluindo histórico do navegador e eventos automáticos | Desativada. O aplicativo mantém seus eventos e page views manuais; `send_page_view: false` já consta no código publicado | Reativar a medição otimizada e restaurar as opções anteriores, somente após revisar duplicidade e privacidade |
| Referências indesejadas da Google tag | Lista vazia | Uma regra: `Referral domain exactly matches accounts.google.com` | Remover somente essa regra e salvar |
| Evento-chave | `project_start` sem estrela | `project_start` aparece em Key events com botão da estrela pressionado, no stream Mapa da Pesquisa — Web | Desmarcar somente `project_start` |

As mudanças foram feitas pelo painel autenticado. Nenhum evento-chave existente foi removido. Não houve alteração de código, deploy, banco diretamente, tag do TERMO ou campanha do TERMO.

## Teste E2E em produção

1. Acesso à landing pública com `utm_source=codex_validation&utm_medium=qa&utm_campaign=c108_20261005`.
2. Consentimento apenas de métricas; publicidade desmarcada. Login Google com a conta indicada pelo usuário. O perfil existente é Orientador.
3. Criação pelo formulário real de um projeto de validação, com texto explicitamente identificado como teste C108. A criação rápida iniciou automaticamente a descoberta com IA, que produziu seis propostas; nenhuma proposta foi selecionada.
4. Conteúdo persistido e reapresentado após recarregar o projeto. Projeto de teste preservado, sem excluir ou modificar projetos anteriores. ID para eventual limpeza: `2a82165b-2405-4200-9f51-6fc5bb6c05a1`.
5. Realtime do GA4 recebeu **uma ocorrência de `project_start`**. A contagem permaneceu em uma após recarregar e durante a inspeção subsequente.
6. Parâmetro recebido `app_result=success`; `page_location=https://mapadapesquisa.com.br/dashboard/projects/project`, sem UUID nem query privada. Parâmetros `app_*` presentes. `ignore_referrer` constava na lista, mas seu valor não foi inspecionado — não tratar isso como prova final de atribuição.
7. Após essa evidência, `project_start` foi marcado como evento-chave. A ocorrência de teste precede essa marcação; não foi criada uma segunda conversão para provar contagem após a marcação.

Limites: o teste comprova persistência, recebimento e não repetição nessa revisita. Não comprova sozinho deduplicação em todas as sessões, ausência de duplicidade de todos os page views, atribuição processada à campanha QA, conversão importada no Ads ou janela limpa de 14 dias.

## Leitura do relatório de 05/10

Relatório de aquisição com dimensão Session source / medium, somente 05/10, exibe **mostly complete data**. Total: 14 sessões, 115 eventos e 1 evento-chave. Linhas exibidas: `(direct) / (none)` 10 sessões; `(not set)` 10 sessões; `dashboard /` 1 sessão. As contagens das linhas não reconciliam com o total nesse estado parcial; não foram reinterpretadas como resultado final. O dia mistura tráfego anterior e posterior às alterações. A campanha QA ainda não estava visível nesse relatório.

Não há prova suficiente de atribuição limpa. A regra de referência só atua para os novos eventos que correspondem a ela; não reescreve todo o histórico. A medição manual permanece dependente do consentimento de métricas.

## Tráfego interno e consentimento

O filtro Internal Traffic continua em **Testing**. A lista de regras IP está vazia. O formulário de regra foi inspecionado e fechado sem salvar; nenhum IP foi enviado ao GA4. Não foi ativada exclusão permanente. A visita de QA tem UTMs próprias, mas sua segmentação no relatório processado ainda não foi comprovada.

O teste usou métricas aceitas e publicidade negada. Consent Mode e sanitização foram verificados também pela suíte local existente: `node --import tsx --test tests/analytics.test.ts`, **14/14 aprovados**. Isso não substitui a validação de todos os estados no Tag Assistant/DebugView nem o aceite completo da C100.

## Estado de Ads e pendências objetivas

O usuário confirmou **Brasil, real e São Paulo**. O login solicitado só listava a conta TERMO `MSR-BR / 383-835-9068`; por isso foi iniciado um cadastro separado. O Google atribuiu ao cadastro incompleto o ID **896-116-6158**. Não confundir com conta pronta para veicular: cadastro, cobrança, vínculo e campanha ainda não concluídos.

A próxima etapa de cadastro apresenta declarações sobre direitos de imagens do site e referências aos Termos do Google/Política de IA generativa. A confirmação específica foi solicitada antes de informar a URL e avançar. Também foi solicitada escolha de **R$11,17/dia**, equivalente arredondado aos €2/dia usando a referência BCE de 05/10/2026: €1 = R$5,5849. Nenhum orçamento foi salvo; pagador/forma de pagamento não presumidos.

A C108/C100 ainda não tem aceite integral. As specs mantêm baseline original até 08/10 e primeira revisão de ativação em 09/10, nunca por data sozinha. As correções de hoje exigem análise explícita do recorte posterior. Este registro não altera essas condições nem declara C109/C110 concluídas.

## Evidências e fontes

- [Evento-chave salvo](evidence-2026-10-05/project-start-key-event.jpg).
- [Recebimento com page_location sanitizado](evidence-2026-10-05/project-start-sanitized.jpg). A URL integral foi lida no DOM do painel; a captura pode abreviar a coluna.
- [Regra de referência salva](evidence-2026-10-05/unwanted-referral.jpg).
- [Medição otimizada desligada, com stream recebendo dados](evidence-2026-10-05/enhanced-measurement-off.jpg).
- [Cadastro aguardando confirmação](../109-google-ads-link-and-draft/evidence-2026-10-05/ads-business-terms.jpg).
- [Google: referências indesejadas e efeito não retroativo](https://support.google.com/analytics/answer/10327750?hl=en).
- [Google: medição manual de page views](https://developers.google.com/analytics/devguides/collection/ga4/views).
- [BCE: câmbio de referência de 05/10/2026](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.fr.html).

Nenhum gasto Ads novo, vínculo GA4/Ads, importação de conversão ou ativação de campanha foi realizado. TERMO preservado. Nenhum monitor novo foi criado.
