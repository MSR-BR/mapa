# Evidências de encerramento — Change 095

**Status:** concluída em 23/09/2026.

## Alteração executada

- Conta titular correta confirmada antes da edição; nenhum outro domínio foi
  alterado.
- Zona avançada lida antes da gravação: A, MX raiz, DKIM, MX/TXT de `send`
  presentes e DMARC ausente.
- Registro adicionado no Registro.br:
  - host: `_dmarc`;
  - tipo: `TXT`;
  - valor: `v=DMARC1; p=none; rua=mailto:suporte@mapadapesquisa.com.br`;
  - TTL efetivo: 3600 segundos.
- Resposta da gravação: HTTP 200 com a zona completa e todos os cinco registros
  anteriores preservados.

## DNS e produção

- `d.sec.dns.br` e `e.sec.dns.br` retornaram o novo TXT.
- Resolvedor local e Cloudflare `1.1.1.1` retornaram o mesmo valor.
- MX raiz permaneceu em `inbound-smtp.sa-east-1.amazonaws.com`.
- DKIM `resend._domainkey`, SPF de `send`, MX de `send` e DNSSEC
  permaneceram publicados.
- O domínio canônico retornou HTTP 200.
- `/api/health` retornou `status=ok` com Supabase, Gemini, Research Starter
  e Resend configurados, versão `v22092026.3`.
- Um envio técnico pelo caminho real `/api/support` retornou HTTP 200.
- O webhook `/api/inbound/resend` permaneceu publicado e recusou requisição
  sem assinatura com HTTP 401; o recebimento real já homologado na C34 mantém
  o mesmo MX e não foi reconfigurado.

## CPD

- `npm run check`: lint, tipos, 128/128 testes, exportações PDF/DOCX e build
  Next.js 16.3.5 aprovados.
- `npm run security:audit`: aprovado; nenhum segredo versionado e 8 tabelas
  públicas com RLS.
- 18 migrations locais/remotas alinhadas no projeto Supabase correto.
- Função de progressão existe como `SECURITY DEFINER`; trigger
  `enforce_student_advisor_workflow_progress_trigger` está ativo em
  `research_workflows` (`tgenabled=O`).
- PostgreSQL 17 isolado aprovou troca Aluno↔Orientador, idempotência, conflito,
  autoria preservada, bloqueio de avanço do Aluno e autonomia do Orientador.
- Advisors mantêm somente avisos já aceitos: três RPCs autenticadas
  `SECURITY DEFINER`, proteção de senha vazada irrelevante para Google-only e
  políticas permissivas separadas para acesso próprio/vinculado.
- O antigo runner remoto por senha não autentica após a C92 porque Email foi
  deliberadamente desativado. A cobertura desta Change usa os 128 testes, as
  provas PostgreSQL, consultas remotas e a homologação Google real da C92; não
  houve reativação de senha.
- `git diff --check` aprovado.
- Pó Mágico evoluído para `v20260923.001`, com APP blueprint `v2.7`.

## Rollback

Se necessário, remover somente o TXT `_dmarc` criado nesta Change. Não
alterar A, MX, DKIM, SPF, DNSSEC ou nameservers.

## Próxima observação

Manter `p=none` e observar relatórios agregados antes de abrir Change própria
para `quarantine` ou `reject`.
