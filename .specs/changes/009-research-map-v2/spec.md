# Change 009 — Mapa da Pesquisa v2

Status: concluída em 07/08/2026.

## Objetivo

Substituir a geração monolítica atual por uma jornada acadêmica progressiva, validável e rastreável. O usuário parte de um prompt geral, escolhe uma entre seis propostas fundamentadas e aprova ou altera cada relação lógica até obter o mapa final da proposta de pesquisa.

## Resultado esperado

```text
Prompt geral
  -> pesquisa assistida por IA + Research Starter
  -> 6 propostas de problemática
  -> validação da problemática
  -> validação do objetivo geral
  -> validação dos objetivos específicos
  -> validação da revisão da literatura
  -> validação do desenvolvimento/estudo de caso
  -> metodologia e resultados esperados coerentes
  -> mapa final rastreável
```

## Princípios obrigatórios

- O fluxo representa relações acadêmicas, não capítulos independentes.
- A IA sugere; o usuário escolhe, edita e valida.
- O Research Starter fornece literatura e evidências verificáveis; não substitui o raciocínio metodológico.
- Nenhuma etapa posterior pode ser tratada como definitiva se a etapa de origem for alterada.
- Toda saída mantém origem, destino, versão e estado de validação.
- Não são gerados resultados empíricos, conclusões factuais ou referências inexistentes.
- O projeto legado permanece legível durante a transição.

## Escopo das mudanças dependentes

| Ordem | Mudança | Entrega |
| --- | --- | --- |
| 009 | Mapa da Pesquisa v2 | Contrato global, estados e regras transversais. |
| 010 | Descoberta de propostas | Prompt, pesquisa e seis cards. |
| 011 | Problema e objetivos | Etapas 1, 2 e 3 com validação humana. |
| 012 | Capítulos 2 e 4 | Etapas 4 e 5 derivadas dos objetivos. |
| 013 | Metodologia e resultados | Coleta, análise e impactos por objetivo. |
| 014 | Rastreabilidade e coerência | Mapa final, dependências e alertas. |
| 015 | Transição e entrega | Legado, dashboard, exportação, testes e rollout. |

## Estados do fluxo

- `draft_prompt`: prompt ainda não pesquisado.
- `discovering`: IA e Research Starter em execução.
- `choosing_problem`: seis propostas disponíveis.
- `validating_general_objective`: problemática escolhida; objetivo geral em revisão.
- `validating_specific_objectives`: objetivo geral validado; objetivos específicos em revisão.
- `validating_literature`: estrutura do Capítulo 2 em revisão.
- `validating_development`: estrutura do Capítulo 4 em revisão.
- `validating_methodology`: métodos e resultados esperados em revisão.
- `reviewing_map`: mapa completo em revisão.
- `completed`: todas as etapas obrigatórias validadas e versão final salva.
- `failed`: operação externa falhou sem destruir a última versão válida.

## Regras transversais

- Avançar exige validação explícita da etapa atual.
- Voltar é sempre permitido.
- Editar uma origem invalida somente seus descendentes e exige confirmação antes de regenerá-los.
- Cada etapa preserva rascunho local e persistido.
- Regeneração nunca sobrescreve silenciosamente alterações humanas.
- As chamadas externas são idempotentes por usuário, projeto, etapa e versão de entrada.
- O idioma padrão é português do Brasil; consultas bibliográficas podem ser otimizadas em inglês.

## Modelo de domínio alvo

- `ResearchWorkflow`: projeto, versão do fluxo, estado atual e timestamps.
- `ProblemCandidate`: posição, tipo (`exact` ou `alternative`), título, problemática, resumo, consulta, termos, área, proveniência e referências.
- `ValidatedElement`: tipo, conteúdo proposto, conteúdo aprovado, estado, versão e autor da última alteração.
- `SpecificObjective`: ordem, verbo no infinitivo, conteúdo e relação com o objetivo geral.
- `ChapterTopic`: capítulo, ordem, título, objetivos atendidos e referências.
- `MethodologyMapping`: objetivo específico, coleta, análise/tratamento e resultado esperado.
- `TraceLink`: elemento de origem, elemento de destino, regra e versão.
- `CoherenceFinding`: severidade, regra, elementos envolvidos, mensagem e resolução.

Os nomes físicos de tabelas e a estratégia de normalização serão fechados antes da migração. JSON versionado pode ser usado para estruturas aninhadas, desde que continue validável, consultável e protegido por RLS.

## Segurança e custos

- Todas as operações continuam limitadas ao proprietário por RLS e autorização server-side.
- IA e Research Starter permanecem exclusivamente no backend.
- O prompt integral não é registrado em logs.
- O número de consultas e referências recebe limites explícitos por execução.
- A descoberta deve reutilizar uma mesma busca de evidências para formar as seis propostas sempre que tecnicamente possível.
- Nenhum recurso pago adicional ou novo serviço é autorizado por esta especificação.

## Critérios de aceite globais

- [x] A máquina de estados impede saltos entre validações obrigatórias.
- [x] Contratos de elementos e links permitem rastrear cada item à sua origem.
- [x] O grafo de dependências invalida somente descendentes.
- [x] O schema diferencia conteúdo sugerido, editado, validado e desatualizado.
- [x] Estado estável permite recuperação após falha externa.
- [x] Projetos antigos permanecem na versão 1, sem conversão automática.
- [x] RLS, autorização, schemas, lint, TypeScript, testes e build passaram no quality gate da fundação.

## Entrega realizada

- Schema `2.0.0` e contratos tipados do workflow.
- Máquina de estados, recuperação de falha e grafo de invalidação.
- Persistência server-side aditiva em `research_workflows`.
- `workflow_version = 1` para todo projeto legado.
- Chave estrangeira composta por projeto e proprietário.
- RLS com políticas próprias para leitura, criação, atualização e exclusão.
- Tipos Supabase e verificadores de isolamento atualizados.
- Nenhuma interface ou geração dos seis cards foi antecipada; isso permanece na Change 010.

## Fora do escopo desta sequência

- Redação integral da tese ou dissertação.
- Produção de resultados de pesquisa.
- Colaboração simultânea.
- Orientação acadêmica automática ou aprovação ética.
- Aprendizado autônomo com dados de um usuário para outro.
