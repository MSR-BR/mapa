# Change 014 — Mapa final, rastreabilidade e coerência

Status: especificada; depende das Changes 011, 012 e 013.

## Objetivo

Consolidar as escolhas em uma página única e tornar explícita a cadeia lógica que liga prompt, problemática, objetivos, capítulos, metodologia e resultados esperados.

## Página final

A página única apresenta, nesta ordem:

1. Título da pesquisa.
2. Etapa 1: problemática da pesquisa.
3. Etapa 2: objetivo geral.
4. Etapa 3: objetivos específicos.
5. Capítulo 3: levantamento, análise/tratamento e resultados esperados por objetivo.
6. Etapa 4: tópicos do Capítulo 2 — Revisão da Literatura.
7. Etapa 5: tópicos do Capítulo 4 — Desenvolvimento/Estudo de Caso/Análise e Discussão.
8. Referências verificáveis usadas na construção.
9. Avisos e pendências de coerência.

O layout segue a lógica do “Mapa da Proposta de Pesquisa” fornecido, adaptado de forma responsiva e acessível, sem reproduzir limitações da planilha estática.

## Mapa de rastreabilidade

Cada relação é navegável:

- Prompt/tema -> candidata escolhida -> problemática validada.
- Problemática -> objetivo geral.
- Objetivo geral -> objetivos específicos.
- Objetivos específicos -> tópicos do Capítulo 2 e/ou 4.
- Objetivos específicos -> coleta -> análise -> resultado esperado.
- Objetivo geral -> título e, quando aplicável, tópico conclusivo do Capítulo 4.
- Evidência -> card/tópico/sugestão que a utilizou.

Ao selecionar um elemento, a interface destaca sua origem e seus destinos sem alterar conteúdo.

## Motor de coerência

Verificações mínimas:

- Objetivo geral responde à problemática.
- Objetivos específicos compõem o atendimento do objetivo geral.
- Todo objetivo possui capítulo correspondente.
- Todo objetivo possui método de coleta e análise compatível.
- Todo objetivo possui resultado esperado em linguagem prospectiva.
- O Capítulo 2 fornece fundamentação necessária.
- O Capítulo 4 operacionaliza análise/desenvolvimento e se conecta ao objetivo geral.
- Título é coerente com objetivo geral, objeto e recorte.
- Não existem referências desconhecidas ou afirmações empíricas apresentadas como concluídas.

## Severidades

- `blocking`: impede concluir/exportar como versão validada.
- `warning`: permite concluir com aviso explícito.
- `suggestion`: melhoria opcional.

O motor combina regras determinísticas e avaliação estruturada por IA. A IA não pode reclassificar silenciosamente uma regra determinística bloqueante.

## Edição final

- O usuário pode navegar para a etapa de origem e corrigir o elemento.
- Edição direta na página final é permitida somente quando preservar versionamento e invalidação dos dependentes; caso contrário, a página abre a etapa correspondente.
- “Concluir mapa” exige zero inconsistência bloqueante e confirmação do usuário.

## Critérios de aceite

- [ ] A página única apresenta todos os elementos validados.
- [ ] Todo elemento possui origem e destino consultáveis.
- [ ] Alterar uma origem atualiza ou invalida corretamente os destinos.
- [ ] Inconsistências bloqueantes impedem conclusão e indicam correção acionável.
- [ ] Avisos não desaparecem em exportações.
- [ ] A visualização funciona em desktop, tablet, mobile, teclado e leitor de tela.

## Testes

- Grafo de dependências completo, sem links órfãos ou ciclos indevidos.
- Regras determinísticas do motor de coerência.
- Avaliação estruturada da IA com fallback seguro.
- Navegação do alerta até a origem.
- Snapshot semântico e visual da página final nos principais viewports.

