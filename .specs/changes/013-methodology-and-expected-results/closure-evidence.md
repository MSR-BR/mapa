# Evidências de encerramento — Change 013

Data: 08/08/2026.

## Jornada entregue

- Depois da validação do Capítulo 4, o projeto entra automaticamente na Etapa 6, com matriz metodológica editável.
- A IA sugere uma linha para cada objetivo específico validado, contendo levantamento, análise/tratamento, resultado esperado e tópicos associados dos capítulos 2 e 4.
- A tela mostra o título final sugerido, classificação metodológica editável e a matriz responsiva por objetivo específico.
- O usuário pode salvar rascunho, regenerar sugestão, voltar ao Capítulo 4 ou validar e avançar.

## Coerência e persistência

- A classificação metodológica registra natureza, objetivos, abordagem, procedimentos, instrumentos, técnicas e avisos éticos/de acesso.
- Resultados esperados são validados para evitar linguagem de achado já observado ou pesquisa já executada.
- Combinações metodológicas incertas viram avisos de coerência, sem bloquear quando a decisão pode ser justificada pelo usuário.
- O título final deriva do objetivo geral e, ao validar, atualiza o título do projeto.
- Os dados permanecem no documento versionado `research_workflows`; não houve nova tabela ou migração.
- Salvamentos usam comparação otimista de `revision`, preservando proteção contra sobrescrita entre abas.

## Verificações

- TypeScript passou.
- Lint passou sem erros ou avisos.
- A suíte de testes passou com 44 testes.
- A validação cobre matriz completa, objetivos ausentes/duplicados, resultado esperado como achado fabricado e avisos de compatibilidade metodológica.
