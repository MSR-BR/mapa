# Arquivos previstos

- Duas migrations ordenadas em `supabase/migrations/`:
  1. liberação controlada da RPC;
  2. policies, funções e trigger conscientes do modo.
- `lib/supabase/database.types.ts`, se o contrato da RPC exigir ajuste.
- Verificadores RLS anônimo/autenticado e aluno–orientador.
- Testes de migration/segurança e documentação operacional.
