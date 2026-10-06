# Change 111 — Navegação livre, contexto versionado e histórico eficiente

Status: **concluída e publicada em 06/10/2026 — v06102026.3**.

## Objetivo e autorização

Permitir abrir qualquer etapa já criada, editar, salvar e retornar a outro ponto do projeto sem apagar ou regenerar conteúdo. Separar a tela exibida, o progresso acadêmico, o rascunho e a versão vigente do contexto. Oferecer consulta e restauração de versões com consumo controlado do Supabase.

O responsável primeiro solicitou a especificação e depois autorizou: “pode executar c111 completa”. A execução inclui aplicativo, migração e CPD no Mapa; C112, TERMO e Google Ads permanecem fora desta entrega.

## Evidência e problema atual

- `modules/research-workflow/workflow-navigation.ts` permite somente destinos anteriores à posição corrente.
- `app/api/projects/[id]/navigation/route.ts` persiste a mudança de estado/etapa e pode invalidar o mapa final mesmo sem edição acadêmica.
- Rotas de definição e capítulos podem invalidar descendentes e substituir sugestões ao validar uma origem alterada.
- `schema.ts` já distingue `proposedContent`, `approvedContent`, revisões e `elementVersions`; o histórico está no JSON principal, com limite de schema de 300 entradas. Isso não equivale a uma política de retenção ou a uma interface de recuperação.
- `workflow-references.ts` reúne notas acadêmicas sem filtrar seu estado de validação. Rascunhos e decisões vigentes precisam ser distinguidos também nessas notas.

O diagnóstico é baseado em leitura do código. Não foi auditado um projeto específico para afirmar quais conteúdos anteriores podem ser recuperados.

## Decisão de produto

| Ação | Resultado esperado |
|---|---|
| Abrir etapa já criada | Apenas consultar a etapa; nenhuma geração, invalidação ou nova versão acadêmica. |
| Editar e salvar | Persistir rascunho recuperável sem substituir a versão vigente. |
| Confirmar alteração | Atualizar a versão vigente segundo o papel e a aprovação exigida; identificar dependências afetadas. |
| Abrir etapa afetada | Mostrar conteúdo preservado e aviso de revisão, indicando sua versão de origem. |
| Pedir atualização à IA | Produzir proposta comparável, sem substituir conteúdo confirmado. |
| Aceitar proposta ou restaurar versão | Criar nova revisão rastreável, preservando a anterior e as regras de aprovação. |

O menu pode permitir consultar etapas ainda vazias para explicar os pré-requisitos, mas não deve gerar conteúdo ou conceder avanço acadêmico por navegação. Alertas de coerência continuam orientativos conforme C068; aprovação do Orientador, autorização, formato e concorrência continuam controles reais.

## Contexto e persistência

O projeto mantém a memória canônica; a IA recebe um recorte versionado em cada solicitação. Conteúdo vigente, rascunho, notas acadêmicas e pedidos pontuais têm papéis explícitos. Versões antigas podem ser usadas para comparação, nunca como decisões atuais silenciosas.

O histórico será separado do registro principal, por unidade alterada, com paginação e leitura sob demanda. Não duplicar projeto inteiro, PDFs, anexos ou referências a cada edição. A restauração deve incluir vínculos e detalhes necessários à etapa, não apenas o texto. A estratégia de migração e os limites de retenção serão validados antes de implementar, sem apagar versões existentes para caber em uma cota.

## Dependências e evolução de specs anteriores

Evolui C069 e C073: preserva a garantia de não perder dados ao voltar, amplia a navegação para etapas posteriores já existentes e substitui regeneração automática de descendentes por revisão e aceite explícitos. Amplia o escopo pós-MVP para histórico consultável, antes excluído das regras iniciais. Mantém C068, C070, C089/C104 e C106. A C112 consumirá o contrato de contexto desta Change.

## Fora de escopo

Colaboração em tempo real, aprendizado entre usuários, treinamento de modelos, upgrade automático do Supabase, exclusão automática de histórico confirmado, alteração de Google Ads/GA4, TERMO ou Research Starter.

## Documentos de execução

[Requisitos](requirements.md), [aceite](acceptance-criteria.md), [tarefas](tasks.md), [superfícies](files-to-create-or-modify.md), [validação](validation.md), [checklist](checklist.md), [consumo e decisões](notes.md), [rota de execução](model-route.md).

## Entrega

Implementação, migração, testes e publicação registrados em [CPD](cpd-2026-10-06.md). Histórico preservado em 117 projetos, 4.105 versões legadas e 451 unidades iniciais. Sem alteração do piloto Ads, TERMO ou C112.
