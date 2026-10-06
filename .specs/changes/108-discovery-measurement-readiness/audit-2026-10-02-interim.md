# C108 — Auditoria de SEO, indexação e GA4 (em andamento)

Reavaliado em 03/10/2026. Estado: C108 **não aprovada**; campanha e vínculo Ads continuam bloqueados. Escopo: leitura do checkout, site público, navegador isolado, capturas enviadas pelo usuário, leitura autenticada no Safari de GA4/Ads/Search Console e evidências históricas das C097–C100. Nenhuma propriedade Google ou campanha foi modificada; apenas navegação, inspeção de URL e filtros temporários de relatório.

## Veredito executivo

- SEO técnico público: sinais principais saudáveis na verificação atual.
- Indexação no Google: propriedade de domínio e sitemap confirmados; em 03/10, a inspeção da raiz informou “URL is on Google” e “Page is indexed”. O relatório agregado Pages ainda está em processamento.
- GA4: coleta e configuração básica verificadas, mas a atribuição pós-C097 ainda contém `dashboard` e `unknown`. `project_start` e `project_completed` estão marcados como key events, porém o código pode registrá-los antes do respectivo resultado persistido. O filtro de tráfego interno segue em Testing e os sinais de Consent Mode estão inativos. A janela de 14 dias não está completa.
- Google Ads: NÃO PRONTO. Não há consentimento de publicidade revisável/Consent Mode v2 na implementação atual; faltam prova do baseline e aceite da C100. A conta Ads aberta foi identificada pelo usuário como pertencente ao TERMO, não ao Mapa.

## Reavaliação autenticada de 03/10/2026

| Controle | Evidência nova | Veredito |
|---|---|---|
| Search Console | Inspeção de `https://mapadapesquisa.com.br/` na propriedade `sc-domain:mapadapesquisa.com.br`: “URL is on Google”, “Page is indexed”, HTTPS válido. Relatório Pages agregado ainda diz “Processing data”. | Raiz indexada; agregados pendentes |
| GA4, últimos 7 dias | Propriedade `550650234`, 26/09–02/10: 19 usuários ativos, 9 novos, 848 eventos. Sessões por origem/mídia incluem `(direct)/(none)` 9, `dashboard/(not set)` 9, `accounts.google.com/referral` 7, `unknown/(not set)` 6 e outra linha `dashboard/` 2. O relatório é “mostly complete”; a causa da anomalia não foi comprovada. | Atribuição não aprovada |
| Eventos | No mesmo período: `project_start` 8 eventos/5 usuários; `project_completed` 5/4; `consent_choice` 70/19; `login_success` 26/11. Esses volumes não provam duplicidade por si sós. | Coleta confirmada; semântica de conversão defeituosa no código |
| Key events | Admin > Events lista `project_start`, `project_completed` e `purchase` (este último sem dados de stream). | Configuração confirmada; não importar para Ads agora |
| Funil | Exploração salva “Mapa — Jornada principal” aberta sem edição. Na janela padrão 05/09–02/10: login concluído 11 usuários, projeto iniciado 31, etapa concluída 24, projeto concluído 8. É funil aberto e mistura antes/depois de C097; não é coorte de conversão para Ads. | Existe e retorna dados; qualidade depende de corrigir eventos e refiltrar janela |
| Dimensões | Admin > Custom definitions lista 12 dimensões `app_*` de 24/09 e 11 legadas, inclusive `source`. O código atual emite somente a allowlist `app_*`; não foi demonstrado que a contaminação nova venha desse código. | Contrato atual confirmado; origem anômala ainda sem causa isolada |
| Tráfego interno | Admin > Data filters: `Internal Traffic`, operação Exclude, estado **Testing**. | Exclusão efetiva não comprovada |
| Consentimento | Admin > Consent settings, stream Web: `analytics_storage`, `ad_storage`, `ad_user_data` e `ad_personalization` aparecem como **inactive**. Código carrega GA4 só após aceitar métricas e não implementa Consent Mode v2 nem revisão de escolha. | Bloqueio para Ads; “No issues detected” do painel não equivale a sinais ativos |
| Integrações | Admin > Product links: Google Ads links `Completed (0)`; Search Console vinculado ao domínio Mapa desde 24/09, stream `15460310071`. | Isolamento Ads preservado; Search Console ligado |
| Retenção | Admin > Data retention: eventos 2 meses, usuários 14 meses. | Estado conhecido; não alterado |
| Site público | Em 03/10, raiz HTTP 200, `/login` HTTP 200 com `x-robots-tag: noindex, nofollow, noarchive`; robots e sitemap respondem e apontam à raiz canônica. | Smoke básico aprovado |

### Falhas de semântica detectadas no código atual

