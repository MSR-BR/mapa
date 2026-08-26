# Evidências de encerramento — Change 054

Data: 25/08/2026 (publicação confirmada em 26/08/2026)

## Implementação

- `modules/analytics/analytics.ts` define a allowlist de eventos e parâmetros,
  sanitiza valores e bloqueia qualquer envio sem consentimento.
- `modules/analytics/analytics-consent.tsx` carrega a preferência local,
  acompanha a sessão confirmada do Supabase e evita duplicar `login_success`.
- `modules/analytics/google-analytics.tsx` carrega o script somente quando a
  escolha foi aceita e registra `consent_choice` após o `gtag` existir.
- Eventos de domínio foram conectados a autenticação, modos rápido/avançado,
  geração, propostas, etapas, orientador, literatura, integração, PDF, suporte
  e relatos de bug.
- `modules/analytics/export-pdf-link.tsx` distingue início, sucesso e falha da
  exportação sem enviar conteúdo do documento.

## Validação automatizada

- `npm run typecheck` — aprovado.
- `npm run lint` — aprovado.
- `npm run test` — 76 testes aprovados, incluindo três testes específicos de
  consentimento, allowlist e faixas de referências.
- `npm run security:audit` — aprovado; o detector de segredos foi ajustado para
  não confundir o evento `literature_optimization_started` com um prefixo de
  chave Resend. A verificação remota do Supabase continua explicitamente como
  aviso operacional, pois depende de credenciais externas.
- `git diff --check` — aprovado antes do commit/deploy.
- `npm run build` — aprovado localmente com o build de produção.

## Guardrails confirmados

- Nenhum parâmetro aceita texto livre; prompts, títulos, referências, e-mails,
  comentários, UUIDs e mensagens de erro não são enviados.
- Recusar métricas impede o carregamento do GA4 e o envio de eventos.
- Abandono é derivado por coorte no GA4, não por `beforeunload`.
- Contagens exatas e auditoria operacional permanecem no Supabase.

## Publicação e smoke de produção

- Commit: `beefbd8`.
- Tag Git: `v25082026.6`.
- Deployment Vercel: `dpl_GxUjYCf3HQL7EJj1dRmTwRJ72dk3` (`Ready`).
- Aliases confirmados: `https://mapadapesquisa.com.br/` e
  `https://mapadapesquisa.vercel.app/`.
- `GET https://mapadapesquisa.com.br/api/health` — HTTP 200, `x-health-status:
  ok`.
- Home pública — contém `Mapa Avançado`, `Mapa Rápido` e `v25082026.6`.
- Logs de erro Vercel no intervalo de uma hora — nenhum log encontrado.

## Configuração externa pendente de confirmação operacional

No painel do GA4, cadastrar as dimensões personalizadas enumeradas e criar os
três funis descritos em `docs/operations.md`. Essa configuração não pode ser
validada apenas pelo repositório; exige uma sessão de teste no DebugView com a
conta responsável pelo Measurement ID `G-MKFYYRZG87`.

## CPD

- Contexto: o GA4 anterior tinha apenas eventos genéricos e não permitia
  separar acesso anônimo/autenticado, modos, papéis, etapas ou conclusão.
- Problema: não era possível medir a jornada nem diagnosticar falhas sem risco
  de enviar conteúdo acadêmico.
- Decisão: contrato fechado, consentimento primeiro, eventos nos callbacks de
  domínio e separação entre métricas agregadas e dados operacionais.
- Estado: implementação e publicação concluídas na versão `v25082026.6`; falta
  apenas confirmar as dimensões/relatórios no painel GA4 e observar uma sessão
  de teste no DebugView.
