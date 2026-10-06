# Google Ads — lista de tarefas do Mapa da Pesquisa

Atualizado em 06/10/2026. Direção revista pelo responsável: **Mapa como campanha separada na MSR-BR `383-835-9068`**, sob `mario.reis.junior@gmail.com`, usando orçamento próprio de €2/dia e o saldo comum da conta. Preservar a campanha TERMO e seus ajustes. Não concluir o pagamento do cadastro separado `896-116-6158`. A instrução mais recente de 06/10 substituiu a espera fixa de 14 dias por verificação operacional; o piloto foi ativado, mantendo atribuição processada e baseline em acompanhamento.


**Estado atual:** Mapa 24325133699 **Enabled / Eligible (Limited)**, RSA **Approved**, €2/dia, CPC máximo €0,30, piloto **06–12/10**. Última consulta de 06/10: **1 impressão, 0 cliques e €0,00**; diagnóstico de aprendizado e recomendação de outra estratégia, sem alteração aplicada. GA4 já mostra **2 sessões e 7 eventos** processados, mas atribuição paga e baseline longa seguem abertas. Regra horária >= €14 ativa e acompanhamento diário às 09h. [Registro C110, provas e limites](changes/110-google-ads-controlled-pilot/launch-2026-10-06.md); [fechamento documental](changes/110-google-ads-controlled-pilot/cpd-documental-2026-10-06.md). Itens históricos de pausa e espera abaixo descrevem decisões anteriores; não sobrepõem a autorização revisada.

Legenda: `[ ]` pendente; `[x]` evidência obtida. Executar na ordem das fases; não marcar uma fase como concluída só porque a interface permite avançar.

## Histórico de continuidade em 03/10

O usuário autorizou prosseguir com validação, configuração e campanha condicional. O release `v03102026.3` e os testes de coleta/criação constam nas evidências C100. Foi preparado um [plano local C109](changes/109-google-ads-link-and-draft/campaign-plan-2026-10-03.md), com [rascunho estruturado](changes/109-google-ads-link-and-draft/campaign-draft-2026-10-03.json): público, seis termos, treze negativas, quinze títulos, quatro descrições e UTMs; comprimentos e consistência verificados. Isso não significa validação no Keyword Planner, vínculo ou campanha salva.

O catálogo desta sessão não expõe controle do navegador autenticado ou conexão GA4/Ads. Windsor.ai foi oferecido como alternativa externa para leitura, mas não foi instalado/conectado; ações administrativas só poderão ser usadas se o suporte e a permissão forem comprovados. Não houve alteração remota de GA4/Ads nem gasto neste turno. Permanecem pendentes os gates de recebimento, atribuição, conta/moeda/pagador e pausa operacional.

## 1. Prontidão da medição — C108

- [x] Confirmar acesso à propriedade GA4 do Mapa e ao Search Console do domínio. Evidência: leitura autenticada de 02/10; sitemap com status `Success`.
- [ ] Diagnosticar e corrigir, se comprovada a causa, as origens anômalas `dashboard / (not set)` e `unknown / (not set)` que ainda aparecem no GA4 em 25/09–01/10. Prova: relatório de origem/mídia sem poluição em uma nova janela observável; registrar causa e data da correção.
- [ ] Corrigir a semântica dos key events: `project_start` não pode disparar antes da criação persistida, e `project_completed` não pode disparar enquanto o aluno aguarda revisão do orientador. Verificar também `consent_choice` em remount. Prova: nenhum falso positivo em falha/abandono/revisão pendente e uma ocorrência por resultado real.
- [ ] Verificar o funil, o filtro de tráfego interno e ausência de dados pessoais após as correções. Em 03/10, key events e 12 dimensões `app_*` foram confirmados no Admin, mas o filtro interno ainda estava em Testing.
- [x] Confirmar indexação da URL canônica de destino: em 03/10, a inspeção da raiz no Search Console informou “URL is on Google” e “Page is indexed”. O relatório Pages agregado ainda está em processamento e deve ser reconsultado.
- [ ] Fechar a janela de pelo menos 14 dias limpos após a última correção de medição. O caminho de campanha autenticado foi corrigido em 06/10 (`v06102026.1`), portanto seu recorte exige observação até pelo menos 20/10, sem aprovação automática nessa data. A revisão inicialmente prevista para 08/10 só aprova a fase se a atribuição e os eventos estiverem íntegros; uma nova correção reinicia a janela relevante.

- [x] Em 06/10, corrigir redirecionamento autenticado que perdia UTMs e comprovar recebimento de `page_location` com as três UTMs QA na propriedade 550650234. Isso ainda não fecha atribuição processada ou baseline. [Evidências](changes/108-discovery-measurement-readiness/campaign-attribution-fix-2026-10-06.md).

## 2. Consentimento e plano da campanha — C100

