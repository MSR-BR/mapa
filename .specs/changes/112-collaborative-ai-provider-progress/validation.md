# Validação — implementação local

Em 06/10/2026, chave salva pelo responsável confirmada por `GET /v1/models` HTTP 200. Nenhuma inferência paga realizada. Organização/projeto apresentados pelo responsável na Platform; headers da listagem não retornam esses identificadores, portanto o vínculo não foi revalidado via API.

## Concluído

- Suite anterior: 169 testes + 13 DOI. Nova suite C112: 15 testes. Total 197.
- Testes executam adapters reais com HTTP sintético para Gemini/OpenAI; schemas comuns, parâmetros separados, recusa completed da Responses API, fallback 429/503/timeout, bloqueios auth/recusa/quota/teto, cancelamento tardio, tentativa/custo global, rollback, métricas ausentes e isolamento de contexto.
- Streaming real de handler: sucesso só após gravação confirmada, preservação de status lógico 403, eventos fora de ordem/de outra operação e desconexão sem falso sucesso.
- Rotas reais com fronteiras sintéticas: navegação/salvamento sem IA, propostas separadas, aceite em rascunho, histórico, autorização e concorrência com preservação de proposta antiga. Mudança de contexto durante a geração mantém a nova versão e bloqueia aceite da proposta antiga; uma proposta mais recente também não é sobrescrita. Nenhum projeto de usuário usado como fixture.
- PostgreSQL 17 isolado: 21 migrations, RLS/grants, schema privado e idempotência da migration C112. Vinte chamadas concorrentes disputaram quatro reservas; contador permaneceu exatamente no teto, quatro aceites. Ausência de config, segredo inválido, ausência de usuário e valores inválidos bloquearam.
- Quatro cenários UI Chromium/WebKit, 320/1280 px, com componentes reais e fronteiras sintéticas; histórico/navegação/propostas e Gemini→GPT via stream. Captura mobile de fallback inspecionada, sem corte horizontal. Botão de cancelar visível e retorno de foco após acionamento por teclado confirmados nos dois motores.
- Lint, TypeScript, exportações PDF/DOCX e build de produção webpack local aprovados. Rodada final em 06/10, 19h02 BRT: 197 testes, tipos, build e quatro cenários UI aprovados; lint sem erros (dois avisos apenas no bundle temporário do harness). Publicação e CPD continuam pendentes.
- Auditoria estática: PASS_WITH_ACCEPTED_RISK, sem achado bloqueante após centralizar logs. npm audit runtime: zero vulnerabilidades. Auditoria completa mantém cinco high no encadeamento de desenvolvimento ESLint/braces já documentado na C111; o gate npm completo continua não zero. Não foi aplicado upgrade forçado.

## Pendente antes de liberação

Teto mensal adicional autorizado; ensaio pago definido previamente em evaluation-protocol.md; registro de qualidade/latência/tokens/custo e ganho da revisão; confirmação final de projeto OpenAI na organização central; configuração remota de segredo/contador/flags; migration remota, deploy, smoke autenticado e CPD. Planejamento e respostas simuladas não contam como avaliação real do modelo.
