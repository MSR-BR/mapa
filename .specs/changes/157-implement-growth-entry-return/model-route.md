# Rota de modelo

TASK_CLASS: implementação de interface e lógica de estado do app
PLANNED_MODEL: gpt-6.1-sol
PLANNED_REASONING: medium
RATIONALE: mudança pequena de UI com elegibilidade sensível a estado e papel.
ALLOWED_FALLBACK: gpt-6-astra/high se a matriz de permissão ou histórico de fluxo exigir redesenho.
ESCALATION_TRIGGERS: divergência entre estado persistido e etapa aberta; promessa pública falsa; falha de build/segurança; publicação sem revisão.
ACTUAL_MODEL: Codex baseado em GPT-6; variante não exposta pelo runtime
ACTUAL_REASONING: not exposed
FALLBACK_OBSERVED: not measured
TOKENS: not measured
LATENCY: not measured
COST: not measured
EVIDENCE_SOURCE: metadados desta sessão e ferramentas locais; Pó Mágico local v20261020.002.
