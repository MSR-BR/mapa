# Mapa da Pesquisa — sistema de especificações

Este diretório é a fonte de verdade para o planejamento e a execução do produto. Nenhuma mudança deve ser implementada antes da aprovação explícita de sua especificação.

## Estado atual

- Aplicação publicada em `https://mapadapesquisa.com.br`, versão **`v08102026.2`** (C115). [Estado detalhado](project-state.md), [roadmap](roadmap.md) e [CPD mais recente](changes/115-mapa-entry-visual-hierarchy/cpd-2026-10-08.md).
- Fluxo v2 em produção; fluxo v1 preservado para projetos legados. Entrada pública em `/mapa`, modos Rápido/Avançado, Google OAuth para gerar/guardar e regras Aluno/Orientador mantidas.
- Contexto confirmado, rascunhos e histórico C111; Gemini principal e GPT complementar/fallback limitado C112; edição por quadro e literatura aditiva C114.
- Integrações server-side: Gemini, OpenAI, Research Starter e Supabase no projeto documentado. Auditoria C113 concluída, mas vínculo com o aviso Google não confirmado.
- Piloto Ads C110 e medição C108/C097 continuam em acompanhamento com suas limitações; este fechamento não os declara concluídos.

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
