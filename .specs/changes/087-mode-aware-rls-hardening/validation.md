# Validação

- Matriz direta via clientes autenticados sintéticos para SELECT/INSERT/UPDATE/
  DELETE e RPC nos dois modos.
- Matriz cruzada de proprietário nos quatro pares
  modo×`authoring_role`, incluindo recursos filhos.
- Tentativas anônimas e sem perfil.
- Concorrência com `expected_version` correto e obsoleto.
- Teste de que trocar modo não altera autoria, projetos, workflows ou vínculos.
- Teste de ciclo completo de projeto autônomo de Orientador e negação de
  qualquer vínculo de supervisão.
- Testes do trigger: comentário permitido; conteúdo, propriedade e revisões
  anteriores imutáveis.
- Query de grants, `pg_policies` e funções `SECURITY DEFINER` com `search_path`.
- Supabase Security/Performance Advisors.
- `npm run supabase:verify-*`, `npm run check`, security audit e smoke publicado.
