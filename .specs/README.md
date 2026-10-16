# Mapa da Pesquisa — sistema de especificações

Este diretório é a fonte de verdade para o planejamento e a execução do produto. Nenhuma mudança deve ser implementada antes da aprovação explícita de sua especificação.

## Estado atual

- Aplicação publicada em `https://mapadapesquisa.com.br`, versão **`v15102026.1`** (C119: recuperação da metodologia, preservação do rascunho e diagnóstico de falhas). C118 preservada. [Estado detalhado](project-state.md), [roadmap](roadmap.md) e [CPD mais recente](changes/119-methodology-recovery/cpd-2026-10-15.md).
- Fluxo v2 em produção; fluxo v1 preservado para projetos legados. Entrada pública em `/mapa`, modos Rápido/Avançado, Google OAuth para gerar/guardar e regras Aluno/Orientador mantidas.
- Contexto confirmado, rascunhos e histórico C111; Gemini principal e GPT complementar/fallback limitado C112; edição por quadro e literatura aditiva C114.
- Integrações server-side: Gemini, OpenAI, Research Starter e Supabase no projeto documentado. Auditoria C113 concluída, mas vínculo com o aviso Google não confirmado.
- Piloto Ads C110 autorizado até 19/10: €2/dia, limiar acumulado de pausa €28. Teste CPC €0,45 aplicado em 15/10, por até 72h, com retorno a €0,30 até 18/10 21:03 BRT e proteção antecipada no monitor diário. [Execução](changes/110-google-ads-controlled-pilot/cpc-test-execution-2026-10-15.md). Linha inicial: 3 impressões, zero cliques/custo/conversões; efeito do teste ainda não comprovado. Medição C108/C097, atribuição paga e avaliação de resultado continuam abertas.

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
