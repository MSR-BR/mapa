# Notas e decisões de planejamento

- GA4 só carrega após consentimento; project_start não é projeto único entre sessões.
- Relatório 001 é base histórica, não substitui consulta atual.
- O agregado de projetos deve ser solicitado ao desenvolvimento; esta Change não consulta conteúdo do app.

Fonte-base: `docs/divulgacao/relatorio-001-2026-10-27.md` e consulta adicional de 27/10/2026. Reconsultar antes de chamar números de atuais.

## Decisão de execução — 27/10/2026

- Baseline e contrato publicados localmente em `docs/divulgacao/c152-baseline-ativacao.md` e `docs/divulgacao/c152-contrato-metricas.md`.
- A taxa de sequência GA4 45/225 é proxy de ativação medido, não taxa de projetos únicos. O agregado por projeto e sua exclusão de testes são dependência do projeto de desenvolvimento, sem consulta a dados privados nesta Change.
- Próxima Change C153 pode usar a baseline como ponto de partida, mas deve reconsultar as fontes quando apresentar números correntes.
