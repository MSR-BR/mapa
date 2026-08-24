# Change 049 — Auditoria final e encerramento operacional

Status: concluída

## Objetivo

Revalidar o conjunto de Changes 044–049 em código, banco, integrações, domínio,
segurança, exportação e produção, deixando evidências reproduzíveis e nenhuma
pendência técnica aberta.

## Escopo

- Revisar identificação de projetos e separação do dashboard.
- Revisar home, modo rápido, modo avançado, login e domínio canônico.
- Revisar PDF por produto acadêmico, referências, link do app e registro CBL.
- Revisar recuperação de senha e callbacks OAuth.
- Executar lint, typecheck, testes, exportação, build e auditoria de segurança.
- Verificar migrations e RLS no Supabase com os comandos disponíveis.
- Verificar `/api/health`, headers, redirects, sitemap, robots e asset CBL em
  produção.
- Registrar a versão pública e o CPD no runbook.

## Critérios de aceite

1. Todas as verificações locais passam sem falhas.
2. A produção responde `ok` no health check com a versão atual.
3. O domínio canônico e o host Vercel legado têm comportamento esperado.
4. Não há segredo rastreado, rota de projeto sem autenticação ou exposição de
   dados entre usuários.
5. Evidências da auditoria ficam registradas e o roadmap não contém Changes
   047–049 abertas.
