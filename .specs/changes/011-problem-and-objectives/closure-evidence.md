# Evidências de encerramento — Change 011

Data: 07/08/2026.

## Jornada entregue

- A escolha do card abre a problemática preenchida sem validá-la automaticamente.
- Problemática, objetivo geral e objetivos específicos são editáveis e exibem sua origem.
- Validar a problemática gera um objetivo geral coerente; validá-lo gera quatro objetivos específicos.
- O usuário pode manter de três a seis objetivos específicos, cada um com UUID estável.
- Todas as etapas oferecem Voltar, Regenerar sugestão, Salvar rascunho e Validar e avançar.
- Regeneração pede confirmação quando substituiria uma edição humana.
- Referências reais ligadas à sugestão podem ser consultadas na própria etapa.

## Validação e persistência

- Regras determinísticas exigem uma única grande pergunta e verbos no infinitivo.
- Relação lexical com a origem e redundância entre objetivos são verificadas antes do avanço.
- Achados bloqueadores são persistidos no workflow e apresentados para correção.
- Cada alteração arquiva a versão anterior em `elementVersions`.
- Alterações validadas incrementam `sourceRevision` e invalidam apenas tipos descendentes.
- Atualizações usam comparação de `revision`; duas abas não sobrescrevem silenciosamente uma à outra.
- O estado e a etapa ativa permanecem na única linha versionada de `research_workflows`.

## Verificações

- Lint, TypeScript, 38 testes, exportações DOCX/PDF e build de produção passaram.
- O teste externo real passou com Research Starter, Gemini, 20 referências, um objetivo geral válido e quatro objetivos específicos válidos.
- A consulta remota confirmou RLS habilitado em `research_workflows`; a tabela permanece vazia e nenhum dado de teste foi deixado no banco.
- Nenhuma migração ou nova tabela foi necessária nesta mudança.
- O advisor de segurança mantém apenas o aviso preexistente de proteção contra senhas vazadas desabilitada.
- Informações de índices não usados foram preservadas: com tabelas vazias, não constituem evidência segura para remoção.
