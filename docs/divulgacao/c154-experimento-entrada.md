# C154 — Experimento de clareza na entrada

**Estado:** candidata local pronta para revisão; publicação pendente de autorização específica. **Consulta da base:** 27/10/2026, 18h20–18h27 (`America/Sao_Paulo`), com GA4 e Ads de 06–26/10 em dias completos nos respectivos fusos e Search Console final até 24/10. **Conferência do site e do código público:** 27/10/2026. Nenhuma plataforma, campanha ou página publicada foi alterada.

## Decisão proposta

Adicionar **uma única frase de apoio abaixo dos botões do primeiro bloco da página inicial**, mantendo título, descrição, texto e destino dos botões, cartões de modos, vídeo e links de divulgação. A frase candidata é:

> Prepare sua ideia sem login. Para gerar e guardar o mapa, entre com sua conta Google.

A hipótese é que explicar cedo o limite do acesso sem login reduza a hesitação antes de abrir `/mapa`, sem prometer geração anônima. A página já informa isso em uma seção posterior; o formulário público permite preparar a ideia e apresenta “Continuar com Google” para prosseguir. Portanto, a frase antecipa uma informação verdadeira, sem mudar o serviço. **A causa da baixa progressão da UFF não está demonstrada**: intenção do público, dias concentrados, consentimento e falhas do produto também podem influenciar.

| Versão | Primeiro convite na home | Frase abaixo dos botões | Destino do CTA |
|---|---|---|---|
| A — publicada em 27/10 | “Começar meu projeto” | Nenhuma | `/mapa` |
| B — candidata C154 | “Começar meu projeto” | “Prepare sua ideia sem login. Para gerar e guardar o mapa, entre com sua conta Google.” | `/mapa` |

O primeiro teste altera **somente a frase de apoio**. O destino do CTA interno permanece `/mapa`, **sem UTM interno**, para não sobrescrever a aquisição original da sessão. A prévia local [mostra A e B lado a lado](c154-preview.html); é um esquema revisável, não um screenshot fiel de produção.

## Evidência e público

Na [baseline C152](c152-baseline-ativacao.md), o GA4 registrou 225 pessoas com `first_visit` em 06–26/10, das quais 212 pousaram na home; 84 primeiras visitas tiveram `uff.br / referral` como origem do primeiro passo, e 6 percorreram `first_visit` → `login_success` → `project_start` dentro da janela (**7,1%, 6/84**). A [C153](c153-diagnostico-friccao.md) apurou 103 sessões UFF, sendo 91 com pouso na home e 100 sessões concentradas em 23–26/10. A UFF é o **segmento prioritário de leitura**, mas a frase seria visível a todos os visitantes da home, inclusive orgânico e direto. O grupo direto pode conter equipe sem etiqueta.

O GA4 só carrega após consentimento de métricas. `first_visit` é a primeira visita **observada**, não necessariamente a primeira visita real. O funil conta **pessoas em sequência**, não projetos distintos, e não fixa prazo de acompanhamento. O filtro das consultas excluiu `codex_validation / qa` e `mapa_team / internal`; o funil do conector não aceita esse filtro, mas o primeiro passo não apresentou essas origens e coincidiu com as 225 pessoas com `first_visit` no relatório filtrado. A amostra UFF é pequena e concentrada; não há base para estimar o efeito da frase.

## Protocolo de medição

**Métrica primária descritiva:** pessoas medidas com origem inicial `uff.br / referral` que percorrem `first_visit` → `login_success` → `project_start` na janela, divididas pelas pessoas medidas com `first_visit` UFF na mesma janela. Relatar sempre numerador, denominador, período e fuso. O ponto de partida é **6/84**, sujeito à maturação desigual. A mesma leitura para todas as origens externas é uma verificação de contexto, nunca soma de usuários por origem ou dia.

**Diagnóstico da transição:** contar pessoas que chegam a `/mapa` após a home, quando a consulta sequencial e o escopo da origem permitirem. Uma visualização de `/mapa` não identifica qual botão foi clicado; não chamar isso de CTR do CTA sem evento próprio. A passagem a `login_success` (15/84 UFF na baseline) ajuda a localizar a perda, mas não identifica sozinho a razão. O CTA e seu destino não recebem evento nem parâmetros novos nesta proposta.

**Guardrails:** acompanhar, por pessoas afetadas e eventos em colunas separadas, `generation_failed`, `stage_blocked` classificado em validação/falha e `export_pdf_failed`. A baseline C153 encontrou 44 falhas de geração em 12 pessoas e 114 bloqueios de etapa em 14, com repetição forte; não dividir esses eventos por visitantes para fabricar uma taxa de falha. O primeiro avanço **por projeto distinto em 7/30 dias** permanece indisponível até o agregado solicitado ao desenvolvimento na C152; não usar `stage_completed / project_start` como substituto.

