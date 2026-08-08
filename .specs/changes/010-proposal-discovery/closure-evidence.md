# Evidências de implementação — Change 010

Data: 07/08/2026.

## Entrega

- O prompt integral é preservado, mas não é mais usado como título do projeto.
- Uma interpretação estruturada produz título curto, área, palavras-chave e consulta bibliográfica.
- O Research Starter é consultado com janela de 5 anos, ampliação para 10 anos e uma última consulta controlada quando necessário.
- Uma única geração da IA forma exatamente seis candidatos: um fiel ao pedido e cinco alternativas distintas.
- Cada candidato contém título, grande pergunta, contexto, área, palavras-chave e IDs de referências reais.
- Os seis candidatos pertencem a um único workflow e sobrevivem a recarregamento; não são criados seis projetos.
- A escolha do card registra a problemática aprovada e avança para `validating_general_objective`, início da Change 011.

## Otimização do Supabase

- O polling da geração legada passou a buscar somente o último job, sem retransmitir estrutura e referências a cada 1,5 segundo.
- Consultas tocadas pela mudança usam listas explícitas de colunas, evitando `select(*)` e transferência desnecessária.
- A descoberta inteira é persistida em uma única linha JSON versionada de `research_workflows`.
- A escolha usa atualização otimista por revisão e todas as operações permanecem limitadas por `owner_id` e RLS.
- Índices existentes foram preservados porque cobrem chaves estrangeiras e consultas conhecidas; métricas de “índice não usado” não são representativas em tabelas vazias.

## Verificações

- Lint, TypeScript, 34 testes, exportações DOCX/PDF e build de produção passaram.
- Schemas rejeitam quantidade, ordem, duplicidade e formato de problemática inválidos.
- A causa do `401 unauthorized` foi identificada: a chave anterior tinha 11 caracteres, abaixo do mínimo de 12 exigido pelo Research Starter.
- A credencial foi rotacionada por uma chave forte nos ambientes Production e Preview do Mapa e em Production do Research Starter.
- Research Starter e Mapa foram republicados com sucesso no domínio canônico.
- O teste integrado real passou com Gemini, Research Starter, seis candidatos na ordem correta e 20 referências verificáveis.
- A verificação independente do contrato retornou 3 referências e confiança `medium`; nenhum dado simulado foi tratado como sucesso.
