# Checklist

- [x] Preflight e ambiente isolado aprovados.
- [x] RPC liberada com grants mínimos.
- [ ] Flag ativada após smoke server-side.
- [x] Policies próprias exigem autoria igual ao modo ativo na migration e no
  banco isolado; aplicação remota pendente.
- [x] CRUD próprio de Aluno e Orientador validado no banco isolado.
- [x] Policies vinculadas exigem Orientador e projeto estudantil no banco isolado.
- [x] Funções e trigger endurecidos e validados localmente.
- [x] Auto-orientação bloqueada no banco isolado.
- [x] Projeto autônomo de Orientador não aceita supervisão no banco isolado.
- [ ] Advisors e verificadores remotos aprovados.
- [ ] Rollback/roll-forward e CPD final registrados.
