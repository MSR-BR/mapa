# Change 045 — Observabilidade e manutenção pós-piloto

## Objetivo

Dar ao Mapa um diagnóstico operacional mínimo, seguro e útil para produção,
sem criar nova tabela, aumentar o uso do Supabase ou registrar prompts,
documentos, e-mails, tokens ou respostas completas de provedores.

## Escopo

### 045.1 — Correlação de requisições

- Aceitar `x-request-id` somente quando o valor tiver formato seguro e limite de
  tamanho.
- Gerar um UUID quando o cliente não fornecer um identificador válido.
- Devolver `x-request-id` nas respostas atravessadas pelo proxy, incluindo
  redirecionamentos e rejeições de origem.

### 045.2 — Logs operacionais estruturados

- Padronizar eventos JSON com evento, instante e correlation ID.
- Registrar apenas códigos, status, duração, tentativa e identificadores
  técnicos não sensíveis.
- Remover mensagens internas potencialmente verbosas do log de falhas de
  geração.

### 045.3 — Health check

- Estender `GET /api/health` com versão pública e estado de configuração dos
  adaptadores Supabase, Gemini, Research Starter e Resend.
- Retornar `200` para `ok` ou `degraded`; retornar `503` somente quando a
  configuração crítica do Supabase estiver ausente.
- Impedir cache compartilhado e expor somente o estado `configured` ou
  `not_configured`, nunca valores de ambiente.

### 045.4 — Runbook e verificação

- Documentar interpretação dos estados, uso do `x-request-id`, limites e
  procedimento de diagnóstico/rollback.
- Adicionar testes estáticos e executar lint, typecheck, testes, build e smoke
  do health check.

## Fora do escopo

- Nova tabela, Realtime, Storage adicional, Edge Function, drain pago ou
  monitoramento externo que gere custo.
- Registro do conteúdo da pesquisa, prompts, anexos, e-mails ou respostas
  integrais de Gemini/Research Starter.

## Critérios de aceite

- Cada resposta pública passa pelo proxy com `x-request-id` seguro.
- `/api/health` retorna versão, checks sanitizados, `X-Health-Status` e
  `Cache-Control: no-store`.
- Falhas de geração mantêm a mensagem para o usuário, mas o log contém apenas
  código, job, projeto e correlation ID.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e o smoke
  público passam.
- A versão é atualizada conforme o padrão do projeto e o CPD registra as
  evidências do deploy.

## Estado

Concluída em 23/08/2026.
