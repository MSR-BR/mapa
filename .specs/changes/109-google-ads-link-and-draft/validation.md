# Validação

## Estado final da preparação e encaminhamento

C109 concluída e entregue à C110. A campanha foi ativada em 06/10 sob a autorização posterior e permanece ativa. Última consulta: Enabled / Eligible (Limited), RSA Approved, 1 impressão, 0 cliques e €0,00. Ver [lançamento](../110-google-ads-controlled-pilot/launch-2026-10-06.md) e [fechamento documental](../110-google-ads-controlled-pilot/cpd-documental-2026-10-06.md). As seções seguintes preservam a cronologia; instruções anteriores de pausa, cadastro dedicado e espera fixa foram substituídas pelas decisões posteriores, sem dar por concluída a baseline.

## Registro intermediário — 06/10, antes do lançamento C110

Esta seção substitui os bloqueios de vínculo e conversão descritos no histórico abaixo. O responsável pediu executar o que faltava após receber a revisão concreta do vínculo; o envio foi concluído. **A campanha permanece PAUSADA, com €2/dia e sem veiculação.** C108/C100/C109 ainda exigem aceite da medição e revisão; C110 não foi ativada.

- **Vínculo GA4/Ads concluído às 12:23:42 BRT:** propriedade `550650234` → MSR-BR `383-835-9068`, ID `qmrV-ja_RN-cID1UpznqUA`. GA4 mostra Completed (1), publicidade personalizada Disabled. Acesso ampliado a recursos Analytics via Ads desligado; papéis Ads mapeados como Viewer. Auto-tagging existente mantido. O assistente de conversões do Ads reconheceu a propriedade como “Linked to this account”. [Captura](evidence-2026-10-06/ga4-ads-link-created.png), [detalhe](evidence-2026-10-06/ga4-ads-link-detail.txt).
- **Uma importação, sem duplicação:** ação `7825220596`, **Mapa da Pesquisa (web) project_start**, GA4, categoria Engagement, Count One, sem valor. A conta passou de oito para nove ações. A ação TERMO `study_activation` permanece Active, Primary, One e incluída nos objetivos da conta. [Antes](evidence-2026-10-06/conversions-before-mapa-import.txt), [depois](evidence-2026-10-06/conversions-after-mapa-import.txt), [configuração da ação](evidence-2026-10-06/mapa-conversion-detail.txt).
- **Objetivo exclusivo aplicado:** **Mapa | Projeto iniciado**, objetivo personalizado contendo somente essa ação. Readback da campanha `24325133699`: **Campaign-specific: Mapa | Projeto iniciado**. Não herda mais Account-default Engagements. A ação fica **Secondary no nível da conta**, fora dos objetivos padrão, para preservar TERMO; dentro do objetivo personalizado é usada pelo Mapa independentemente do rótulo Primary/Secondary. Essa distinção está prevista na [documentação oficial Google](https://support.google.com/google-ads/answer/11461796?hl=en). Não declarar que a ação é Primary globalmente. [Captura do objetivo salvo](evidence-2026-10-06/mapa-exclusive-goal-saved.png).
- **Keyword Planner refinado:** Brasil, português, Google, histórico set/2025–ago/2026. `projeto de pesquisa`: 4.400 buscas/mês, concorrência baixa, faixa de topo €0,26–€0,61. `como fazer um projeto de pesquisa`: 590 buscas/mês, concorrência baixa, €0,13–€0,46. As seis palavras anteriores continuam sem métricas históricas; quatro aparecem com Low search volume na campanha. Foram adicionadas somente as duas alternativas acima, em **correspondência exata**, ao plano `1441351032` e à campanha pausada. Total: **oito palavras**. [Histórico salvo](evidence-2026-10-06/planner-eight-saved-keywords.txt), [readback da campanha](evidence-2026-10-06/mapa-eight-keywords-saved.txt).
- **Decisão de lance:** manter CPC máximo €0,30 como hipótese conservadora de teste, dentro das faixas históricas observadas. Isso não comprova entrega ou CPC futuro. O forecast refinado de oito termos, novembro/2026 e €2/dia ainda mostra zero e CPC ausente; segue **inconclusivo**, sem promessa de cliques/conversões e sem aumento automático do lance. [Forecast](evidence-2026-10-06/planner-refined-forecast.txt).
- **Negativas reforçadas:** adicionadas, somente no Mapa e em phrase match, `projeto de pesquisa pronto`, `projetos de pesquisa prontos`, `comprar projeto` e `pré projeto pronto`. Total: **17 negativas**, preservando as 13 anteriores. [Readback](evidence-2026-10-06/mapa-seventeen-negatives-saved.txt).
- **Limitações remanescentes:** logo próprio ainda Pending / Under review; as duas palavras novas também Under review. O relatório processado GA4 de 06/10 segue com zero sessões/eventos na leitura atual. Não confundir recebimento em Realtime com atribuição processada, nem “No recent conversions” no Ads com defeito comprovado: não houve tráfego pago do Mapa. [Assets](evidence-2026-10-06/mapa-assets-review.txt), [GA4](evidence-2026-10-06/ga4-processed-oct6-after-link.txt).

### Continuidade e critérios de ativação

Automação **Mapa — concluir Ads e acompanhar piloto**, ID `mapa-concluir-ads-e-acompanhar-piloto`, criada ACTIVE neste chat, diariamente às **09h de São Paulo**, por 23 execuções. A automação C097 existente, prevista para 08/10 e de escopo somente leitura, foi preservada.

O acompanhamento deve concluir os checks pendentes e só ativar depois de C108/C100/C109 aprovadas com evidências: atribuição processada íntegra, evento persistido e único, consentimento/privacidade, tráfego interno segmentado, landing e políticas saudáveis. A janela limpa começa após a correção publicada em **06/10** e só pode ser avaliada após pelo menos **14 dias**; 20/10 é a primeira data possível, não aprovação automática. Relatório vazio não demonstra uma janela limpa. Nova correção relevante reinicia a observação.

A ativação condicional já foi autorizada pelo responsável; não solicitar novamente conta, orçamento ou aprovação genérica. Antes de ativar, reconferir orçamento €2/dia, CPC €0,30, objetivo exclusivo e regra `61994210`, e ajustar início/fim para sete dias. As datas atualmente salvas 21–27/10 são proteção provisória. A regra horária de custo acumulado >= €14 não garante teto rígido instantâneo. Pausar Mapa se custo/guardrail/fim do piloto exigir; não aumentar orçamento, financiar conta nova ou alterar TERMO. Após a avaliação final, pausar a automação e não arquivar o chat.

### Reversão adicional

Manter a campanha Mapa pausada é o primeiro controle. As duas novas palavras e quatro negativas podem ser pausadas/removidas apenas no escopo Mapa, conforme necessidade. Se a integração precisar ser revertida, preservar evidências, pausar Mapa e retirar sua seleção do objetivo personalizado; não substituir pelo objetivo TERMO nem remover ações usadas por outras campanhas. Desvincular GA4/Ads somente se necessário e autorizado, respeitando a confirmação aplicável a exclusões. Nenhum código de produção foi alterado nesta continuação; a validação aqui é de configuração remota, não uma nova bateria de testes do app.

**Estado atual — 06/10/2026:** a orientação do responsável substituiu o cadastro dedicado por uma campanha separada dentro da MSR-BR. O histórico abaixo de criação da conta `896-116-6158` não é mais o caminho a continuar; não concluir seu pagamento.

- Navegador do Codex: snapshots antes/depois para vínculo, conversões e campanha; confirmar ausência de publicação.
- GA4: readback do link Ads e do evento importado; Tag Assistant/DebugView para consentimento e atribuição.
- Google Ads: campanha pausada, moeda e orçamento visíveis, URL válida, política e diagnóstico de tag sem erros bloqueantes.
- Verificar que nenhuma outra propriedade/campanha foi alterada; documentar como desfazer vínculo e arquivar/pausar rascunho.

## Preparação de 05/10/2026

- Login `mario.reis.junior@gmail.com` confirmado. Única conta existente listada antes do novo cadastro: TERMO `MSR-BR / 383-835-9068`, preservada sem alterações.
- Usuário confirmou país **Brasil**, moeda **BRL** e fuso **America/Sao_Paulo**. São escolhas autorizadas, ainda não readback de configurações salvas.
- Cadastro dedicado iniciado; título da interface identifica **896-116-6158**. Formulário de negócio preenchido apenas com “Mapa da Pesquisa”; URL ainda não submetida, cadastro incompleto, sem campanha publicada.
- A tela de URL contém declarações de direitos sobre imagens e termos. Confirmação específica solicitada antes de avançar. Pagador/forma de pagamento ainda não escolhidos.
- Proposta de orçamento submetida ao usuário: **R$11,17/dia**, referência €1 = R$5,5849 do BCE em 05/10, mantendo alvo de €2/dia. Até R$22,34/dia e R$339,57/mês pelo multiplicador usual de 30,4, com orçamento constante. Nenhum valor salvo. Fonte: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.fr.html.
- [Evidência da tela pendente](evidence-2026-10-05/ads-business-terms.jpg). [Correções de GA4 e limites restantes](../108-discovery-measurement-readiness/ga4-remediation-2026-10-05.md).
- Não houve vínculo, conversão importada, anúncio, orçamento salvo ou gasto novo. C109 permanece em preparação; C110 não ativada. Retomar o cadastro existente, sem criar uma conta duplicada.

## Continuação de 06/10/2026

- O usuário concluiu pessoalmente a etapa de website e trouxe a tela seguinte, solicitando continuidade autônoma. A interface confirmou a URL canônica do Mapa na revisão de informações do negócio.
- Descrição automática substituída por texto factual em português brasileiro: plataforma de acesso gratuito para estudantes/orientadores, planejamento de pesquisa, sugestões de IA com revisão humana, modos Rápido/Avançado. Removidas promessas de sucesso garantido e categorias de conferências, cursos e universidades. Categoria informada: “Planejamento de pesquisa acadêmica”. Sugestões de imagens desmarcadas.
- Vínculos opcionais de YouTube, telefone, app e Perfil da Empresa ignorados. Selecionado **Set up an account only**, evitando a criação da campanha automática sugerida no onboarding.
- Tela **Confirm your account settings** confirmou **Brazil**, **Brazilian Real (BRL R$)** e **(GMT-03:00) São Paulo Time**; avançado com essas escolhas já autorizadas. [Evidência](evidence-2026-10-06/account-settings.jpg).
- Cadastro **896-116-6158** chegou a **Confirm your account and payment settings**. Google pré-selecionou um perfil individual brasileiro existente de Mario Reis, cartão existente e modalidade Postpay. O formulário informa autorização temporária de **R$50**, normalmente removida em uma semana, e aceite de novos Termos do Google Ads com disposição de arbitragem. Identificadores fiscais/endereço não copiados para este registro.
- Selecionado **No** para contato comercial por telefone/mensagens. **Submit não acionado**: confirmação específica de perfil/cartão, autorização temporária e termos solicitada ao usuário. Também reapresentada a escolha de R$11,17/dia em média; sem orçamento salvo.
- Não houve nova autorização de cartão, débito, campanha publicada, vínculo GA4/Ads ou modificação no TERMO. Cadastro permanece incompleto; retomar esta mesma conta na etapa de pagamento, sem duplicá-la.

## Direção revista: campanha na MSR-BR — 06/10/2026

- O responsável perguntou expressamente por que o Mapa não poderia ser outra campanha na **MSR-BR**, utilizando o crédito existente. A separação em outra conta não é necessária para separar orçamento/anúncios/metas por campanha. A orientação anterior de conta dedicada foi substituída.
- Conta autenticada **MSR-BR `383-835-9068`**, login `mario.reis.junior@gmail.com`, moeda **EUR**, fuso Brasília. Visão geral mostrou €69,49 e Billing Summary €69,56; tratar como aproximadamente €69,50 por diferença de atualização. Último pagamento exibido: **€100 manual em 22/09/2026**. Não se trata apenas de uma oferta promocional. Nenhuma transferência ou nova cobrança foi realizada.
- TERMO `24027143907`: **Enabled**, **€2,00/dia**, Search, Maximize clicks, Eligible (Limited by budget). Não foi editado. A nova campanha Mapa, quando liberada, terá mais €2/dia em média, somando €4/dia de orçamento médio das duas campanhas. O saldo da conta é comum.
- Meta padrão da conta: Engagement, com `TERMO (web) study_activation` como ação primária. As demais ações TERMO permanecem secundárias e não foram editadas. O Mapa precisa de objetivo específico da campanha antes de publicar.
- O rascunho antigo `Research Starter - Search BR PT` (`10207635335`) estava vazio: sem URL, keywords ou anúncio; a inspeção foi encerrada descartando apenas o estado transitório da página, sem preencher seus campos.
- Novo rascunho **`10217353351`**, identificador provisório de campanha **`281499296243440`**, nome provisório **Search-5**, criado na MSR-BR. Destino `https://mapadapesquisa.com.br/`; seis keywords exatas/frase; RSA com quinze títulos e quatro descrições conforme plano; nome comercial Mapa da Pesquisa; caminhos `pesquisa/projeto`; quatro callouts próprios criados e selecionados em nível de campanha. Um grupo temporário criado nesta sessão foi removido acidentalmente ao fechar seu menu e refeito com o mesmo conteúdo; o rascunho contém um grupo, não dois.
- Segmentação salva no rascunho: Brasil por presença, português; Search Partners e Display desmarcados; AI Max, personalização de texto e expansão de URL desligados. UTMs salvas em Campaign URL options. Lances: Clicks, máximo CPC proposto €0,30; não equivale a validação no Keyword Planner.
- Orçamento **€2,00/dia** digitado. Ao avançar, Google exigiu **Confirm it's you**. A tentativa normal de Confirm não abriu uma janela de autenticação e deixou **Try again**. Confirmação pessoal solicitada ao responsável. Orçamento salvo e nome final **ainda precisam de readback após autenticação**.
- Ainda pendentes: nome final do rascunho, orçamento persistido, objetivo exclusivo Mapa, vínculo/importação GA4, treze negativas, avaliação de Keyword Planner, controle de pausa e revisão dos assets herdados (dois sitelinks de conta “Página web” e “Youtube” e logo). Não editar/remover assets ou objetivos globais usados pelo TERMO; resolver o escopo somente para a campanha Mapa.
- **Nenhuma campanha Mapa publicada ou ativada. Nenhum gasto novo do Mapa.** Cadastro dedicado incompleto permanece sem Submit. As pendências de GA4 relatadas na C108 continuam; €2/dia está autorizado, mas a condição “se o GA4 estiver correto” ainda não foi satisfeita.

### Continuidade e reversão

Retomar o rascunho `10217353351` na MSR-BR; não criar outro. Concluir a confirmação de identidade, renomear para `Mapa | Search | BR | Ativacao | Piloto`, conferir orçamento e terminar a separação de conversões/assets. Manter como rascunho ou publicar inicialmente pausado somente se a interface permitir verificar esse estado antes de gastar. Para interromper agora, basta deixar o rascunho sem publicar; os novos callouts não foram aplicados ao TERMO. Não cancelar a conta dedicada nem apagar assets sem necessidade.

## Readback concluído e medição corrigida — 06/10/2026

O pedido “pode seguir; prefiro que você faça” autorizou continuar. A confirmação de identidade deixou de impedir a gravação pela sessão normal aberta; não foi necessário pedir senha, código ou aprovação no celular. A indicação anterior de bloqueio de identidade é histórica.

- Nome final **Mapa | Search | BR | Ativacao | Piloto** salvo no rascunho `10217353351`.
- **Orçamento médio de €2,00/dia confirmado após recarregar**. Nome, Brasil/presença, português, redes extras desligadas, AI Max/expansão desligados, UTMs e conteúdos persistiram. Interface indicou All changes saved. Ao sair para Keyword Planner, usado **Save for later**, nunca Publish.
- Não foi criado outro rascunho, campanha ativa ou gasto do Mapa. TERMO e seus ajustes não foram editados. Cadastro separado continua sem pagamento; sua aba foi fechada, sem cancelar a conta.
- Sitelinks herdados identificados: “Página web” → `https://ibnhakim.wordpress.com/`; “Youtube” → `https://www.youtube.com/@ibnHakim_ma`. São inadequados ao Mapa. Não foram removidos nem alterados globalmente.
- A documentação oficial informa que sitelinks em nível de conta e campanha podem ser usados juntos: adicionar links próprios não demonstra isolamento. Resolver as associações com preservação comprovada dos assets das campanhas existentes antes de publicar: https://support.google.com/google-ads/answer/2375416?hl=en_us_us . O logo em nível de conta também exige revisão de fallback.
- Site corrigido e publicado em `v06102026.1`; recebimento de UTMs comprovado no GA4, mas origem/mídia processada e baseline ainda pendentes. [Evidência C108](../108-discovery-measurement-readiness/campaign-attribution-fix-2026-10-06.md).

[Revisão do rascunho salvo](evidence-2026-10-06/msr-br-mapa-review-saved.jpg). Estado atual no [manifesto de 06/10](campaign-draft-2026-10-06.json). Não solicitar novamente confirmação de identidade ou de orçamento sem um novo motivo observado. Ainda faltam vínculo/importação, objetivo específico do Mapa, negativas, assets e controle de pausa; a tela “ready to publish” não valida esses gates.

### Planejador e limite de CPC — leitura final de 06/10

Plano de pesquisa `1441351032`, nome **Mapa | BR | C109 | 2026-10-06**, salvo na MSR-BR com os seis termos do manifesto. Trata-se de um plano do Keyword Planner, não de outra campanha. Histórico dos últimos 12 meses para Brasil/Google exibiu traços em volume, concorrência e faixas de lance. Forecast ajustado para Brasil, português, Google, Maximize clicks e €2/dia; janela padrão 01–30/11/2026. O modelo exibiu zero cliques/impressões/custo e CPC ausente. Resultado **inconclusivo**: não interpretar ausência de histórico como demanda zero nem usar a estimativa da tela de criação (21 cliques/semana, CPC €0,30) como validação desse plano. Refinar termos/amostra antes da aprovação final. Nenhum Create campaign acionado no planejador.

## Execução remota em 06/10 — campanha efetiva, sem veiculação

O pedido posterior “pode avançar e fazer o que for preciso” autoriza concluir a preparação. A condição original de GA4 validado permanece. Os registros anteriores acima são históricos; o estado atual é o manifesto de 06/10 e as evidências desta seção.

- Rascunho `10217353351` convertido às 10:25 BRT na campanha **24325133699**, **Mapa | Search | BR | Ativacao | Piloto**, MSR-BR **383-835-9068**. A publicação ocorreu com início futuro (21/10), status Pending, e a campanha foi imediatamente pausada. **Não houve veiculação**. Leitura final: Paused, 0 impressões, 0 cliques, €0,00 de custo.
- Datas protetivas: início **21/10/2026**, fim **27/10/2026**. Não representam aprovação nem ativação automática: a campanha permanece pausada e as datas deverão ser revistas depois do aceite dos gates.
- Grupo renomeado e conferido como **Planejamento Academico**. [Tela final da campanha pausada](evidence-2026-10-06/mapa-campaign-paused-final.png).
- Orçamento próprio **€2,00/dia**, Maximize clicks com máximo **€0,30/CPC**. Readback da campanha efetiva confirmou Brasil selecionado, **Presence**, português, somente Google Search, AI Max desligado, personalização de texto/expansão de URL desligadas, assets automáticos desligados e correspondência ampla desligada. Um resumo de localização mostrou temporariamente “All countries” durante carregamento; o editor carregado confirmou o rádio Brazil e Presence selecionados, sem alteração necessária.
- Sufixo de URL confirmado: `utm_source=google&utm_medium=cpc&utm_campaign=mapa_search_br_ativacao_piloto&utm_content=planejamento_rsa`. Treze negativas em frase salvas em nível de campanha; conteúdo no manifesto.
- **Isolamento dos sitelinks:** os dois assets de conta (“Página web” e “Youtube”) foram primeiro associados às quatro campanhas preexistentes TERMO, ibn Hakim, ibn_site e QM - home - EN; as duas associações em nível de conta foram então **pausadas**, sem excluir os assets. A leitura comprovou links elegíveis nas campanhas anteriores e associações de conta pausadas, impedindo herança no Mapa. Trata-se de mudança de escopo de associação, não de ausência absoluta de alterações no TERMO. Seus anúncios, orçamento, lances e conversões não foram editados.
- Logo antigo indevido: associação somente do Mapa pausada (estava reprovada). Logo próprio `public/brand/mapa-da-pesquisa-app-icon.png` enviado, recorte quadrado conferido, salvo às 11:49 BRT, **Enabled / Pending / Under review**. A revisão de política continua pendente.
- Regra nativa **61994210**, **Mapa | Pausa por custo EUR14 | C110**, salva às 11:53 BRT e lida como Enabled. Ação: pausar apenas a campanha Mapa selecionada quando custo acumulado de todos os tempos for **>= €14**, verificação horária, notificação somente por mudança/erro. Preview: zero campanhas afetadas. A execução real ainda não ocorreu; atraso de relatórios e execução impede prometer teto instantâneo rígido.
- MSR-BR: **Auto-tagging Yes** e **Auto-apply Turned off**, lidos sem alteração. TERMO permanece Enabled, Search, Maximize clicks, €2/dia. O saldo é comum; o Mapa ainda não o consumiu.
- GA4 em 06/10: relatório processado do próprio dia ainda mostra zero sessões; o recebimento em tempo real já documentado não prova atribuição processada. Janela limpa C108 permanece pendente, pelo menos até 20/10 se não houver outra correção.

### Vínculo preparado; confirmação no clique final pendente

Propriedade **550650234** → somente **MSR-BR 383-835-9068**, tela Review and submit. **Personalized Advertising OFF**, **Allow access to Analytics features from within Google Ads OFF** e **Leave my auto-tagging settings as they are** (marcação já ativa). Não enviado. A política do controle de navegador exige confirmação no momento de criar acesso persistente a dados sensíveis; foi apresentada ao responsável a ação exata e a captura. Não tratar autorização genérica como resposta a essa confirmação.

Depois do vínculo: conferir ambos os painéis; importar somente `project_start` validado e configurar objetivo exclusivo do Mapa, sem adicionar a conversão aos objetivos padrão da conta. **Mapa ainda herda Account-default: Engagements**, portanto não pode ser ativado nesse estado. C109 e C110 não estão aceitas.

### Evidências e reversão

- [Status e custo de Mapa/TERMO](evidence-2026-10-06/campaigns-final-status.txt), [CPC](evidence-2026-10-06/mapa-bidding-final.txt), [localização e datas](evidence-2026-10-06/mapa-location-and-dates-final.txt), [UTMs](evidence-2026-10-06/mapa-url-options-final.txt).
- [Sitelinks preservados antes de pausar associações de conta](evidence-2026-10-06/account-sitelinks-preserved-before-removal.txt), [isolamento concluído](evidence-2026-10-06/account-sitelinks-isolated.txt).
- [Regra de pausa salva](evidence-2026-10-06/mapa-cost-rule.png), [negativas](evidence-2026-10-06/mapa-negative-keywords.png), [vínculo pronto, não enviado](evidence-2026-10-06/ga4-ads-link-review.png), [auto-tagging/auto-apply](evidence-2026-10-06/msr-br-auto-tagging-and-auto-apply.txt).
- Reversão: manter Mapa pausado; desativar regra 61994210 se o piloto for cancelado. Para restaurar herança anterior dos links, reativar somente as duas associações de conta registradas e revisar as associações duplicadas nas campanhas. Não apagar assets, contas ou conversões. Cadastro separado continua incompleto e sem novo pagamento.

No rascunho original, a caixa **Set a maximum cost per click bid limit** está marcada e o valor **€0,30** persistido foi relido. Orçamento diário **€2,00** também relido após voltar do Planner. [Orçamento salvo](evidence-2026-10-06/msr-br-mapa-budget-saved.png), [CPC salvo](evidence-2026-10-06/msr-br-mapa-cpc-saved.png), [previsão inconclusiva](evidence-2026-10-06/keyword-planner-forecast.png). O rascunho ficou aberto em Review e não foi publicado.

## Encaminhamento à C110 — 06/10, ~13:46 BRT

RSA Approved; campanha habilitada e Eligible (Learning), €2/dia, custo inicial zero, datas 06–12/10. A autorização mais recente substituiu a espera fixa por verificação operacional. [Registro completo](../110-google-ads-controlled-pilot/launch-2026-10-06.md). Atribuição processada/baseline continuam pendentes de observação.
