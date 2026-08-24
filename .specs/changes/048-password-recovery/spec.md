# Change 048 — Recuperação de senha e retorno seguro

Status: concluída

## Objetivo

Garantir que o link de recuperação do Supabase crie a sessão corretamente,
preserve o destino seguro e leve o usuário à tela de nova senha sem depender do
callback exclusivo do Google.

## Escopo

- Usar `/auth/confirm?type=recovery&next=/reset-password` no e-mail de recuperação.
- Validar `token_hash` e `type` com `verifyOtp` no servidor.
- Preservar somente destinos internos iniciados por `/`, rejeitando `//` e URLs
  externas.
- Manter compatibilidade com links antigos que cheguem ao callback.
- Não revelar se um e-mail está cadastrado.

## Critérios de aceite

1. O formulário continua retornando a mesma mensagem neutra para qualquer e-mail.
2. O link válido abre uma sessão de recuperação e mostra `/reset-password`.
3. Links inválidos ou expirados retornam ao login com erro genérico.
4. Nenhum token é escrito em logs ou exposto ao cliente além da própria URL do
   provedor.
5. Testes estáticos, lint, typecheck e build passam.
