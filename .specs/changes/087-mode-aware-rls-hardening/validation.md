# Validação

- Matriz direta via clientes autenticados sintéticos para SELECT/INSERT/UPDATE/
  DELETE e RPC nos dois modos.
- Tentativas anônimas e sem perfil.
- Concorrência com `expected_version` correto e obsoleto.
- Teste de que trocar modo não altera projetos, workflows ou vínculos.
- Testes do trigger: comentário permitido; conteúdo, propriedade e revisões
  anteriores imutáveis.
- Query de grants, `pg_policies` e funções `SECURITY DEFINER` com `search_path`.
- Supabase Security/Performance Advisors.
- `npm run supabase:verify-*`, `npm run check`, security audit e smoke publicado.
