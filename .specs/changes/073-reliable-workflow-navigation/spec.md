# Change 073 — Navegação e validação confiável das etapas

**Status:** concluída

## Modelo usado

- gpt-5.6-sol com raciocínio xhigh, conforme escolha confirmada antes da execução.

## Objetivo

Eliminar a permanência indevida na etapa já validada, tornar o progresso compreensível e navegável e impedir que desvios de IDs na resposta da IA deixem a metodologia vazia.

## Escopo

- substituir refresh ambíguo por navegação explícita após transições de etapa;
- diferenciar macroetapa (`N/4`) de passo interno (`N/M`);
- permitir clique somente em etapas e passos anteriores, preservando o conteúdo salvo;
- criar uma rota autenticada e concorrente por revisão para retorno direto;
- reconciliar linhas metodológicas geradas com os objetivos reais, corrigindo IDs inválidos ou duplicados;
- remover associações a tópicos inexistentes e preencher uma associação válida quando necessário;
- manter o título final gerado pela IA e editável pelo usuário.

## Fora de escopo

- não permitir salto para etapas futuras;
- não mudar os critérios acadêmicos ou exigir nova geração ao apenas voltar;
- não alterar papéis de conta, RLS ou credenciais;
- não substituir conteúdo válido criado pelo usuário.

## Critérios de aceite

1. Validar objetivos específicos conduz aos capítulos com um único clique e uma única requisição.
2. A barra mostra `Etapa N/4`; subpassos usam `Passo N/M` e não repetem a mesma numeração.
3. Etapas e passos anteriores são botões acessíveis; atual e futuros não são navegáveis.
4. O retorno direto atualiza somente estado, etapa ativa e revisão, sem apagar conteúdo acadêmico.
5. UUIDs de objetivo inválidos ou duplicados vindos da IA são reconciliados com OEs/OEG reais.
6. A inicialização da etapa 4 sempre entrega uma linha por OE e uma linha de síntese para OEG quando há contexto válido.
7. Testes, lint, tipos, exportações, build e verificação ponta a ponta passam.

## CPD

- **Check:** testes unitários de ordenação/reconciliação, fluxo autenticado, navegador, lint, tipos, exportações e build.
- **Persist:** conteúdo salvo e IDs reais permanecem canônicos; navegar para trás não regenera nem apaga dados.
- **Deploy/document:** publicar somente após os gates e registrar evidências de avanço, retorno e etapa 4.
