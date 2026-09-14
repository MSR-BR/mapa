# Critérios de aceite

1. Todas as linhas existentes preservam o mesmo `active_role`.
2. Toda linha possui `role_version >= 1` e `role_changed_at` válido.
3. Cada perfil existente recebe evento-base sem PII.
4. Novos perfis geram evento automaticamente.
5. UPDATE direto continua negado a `authenticated`.
6. A RPC não pode ser executada por `public`, `anon` ou `authenticated` ainda.
7. A nova tabela não fica exposta acidentalmente pelo Data API.
8. A aplicação publicada continua se comportando exatamente como antes.
9. Migration local/branch e advisors não apresentam regressão crítica.
