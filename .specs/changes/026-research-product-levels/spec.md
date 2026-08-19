# Change 026 — Tipo de produto e níveis de aprofundamento

## Objetivo

Registrar o produto acadêmico pretendido na entrada do mapa e usar uma matriz auxiliar para ajustar o aprofundamento da geração em cada etapa.

## Produtos suportados

- TCC / Graduação.
- Monografia / Especialização.
- Dissertação / Mestrado.
- Tese / Doutorado.
- Artigo de evento acadêmico.
- Artigo de periódico de alto impacto.

## Escopo

- Seleção obrigatória de um produto na tela inicial, com cartões responsivos e guia acessível por `i`.
- Persistência da seleção no briefing inicial do workflow.
- Mapeamento de compatibilidade para o nível acadêmico legado do projeto.
- Arquivo auxiliar `research-level-guidance.ts` com finalidade, público, problema, lacuna, originalidade, revisão, metodologia, dados, análise, discussão e contribuição para cada produto.
- Inclusão da orientação no contexto da descoberta, dos seis cards e das gerações de problemática, objetivo geral, objetivos específicos, capítulos e metodologia.
- Projetos antigos continuam válidos com tipo nulo e sem alteração retroativa.

## Critérios de aceitação

1. Não é possível iniciar um novo mapa estruturado sem selecionar um produto.
2. A seleção continua disponível após o login e fica em `initialBriefing.researchType`.
3. O tipo aparece no contexto da interpretação e a orientação é incluída nos prompts das etapas subsequentes.
4. A matriz auxiliar é legível no popup, sem transformar a tela principal em uma tabela extensa.
5. Os tipos de artigo não são forçados a um nível de graduação, mestrado ou doutorado no banco.
6. O fallback de projetos legados e rascunhos antigos continua funcionando.

## Fora do escopo

Reescrita de mapas já concluídos e alteração de colunas do banco; o tipo é persistido no JSON versionado do workflow para manter a mudança aditiva.