1. **P1 — `project_start` antes do projeto existir.** `PublicStartForm.continueToLogin` emite o key event antes até de salvar o rascunho local e antes do login; `QuickStartForm.handleSubmit` o emite no submit, antes da ação de criação responder. Assim, abandono, falha de armazenamento ou erro do servidor podem contar como ativação. Prova de correção: emitir o evento apenas após confirmação de projeto persistido e demonstrar uma ocorrência por criação real, sem evento em falha/abandono.
2. **P1 — `project_completed` antes da conclusão supervisionada.** `FinalMapWorkspace.submit("complete")` emite o evento em qualquer resposta 200 com workflow; para aluno supervisionado, a rota retorna 200 com mensagem “Aguardando revisão” e mantém o estado anterior, sem concluir. Não há outro emissor de `project_completed` na aprovação posterior do orientador. Prova: medir conclusão somente quando o estado persistido for `completed`, inclusive após aprovação do orientador, uma única vez.
3. **P2 — `consent_choice` não representa escolha única.** `GoogleAnalytics` emite `consent_choice` quando o componente monta e encontra `gtag`, não somente na ação de escolher. Os 70 eventos/19 usuários no período são compatíveis com remounts; a causa exata do volume no GA4 não foi isolada. Prova: uma emissão na mudança de preferência, nenhuma em navegação/remount.

### Limites e decisão

- Não foi feita jornada de produção que cria um projeto real, para não gerar dados de usuário apenas como teste de auditoria; a semântica de emissão foi comprovada por leitura do fluxo de código/servidor e deve ser validada end-to-end após correção.
- O teste local `node --import tsx --test tests/analytics.test.ts` não executou: esta cópia não tem `node_modules/tsx` e o Node disponível é 20, enquanto o projeto pede 22. Isso não significa falha do teste; é limitação do ambiente de auditoria. Não foram instaladas dependências.
- A automação de 08/10 pode **reavaliar**, mas não aprovar automaticamente: defeitos de conversão e atribuição exigem correção e nova janela limpa. C100 (consentimento/planejamento) pode ser preparada como trabalho separado, mas C109/C110 não devem ocorrer hoje.

## Evidência atual

| Controle | Observação de 02/10 | Estado |
|---|---|---|
| URL canônica | Raiz HTTPS responde 200; home.html responde 308 para a raiz; DOM da raiz declara canonical para a própria raiz, lang pt-BR, H1, descrição e imagem social. | Aprovado no público |
| Sitemap e robots | Sitemap XML contém apenas a raiz, com lastmod 24/09; robots permite / e bloqueia /api/. Search Console lista `https://mapadapesquisa.com.br/sitemap.xml`, enviado em 24/09, última leitura em 30/09, status Success, 1 página descoberta. | Sitemap aprovado; indexação por URL ainda não relida |
| Login | /login responde 200 com meta robots noindex, nofollow, noarchive; robots permite ler a diretiva. | Aprovado no público |
| Dados estruturados | Um bloco JSON-LD presente na raiz; elegibilidade atual em ferramenta Google não foi refeita. | Parcial |
| Performance | Duas amostras no navegador iPhone 15 sem throttling: LCP 304 ms (H1) e CLS 0 em ambas. Isso NÃO substitui Lighthouse móvel ou Core Web Vitals de campo. | Parcial |
| Search Console | O TXT de verificação permanece no DNS (uma ocorrência sem revelar o valor). A propriedade de domínio `sc-domain:mapadapesquisa.com.br` abriu autenticada. Sitemaps mostra Success e 1 página descoberta. Em 03/10, a inspeção da raiz confirmou indexação; o relatório Pages agregado segue em processamento. | Raiz indexada; agregado pendente no Google |
| GA4 no cliente | Código usa allowlist de eventos/parâmetros app_* e carrega a tag apenas após aceitar métricas. Navegador isolado: antes da escolha, zero script Google/gtag; após recusa, zero script Google/gtag. | Implementação básica aprovada |
| GA4 na propriedade | Safari autenticado abriu a propriedade Mapa (`p550650234`). O recorte atualizado de 26/09–02/10 e as configurações Admin constam na seção de reavaliação acima. As capturas de 30 dias enviadas pelo usuário misturam períodos anteriores e posteriores à C097. | Coleta/key events confirmados; semântica de conversões reprovada |
| Atribuição de sessões | No recorte pós-correção de 25/09–01/10, a tabela de origem/mídia ainda mostra `dashboard / (not set)` (11 sessões), `unknown / (not set)` (10), `(direct) / (none)` (7), `accounts.google.com / referral` (7) e `4wja0.r.bh.d.sendibt3.com / referral` (5). Isso confirma persistência de dados anômalos no relatório depois de C097; a causa não foi isolada. | Falha no gate de aquisição; diagnóstico necessário |
| Conta Ads | Safari autenticado abriu Ads sob `mario.reis.junior@gmail.com`; a conta exibida era `MSR-BR`, ID `383-835-9068`, que o usuário identificou como TERMO. Apenas leitura da visão geral. Em 02/10, o usuário autorizou uma conta separada para o Mapa sob o mesmo login, sujeita aos gates e à confirmação de país, moeda, fuso e cobrança; nenhuma conta do Mapa foi criada. | TERMO fora de escopo; Mapa pendente |
| Consentimento de publicidade | Interface só aceita/recusa métricas uma vez, sem controle visível de revisão. Código não define ad_storage, ad_user_data, ad_personalization ou analytics_storage por Consent Mode v2. Admin > Consent settings confirmou os quatro sinais inativos. Texto público não descreve Ads. | Falha bloqueante para C109/C110 |
| Baseline limpo | C097 iniciou observação em 24/09 e definiu fechamento em 08/10. Em 02/10 não há 14 dias completos. | Pendente por data e evidência |