**Canal e atribuição:** analisar UFF, orgânico, direto, possível QR e pago separadamente. `scanned.page / referral` não está confirmado como QR; o Ads tem zero conversões atribuídas à campanha no período da baseline e apenas 1 das 10 sessões `google / cpc` do GA4 traz seu ID. Não creditar ao piloto os dois `project_start` de `google / cpc` sem ID. Search Console mede descoberta orgânica, não comportamento na home. Respeitar GA4 `America/Rio_Branco`, Ads `America/Sao_Paulo`/EUR e Search Console no calendário do Pacífico.

**Janela:** se a candidata vier a ser publicada, registrar a hora e a revisão exatas; excluir o dia da publicação e dias parciais. Ler os primeiros **14 dias completos de GA4** apenas como monitoramento descritivo, com uma consulta após o processamento dos últimos dias. Comparar com 14 dias completos anteriores, explicitando mudanças de canal e volume; a concentração UFF de 23–26/10 torna a comparação pré/pós especialmente frágil. Não declarar ganho causal ou significância. Uma alocação 50/50 com os 84 novos visitantes UFF da baseline deixaria cerca de 42 por grupo e, na proporção observada, apenas cerca de 3 inícios por grupo; por isso, um A/B formal agora seria pouco informativo. Se o fluxo de visitas crescer, definir tamanho de amostra e identificação estável de variante antes de propor um teste controlado; isso exigiria outra aprovação e implementação do projeto de desenvolvimento.

**Segmentos:** relatar papel Aluno/Orientador e modo Rápido/Avançado somente quando houver pessoas elegíveis e identificáveis por coorte. As contagens atuais por papel e modo são de eventos e não oferecem denominadores válidos; não publicar taxas segmentadas.

## Peça UFF e UTMs — proposta posterior, fora do primeiro teste

Uma eventual peça UFF pode dizer: **“Comece pela sua ideia de pesquisa. Prepare o primeiro rascunho sem login; para gerar e guardar o mapa, entre com Google.”** CTA sugerido: **“Abrir o Mapa da Pesquisa”**. Destino proposto, somente se a própria peça for aprovada: `https://mapadapesquisa.com.br/?utm_source=uff.br&utm_medium=referral&utm_campaign=mapa_uff_entrada_c154&utm_content=convite_v1`. Os valores propostos preservam `uff.br / referral` como origem/meio e identificam a peça. **Não alterar o link UFF junto com a frase da home**, pois duas mudanças simultâneas dificultariam a interpretação; a peça e seu destino precisam de autorização própria e confirmação do responsável pelo canal.

## Efeito, custo e critério de leitura

| Recomendação | Evidência | Efeito esperado, se a hipótese estiver certa | Custo ou risco | Verificação |
|---|---|---|---|---|
| Testar a frase B na home, após aprovação | Informação existente aparece depois do primeiro CTA; 91/103 sessões UFF pousaram na home e só 6/84 novas pessoas UFF chegaram ao início sequencial | Mais visitantes entendem a etapa sem login e chegam ao início do projeto | Pequena mudança no desenvolvimento e revisão responsiva; a frase pode ocupar espaço no celular ou criar expectativa errada se o texto for encurtado | Inspecionar desktop/celular e fluxo anônimo; depois comparar pessoas no funil por canal em dias completos, com limites de atribuição |
| Obter agregado anônimo de avanço por projeto | GA4 não liga etapa ao projeto e 44 falhas de geração ocorreram em 12 pessoas | Saber se a entrada melhorou uso efetivo, além de inícios | Trabalho do desenvolvimento; proteger conteúdo e identificadores | Agregado de projetos distintos em 7/30 dias e falhas por tentativa, sem textos nem dados pessoais |
| Manter peças e canais estáveis durante a primeira leitura | UFF concentrou 100/103 sessões em quatro dias; pago tem atribuição não comprovada | Menos confundimento ao interpretar a mudança | Custo de oportunidade de adiar outro teste | Registro de publicação, volume por origem, campanha Ads por ID e Search Console em fonte separada |

**Critério de decisão:** a primeira janela pode confirmar que a frase é legível, correta e não coincide com piora evidente de transição/falhas; não pode provar aumento causal de ativação com o volume atual. Se não houver volume comparável de UFF, registrar “inconclusivo” e manter a análise por origem sem somar públicos heterogêneos. Publicação e rollback só pelo projeto de desenvolvimento após aceite específico da revisão e do destino.
