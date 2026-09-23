# Rollout e recuperação

## Ativação

1. Manter Google ativo e LinkedIn inativo no Supabase.
2. Publicar a interface Google-only em preview.
3. Validar botão, callback, conta existente, logout e rotas antigas.
4. Promover o commit validado para produção.
5. Desativar e-mail/senha no Supabase e remover a flag LinkedIn da Vercel.
6. Repetir smoke e observar erros de Auth/callback.

## Recuperação

- Se Google falhar antes do corte remoto, não promover.
- Se houver bloqueio relevante depois do corte, reativar temporariamente o
  provedor de e-mail no Supabase e restaurar o deployment anterior.
- Não recriar, apagar ou mesclar usuários diretamente.
- Não alterar IDs, autoria, projetos, revisões ou RLS durante rollback.
