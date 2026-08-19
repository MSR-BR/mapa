# Change 025 — Entrada estruturada da situação-problema

## Objetivo

Substituir o prompt inicial único por cinco respostas orientadas que ajudem o pesquisador a formular a situação-problema antes de iniciar a descoberta de propostas.

## Escopo

- Contextualização do problema.
- Situação observada.
- Discrepância e consequências.
- Conhecimento existente e lacuna.
- Delimitação e pergunta de pesquisa.
- Instruções acessíveis por botão `i`, com fechamento ao clicar fora ou pressionar Escape.
- Composição das respostas em um briefing textual para a IA e o Research Starter.
- Persistência dos campos no `research_workflows.content.initialBriefing`.
- Recuperação do briefing após autenticação e compatibilidade com rascunhos antigos que só tinham `prompt`.

## Critérios de aceitação

1. A tela pública e o início autenticado exibem os cinco campos, sem depender do textarea de prompt único.
2. Os cinco campos são obrigatórios, têm indicação visual `*` e validação mínima antes do envio.
3. O briefing composto não usa o texto bruto como título do projeto.
4. O fluxo de login não perde nenhuma resposta e cria um workflow com o briefing estruturado.
5. Projetos v2 existentes continuam sendo lidos pelo schema com `initialBriefing: null`.
6. O endpoint de descoberta utiliza o briefing persistido como base do pedido enviado à interpretação da IA.

## Fora do escopo

Seleção do tipo de produto acadêmico e matriz de profundidade (Change 026), SEO e landing page (entrega posterior).
