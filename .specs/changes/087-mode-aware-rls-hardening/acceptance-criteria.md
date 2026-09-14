# Critérios de aceite

1. No modo Aluno, acesso direto a projeto vinculado como orientador é negado.
2. No modo Orientador, CRUD direto de projeto próprio
   `authoring_role=advisor` funciona.
3. No modo Orientador, projeto próprio criado como Aluno é negado; no modo
   Aluno, projeto próprio criado como Orientador também é negado.
4. Cada operação permitida na matriz continua funcionando no modo correto.
5. UPDATE direto do modo continua negado; somente a RPC pode trocá-lo.
6. RPC rejeita versão obsoleta e valor fora de `student|advisor`.
7. `set_project_advisor` rejeita modo errado, projeto não estudantil, não
   proprietário e auto-orientação.
8. Projeto de Orientador não aceita `advisor_id`, `advisor_email` nem envio
   à supervisão.
9. `claim_pending_advisor_projects` só opera no modo Orientador sobre projeto
   criado como Aluno.
10. O trigger permite parecer do Orientador vinculado, mas impede edição do
    conteúdo acadêmico do estudante.
11. Policies têm `USING` e `WITH CHECK` apropriados; grants são mínimos.
12. Advisors não apresentam alerta crítico novo e a migração é reconciliada.
