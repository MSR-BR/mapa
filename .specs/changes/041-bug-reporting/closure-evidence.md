# Evidências de encerramento — Change 041

Data de encerramento: 21/08/2026.

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

- `npm test` — 63 testes aprovados.
- `npm run lint` — aprovado, sem erros ou avisos.
- `npm run typecheck` — aprovado.
- `npm run build` — aprovado localmente e no build de produção da Vercel.
- `npx supabase migration list` — migration `20260821153000` aplicada no remoto.
- `npx supabase db push` — concluído sem alterar migrations anteriores.
- Deploy Vercel `dpl_4PNAfR5vVay4WDKpxqQ8UJ2AWmKy` — READY e aliasado a
  `https://mapadapesquisa.com.br`.
- Smoke HTTP: home, `/api/health` e `/robots.txt` respondem no domínio
  canônico; o build expõe `/api/bug-reports` e `/admin/bugs`.
- A verificação local que requer Docker não foi executada porque o daemon
  Docker não estava acessível neste ambiente; a migration foi aplicada e
  validada no banco remoto pela CLI autenticada.

## Decisão operacional

Se o Resend estiver indisponível, o endpoint confirma apenas o salvamento do
relato e o painel continua sendo a fonte de triagem. O usuário recebe uma
mensagem explícita para não enviar credenciais ou chaves.
