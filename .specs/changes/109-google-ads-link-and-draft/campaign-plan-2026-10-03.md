# C109 — campanha preparada localmente, não criada no Ads

Data: 03/10/2026, America/Sao_Paulo. O usuário autorizou continuar a validação GA4, configuração e campanha; o gasto continua condicionado à medição íntegra e à conta correta. Preservar TERMO conforme os specs já existentes.

Artefato de execução: [rascunho estruturado](campaign-draft-2026-10-03.json). Não é um upload efetuado nem um arquivo de importação nativo do Ads Editor; a integração futura deverá mapear esses campos e validar seu schema.

## Decisões preparadas

- Uma campanha de Pesquisa, um grupo de anúncios: orçamento pequeno concentrado em intenção de planejar pesquisa, sem divisão prematura.
- Público: estudantes de graduação/pós e orientadores com intenção de criar/organizar projeto acadêmico. Seleção por buscas; sem segmentação sensível, listas de clientes, remarketing ou personalização.
- Brasil, português e presença na localização — hipótese coerente com `pt-BR` e o produto. Não usar presença **ou interesse** como expansão geográfica automática. [Opções de localização Google](https://support.google.com/google-ads/answer/1722038).
- Seis palavras-chave iniciais em correspondência exata/frase e treze negativas contra compra de trabalhos e mapas não acadêmicos. Não negativar “gratuito”, “aluno”, “orientador”, “objetivos” ou “metodologia”, pois são compatíveis com a proposta do app.
- Um anúncio responsivo com quinze títulos, quatro descrições e quatro destaques. As promessas vêm da landing atual; sem aprovação acadêmica garantida, trabalho pronto, notas garantidas ou métricas de eficiência inventadas.
- URL canônica da raiz, UTMs estáticas de campanha e auto-tagging a validar na conta. Não substituir `gclid` nem coletar termos livres por conveniência; o app mantém os parâmetros públicos permitidos.
- Conversão candidata única: `project_start` após persistência. Conclusão supervisionada é diagnóstico secundário até validar sessão/atribuição. Não importar eventos de clique/login/consentimento como conversão primária.

## Orçamento e lances

Autorização: €2/dia **em média**. A conta ainda não teve moeda/faturamento conferidos; não digitar `2` presumindo euros numa conta BRL e não fixar câmbio sem verificação. O orçamento médio padrão pode gerar até €4 num dia e €60,80 num mês completo com orçamento constante. [Regra de gastos Google](https://support.google.com/google-ads/answer/1704424).

Proposta reversível: revisão em sete dias e alerta/pausa ao atingir €14 equivalentes, sem aumento automático. Isso é um limiar operacional proposto, não garantia de teto rígido: regras podem rodar com atraso e a pausa não desfaz gasto acumulado. Antes de ativar, registrar mecanismo real, periodicidade e margem. Não há monitor ou regra remota criada neste turno.

Proposta inicial de lances: maximizar cliques com limite de CPC equivalente a €0,30. É escolha conservadora a confirmar no Keyword Planner, não uma previsão de CPC, alcance ou conversões. Se o leilão não permitir tráfego útil nesse limite, manter a campanha pausada e revisar; não subir orçamento automaticamente. Não usar CPA/ROAS inventados em uma conta sem histórico confiável.

## Conta, pagamento e isolamento

- Login solicitado: `mario.reis.junior@gmail.com`.
- GA4: propriedade `550650234`, tag `G-MKFYYRZG87`.
- Conta TERMO `383-835-9068` permanece excluída. Não vincular o GA4 do Mapa, importar conversão ou criar campanha nela.
- Identificar/criar a conta dedicada ao Mapa somente com confirmação de país, moeda, fuso, perfil pagador e origem dos fundos. Nunca inventar informação fiscal ou cadastrar cartão por suposição.
- Compartilhar login/perfil pagador não comprova compartilhamento de saldo: o Google documenta contas de pagamentos próprias para contas Ads. [Perfis de pagamentos](https://support.google.com/google-ads/answer/7268503).
- Desativar publicidade personalizada no vínculo e comprovar estado final. Verificar o vínculo nos dois produtos e evitar vincular a conta gerenciadora com alcance maior por conveniência. [Vínculo GA4/Ads](https://support.google.com/analytics/answer/9379420).

## Verificação pendente no GA4

1. Confirmar a propriedade/stream e recebimento de uma criação controlada após `v03102026.3`, com uma ocorrência de `project_start`.
2. Validar aquisição real com UTMs e consentimento, sem confundir requisição interceptada com entrada no GA4.
3. Confirmar evento-chave depois da prova. Rever medição automática de histórico para não duplicar o page view manual.
4. Conferir exclusões indesejadas de referência, filtro interno, funil e parâmetros `app_*`; não apagar definições/dados históricos.
5. Registrar janela pós-correção e limitações antes de qualquer otimização de orçamento. 08/10 é ponto de revisão, não garantia de lançamento.

## Capacidade e ação externa necessária

Foi verificado novamente o catálogo de ferramentas desta sessão: há abertura de abas Codex, mas não controle/inspeção do navegador autenticado, API GA4 ou API Ads conectada. A aba aberta pelo usuário não foi lida por automação neste turno.

A skill de gestão de integrações localizou Windsor.ai disponível, não instalado/conectado. Foi oferecida como alternativa opcional para ler métricas GA4/Ads e executar somente as ações de Ads que o serviço efetivamente suportar. A conexão externa requer decisão/consentimento do usuário; não foram transferidos cookies, credenciais ou dados para ela. Não presumir suporte à criação de conta, vínculo GA4 ou administração de filtros/eventos — isso só poderá ser confirmado após conexão individual. O usuário preferiu originalmente o navegador Codex; restaurar seu controle é o caminho principal, e não foi substituído silenciosamente por serviço externo.

Digital Discovery Audit orientou a separação entre rascunho local, prova de coleta e configuração efetiva na propriedade. O gate de conversão/atribuição impede declarar Ads pronto neste estado.

## Resultado deste turno

Plano e textos preparados; comprimentos e consistência do rascunho verificados localmente. Nenhuma alteração remota de GA4/Ads, nenhuma campanha salva, nenhum gasto, nenhum terceiro conectado e nenhuma mudança de código/produção realizada neste turno. C109/C110 não concluídas.