## Achados priorizados

| Severidade | Achado | Impacto | Fechamento |
|---|---|---|---|
| P1 | Falta consentimento de publicidade separado, revisável e revogável; Consent Mode v2 ausente. Confiança alta: código e browser. | Vincular/importar conversões ou anunciar antes disso cria risco de privacidade/medição. | C100 com testes de default/update/revogação, política e Tag Assistant. |
| P1 | A raiz está indexada e o sitemap é válido; Pages agregado ainda processa. Key events, filtro e funil tiveram readback, mas a semântica de conversão falha e o funil visto mistura períodos. | Não é possível importar conversões confiáveis para Ads. | Corrigir `project_start`/`project_completed`, validar jornada real e refiltrar o funil. |
| P1 | Atribuição do GA4 continua anômala em 25/09–01/10, após C097: `dashboard / (not set)` e `unknown / (not set)` totalizam 21 sessões na tabela. Confiança alta para persistência no relatório, causa ainda indeterminada. | Otimização Ads com fonte/mídia incorretas. | Investigar origem da poluição, corrigir se comprovada, validar novamente em janela limpa. |
| P1 | Conta Ads atualmente aberta pertence ao TERMO segundo o usuário. | Vínculo ou campanha nela misturaria projetos e cobrança. | C109 exige identificar/criar conta dedicada ao Mapa; não tocar no TERMO. |
| P1 | Baseline C097 incompleto até 08/10. Confiança alta: data registrada na C097. | Não há base limpa suficiente para otimização paga. | Reabrir C108 em ou após 08/10 e auditar 14 dias com amostras. |
| P2 | Amostras móveis atuais não têm throttling nem dados de campo. Confiança alta. | Não provam desempenho sob rede móvel real. | Repetir Lighthouse móvel e ler Core Web Vitals quando houver dados suficientes. |

## Próximas condições

1. Reconsultar Pages agregado do Search Console quando terminar o processamento; raiz, sitemap, key events e filtro já tiveram readback. Revalidar o funil GA4 após corrigir os eventos.
2. Corrigir a semântica de `project_start`, `project_completed` e `consent_choice`; testar ausência de falso positivo em falha, abandono e revisão pendente.
3. Diagnosticar a origem de `dashboard / (not set)` e `unknown / (not set)` no recorte pós-C097; não aprovar atribuição enquanto persistirem.
4. Em ou após 08/10, comparar 14 dias de source/medium, key events, duplicidade, funil e filtro interno. Se houver correção relevante depois de 24/09, observar uma nova janela limpa antes de otimizar Ads.
5. Se aprovado, executar C100; depois C109 identifica/cria uma conta Ads dedicada ao Mapa sob o login autorizado, confirma cobrança, cria vínculo e campanha pausada; C110 é o único ponto de ativação/gasto.
6. Não criar conta Ads, vínculo, conversão ou campanha nesta auditoria.

Observação para a C109: a configuração “Enable Personalized Advertising” do vínculo GA4/Ads pode vir ativada por padrão; o vínculo futuro deverá deixá-la desativada e comprovar o estado final. Existe uma automação já programada para reavaliar o baseline da C097 em 08/10; ela não autoriza ativar anúncios.

O Google informa que vários Ads podem reutilizar um perfil de pagamentos, mas cada conta Ads mantém sua própria conta de pagamentos; o login comum não prova saldo compartilhado. Não foi verificado se a “grana” citada é método de pagamento, saldo pré-pago ou crédito promocional.

## Fontes de regra

- Google Consent Mode: https://developers.google.com/tag-platform/security/guides/consent
- Google Ads orçamento médio diário e limite mensal: https://support.google.com/google-ads/answer/1704424
- Vínculo GA4/Ads: https://support.google.com/analytics/answer/9379420
- Perfis e contas de pagamentos Ads: https://support.google.com/google-ads/answer/7268503
