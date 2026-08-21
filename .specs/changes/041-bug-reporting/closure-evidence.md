# Evidências de encerramento — Change 041

Data prevista de encerramento: 21/08/2026.

## Implementação

- Formulário **Relatar problema** disponível na home e no app por meio do
  componente de links legais.
- Endpoint multipart `POST /api/bug-reports` com validação, limite por IP,
  contexto técnico e upload opcional para bucket privado.
- Endpoint administrativo `PATCH /api/bug-reports/:id` para status, prioridade
  e notas, protegido por lista de e-mails e RLS.
- Painel privado `/admin/bugs` com filtros e links assinados temporários.
- Migration `20260821153000_create_bug_reports.sql` com tabela, políticas RLS,
  função de autorização e bucket privado.

## Verificações

- `npm test` — a registrar após a validação final.
- `npm run lint` — a registrar após a validação final.
- `npm run typecheck` — a registrar após a validação final.
- `npm run build` — a registrar após a validação final.
- `npx supabase migration list` — a registrar após a aplicação remota.
- Smoke de produção e confirmação do recebimento via Resend — a registrar sem
  incluir conteúdo sensível nesta evidência.

## Decisão operacional

Se o Resend estiver indisponível, o endpoint confirma apenas o salvamento do
relato e o painel continua sendo a fonte de triagem. O usuário recebe uma
mensagem explícita para não enviar credenciais ou chaves.