- [x] Escolha separada e revisável, Consent Mode v2 e política implementados e validados no app publicado, conforme checklist/evidências C100; reconferir no gate final de lançamento.
- [ ] Definir uma conversão principal de negócio (candidata: início persistido de projeto ou conclusão persistida) e validar sua semântica e unicidade. Não usar clique, page view ou login como conversão principal por conveniência.
- [x] Público, Brasil por presença, português e intenção definidos. Oito palavras (seis exact, duas phrase) e 17 negativas phrase salvas. Keyword Planner confirmou histórico de duas palavras; CPC €0,30 mantido como hipótese conservadora. Forecast continua inconclusivo, sem garantia de entrega.
- [x] URL canônica, UTMs, RSA e callouts próprios do Mapa salvos. Links alheios isolados preservando as campanhas anteriores; logo próprio em análise.
- [x] Piloto de sete dias, regra horária de pausa por custo acumulado >= €14 e cobrança pelo saldo comum MSR-BR registrados. A regra não é teto rígido instantâneo. O orçamento próprio do Mapa já autorizado é **€2/dia em média**, na moeda EUR da MSR-BR; gasto em um dia pode superar a média, sujeito aos limites da plataforma. O TERMO mantém seu orçamento separado de €2/dia.
- [x] Responsável autorizou preparação e integração sem gasto na C109 e ativação condicional posterior. Aceite de medição C108/C100 permanece pendente; a preparação não dispensa esses gates.

## 3. Campanha separada na MSR-BR, vínculo e preparação sem gasto — C109

- [x] Confirmar conta MSR-BR `383-835-9068`, moeda EUR e saldo disponível de pagamentos manuais; a leitura de 06/10 mostra aproximadamente €69,50. O saldo será usado pelas campanhas da conta e não é reservado exclusivamente ao Mapa.
- [x] Iniciar rascunho remoto `10217353351` com conteúdo do Mapa, seis palavras-chave e segmentação definida. Convertido na campanha 24325133699 em 06/10, com início futuro e imediatamente pausado; gasto zero. Nome e €2/dia confirmados; [registro de execução](changes/109-google-ads-link-and-draft/validation.md).
- [x] Campanha própria do Mapa preparada. TERMO mantém anúncios, orçamento, lances e conversões. Seus links antes herdados da conta agora estão associados diretamente à campanha; associações globais pausadas para isolar o Mapa. Cadastro separado não concluído.
- [x] Vínculo GA4 Mapa `550650234` → MSR-BR criado em 06/10 às 12:23:42 BRT, Completed no GA4 e reconhecido pelo Ads. Publicidade personalizada e acesso ampliado via Ads desligados; papéis Viewer. Auto-tagging existente mantido.
- [x] Importada uma única ação `7825220596` project_start, Count One e sem valor. Secondary e fora dos defaults da conta para preservar TERMO; única ação do objetivo personalizado **Mapa | Projeto iniciado**, aplicado somente ao Mapa. Não há conversão paga observada ainda.
- [x] Montar campanha Search **pausada**: grupo Planejamento Academico, oito termos, 17 negativas, RSA, Brasil por presença, português, URL/UTMs, €2/dia e CPC máximo €0,30 conferidos. Search partners, Display e expansões desligados. Aceite final e revisão de política permanecem pendentes.
- [x] Preparação pausada, IDs, cobrança, tracking e reversão registrados na C109; RSA aprovado e checks operacionais de consentimento/coleta relidos na C110. Gasto da preparação zero; a campanha foi ativada somente no lançamento posterior. Logo próprio e aceite completo de atribuição permanecem itens separados.

- [x] Salvar regra nativa 61994210 para pausar somente Mapa por custo acumulado >= €14, a cada hora. Não garante teto rígido instantâneo. Logo próprio e novas palavras em análise; vínculo GA4 e objetivo exclusivo já concluídos. Auto-tagging já ativo; aplicação automática de recomendações desligada.

## 4. Piloto controlado — C110

- [x] No dia da ativação, landing, consentimento, criação persistida/deduplicação, coleta, moeda, orçamento e regra de pausa reconferidos; autorização revisada aplicada conforme lançamento C110. Atribuição processada e baseline longa continuam abertas, sem aceite presumido.
- [x] Somente Mapa ativado em 06/10; Enabled / Eligible (Learning), RSA Approved e custo inicial zero. TERMO mantém €2/dia e Maximize clicks.
- [ ] Acompanhar diariamente gasto, termos de pesquisa, negativas, reprovações, conversões e qualidade; pausar se o stop-loss ou algum guardrail for atingido.
- [ ] Ao fim do piloto, comparar custo por ativação/conclusão e qualidade com o baseline; decidir manter, ajustar ou pausar. Não aumentar orçamento automaticamente.

## Acompanhamento autônomo

Automação `mapa-concluir-ads-e-acompanhar-piloto` ACTIVE neste chat: diariamente às 09h de São Paulo, por 23 execuções, com silêncio quando não houver mudança relevante. Atualizada para acompanhar o piloto ativo de 06 a 12/10 e pausar ao atingir guardrail/fim; não resta aguardar 20/10 para ativar. Não aumenta orçamento nem altera TERMO. A C097 de 08/10 permanece separada e intacta.

## Fontes de trabalho

- Evidências e bloqueios: `changes/108-discovery-measurement-readiness/audit-2026-10-02-interim.md`.
- Execução detalhada: `changes/100-google-ads-consent-readiness/`, `changes/109-google-ads-link-and-draft/`, `changes/110-google-ads-controlled-pilot/`.
- Documentação Google: [criação de conta](https://support.google.com/google-ads/answer/6366720), [vínculo GA4/Ads](https://support.google.com/google-ads/answer/7519537), [orçamento diário médio](https://support.google.com/google-ads/answer/6385083).
