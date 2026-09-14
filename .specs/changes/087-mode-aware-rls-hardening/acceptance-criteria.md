# Critérios de aceite

1. No modo Aluno, acesso direto a projeto vinculado como orientador é negado.
2. No modo Orientador, acesso direto a projeto próprio é negado.
3. Cada operação permitida na matriz continua funcionando no modo correto.
4. UPDATE direto do modo continua negado; somente a RPC pode trocá-lo.
5. RPC rejeita versão obsoleta e valor fora de `student|advisor`.
6. `set_project_advisor` rejeita modo errado, não proprietário e auto-orientação.
7. `claim_pending_advisor_projects` só opera no modo Orientador.
8. O trigger continua impedindo edição acadêmica pelo Orientador.
9. Policies têm `USING` e `WITH CHECK` apropriados; grants são mínimos.
10. Advisors não apresentam alerta crítico novo e a migração é reconciliada.
