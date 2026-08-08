# Mapa da Pesquisa — sistema de especificações

Este diretório é a fonte de verdade para o planejamento e a execução do produto. Nenhuma mudança deve ser implementada antes da aprovação explícita de sua especificação.

## Estado atual

- Fase: MVP v1 concluído; fluxo v2 implementado localmente até transição/exportação.
- Código da aplicação: o fluxo v1 permanece disponível para projetos legados; novos prompts iniciam o fluxo v2.
- Próximo gate: CPD, preview e smoke de produção da Change 015.
- Direção do v2: prompt geral, seis propostas assistidas por IA e Research Starter, validação progressiva, matriz metodológica, mapa final rastreável e transição segura para produção.
- Integrações confirmadas: Gemini no backend, Research Starter v1 e Supabase do Mapa limitado ao Project Ref documentado.

## Ordem de leitura

1. `shared/project-rules.md`
2. `shared/architecture.md`
3. `shared/coding-standards.md`
4. `shared/citation-rules.md`
5. `shared/anti-hallucination-policy.md`
6. `shared/output-format.md`
7. `roadmap.md`
8. A pasta da mudança em execução

## Ciclo de uma mudança

1. Revisar objetivo, requisitos e premissas.
2. Obter aprovação explícita.
3. Implementar somente o escopo aprovado.
4. Executar os testes especificados.
5. Atualizar checklist e registrar decisões relevantes.
6. Encerrar a mudança antes de iniciar a seguinte.
