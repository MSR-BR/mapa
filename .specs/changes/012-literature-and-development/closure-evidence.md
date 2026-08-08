# Evidências de encerramento — Change 012

Data: 07/08/2026.

## Jornada entregue

- A validação dos objetivos específicos inicia automaticamente a Etapa 4, com quatro tópicos sugeridos para o Capítulo 2.
- O usuário pode reordenar, renomear, adicionar ou remover tópicos entre os limites de três e seis.
- Cada tópico exibe e edita os objetivos específicos relacionados, o grau de cobertura no Capítulo 2 e as referências verificadas que o sustentam.
- O painel informa, em tempo real, se cada objetivo está não atendido, parcialmente atendido, atendido no Capítulo 2, no Capítulo 4 ou em ambos.
- A validação do Capítulo 2 gera a Etapa 5; o último tópico do Capítulo 4 exige alinhamento ao objetivo geral ou justificativa metodológica.
- “Otimizar literatura” consulta novamente o Research Starter e só substitui tópicos e fontes após sucesso; uma falha preserva a versão anterior.

## Conhecimento, rastreabilidade e persistência

- A biblioteca controlada inicial é versionada e oferece ESG, ODS e economia circular apenas quando as palavras-chave justificam a sugestão.
- Conceitos sugeridos só influenciam uma nova geração depois da aceitação explícita do usuário.
- Referências usadas pela IA são validadas contra IDs retornados pelo Research Starter; referências anteriores permanecem em arquivo quando ocorre otimização.
- Tópicos mantêm UUID, versões arquivadas, origem, ordem, cobertura e ligações rastreáveis com os objetivos.
- Salvamentos usam comparação otimista de `revision`, impedindo sobrescrita silenciosa entre abas.
- Não houve nova tabela ou migração: os dados adicionais permanecem no documento versionado de `research_workflows`, reduzindo consultas e custo operacional.

## Verificações

- Lint, TypeScript, 42 testes, exportações DOCX/PDF e build de produção passaram.
- O teste externo real passou com Research Starter e Gemini: 20 referências verificáveis, quatro tópicos de literatura e quatro tópicos de desenvolvimento, com cobertura integral dos quatro objetivos.
- A consulta remota confirmou RLS habilitado em `research_workflows`; a tabela continua vazia e nenhum dado de teste foi deixado no banco.
- O advisor de segurança mantém somente o aviso preexistente de proteção contra senhas vazadas desabilitada.
- Os avisos informativos de índices não usados foram preservados: com o banco vazio, não há evidência suficiente para removê-los com segurança.
