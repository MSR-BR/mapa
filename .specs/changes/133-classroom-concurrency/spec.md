# C133 — Atendimento simultâneo de turmas

Estado: IMPLEMENTED_LOCAL_PARTIAL; provider quota/full-course validation pending. Criada em 23/10/2026.

Autorização: criar C129–C134 e iniciar C129/C130; aumento de orçamento autorizado. C131–C134 receberam execução local adicional após a autorização posterior para seguir com todas as changes. Publicação segue gate próprio.

- Coordenar concorrência e repetição com espera limitada e tratamento de Retry-After.
- Não agrupar toda a turma pela mesma cota de IP; manter controles antiabuso por sessão/usuário.
- Priorizar conclusão, deduplicar ações e preservar recuperação após falha.

[Critérios](acceptance-criteria.md) · [Tarefas](tasks.md) · [Validação](validation.md).
