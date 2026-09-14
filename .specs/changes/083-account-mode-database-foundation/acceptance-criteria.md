# Critérios de aceite

1. Todas as linhas existentes preservam o mesmo `active_role`.
2. Todo projeto existente recebe exatamente um `authoring_role` coerente com o
   perfil imutável atual de seu proprietário, sem perda ou alteração de conteúdo.
3. Todo novo projeto recebe autoria derivada no banco; payload adulterado não a
   escolhe e UPDATE posterior é negado.
4. Projeto de Orientador permanece autônomo e não recebe vínculo de supervisão.
5. Toda linha de perfil possui `role_version >= 1` e `role_changed_at` válido.
6. Cada perfil existente recebe evento-base sem PII.
7. Novos perfis geram evento automaticamente.
8. UPDATE direto continua negado a `authenticated`.
9. A RPC não pode ser executada por `public`, `anon` ou `authenticated` ainda.
10. A nova tabela não fica exposta acidentalmente pelo Data API.
11. A aplicação publicada continua se comportando exatamente como antes.
12. Migration local/branch e advisors não apresentam regressão crítica.
