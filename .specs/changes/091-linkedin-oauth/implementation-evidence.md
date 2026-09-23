# Encerramento da Change 091 — 22/09/2026

## Resultado

A Change 091 foi cancelada antes da configuração externa. O formulário do
LinkedIn Developers recebeu apenas o nome provisório “Mapa da Pesquisa”, mas
não foi enviado porque nenhuma Página elegível estava associada à conta.
Nenhum aplicativo, Client ID ou Client Secret foi criado.

## Limpeza

- linkedin_oidc foi removido da allowlist da aplicação;
- botão, mensagens, estilos e telemetria LinkedIn foram removidos;
- LINKEDIN_AUTH_ENABLED saiu do contrato de ambiente;
- a flag remota desligada será eliminada da Vercel após o deploy da C92;
- o provedor LinkedIn permanece inativo no Supabase;
- Privacidade passou a descrever somente autenticação Google.

O histórico dos requisitos originais foi preservado com aviso explícito de
cancelamento. Nenhum dado de usuário ou projeto foi alterado.
