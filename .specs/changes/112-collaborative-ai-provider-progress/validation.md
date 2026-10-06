# Validação — implementação local

Em 06/10/2026, chave salva pelo responsável confirmada por `GET /v1/models` HTTP 200. Após a autorização de US$5/mês, 18 chamadas de avaliação foram realizadas e documentadas. GET /v1/models com header explícito da organização retornou 200. O projeto foi identificado na captura do responsável; o painel Platform não autenticou nesta sessão.

## Concluído

- Suite anterior: 169 testes + 13 DOI. Nova suite C112: 15 testes. Total 197.
- Testes executam adapters reais com HTTP sintético para Gemini/OpenAI; schemas comuns, parâmetros separados, recusa completed da Responses API, fallback 429/503/timeout, bloqueios auth/recusa/quota/teto, cancelamento tardio, tentativa/custo global, rollback, métricas ausentes e isolamento de contexto.
- Streaming real de handler: sucesso só após gravação confirmada, preservação de status lógico 403, eventos fora de ordem/de outra operação e desconexão sem falso sucesso.
- Rotas reais com fronteiras sintéticas: navegação/salvamento sem IA, propostas separadas, aceite em rascunho, histórico, autorização e concorrência com preservação de proposta antiga. Mudança de contexto durante a geração mantém a nova versão e bloqueia aceite da proposta antiga; uma proposta mais recente também não é sobrescrita. Nenhum projeto de usuário usado como fixture.
- PostgreSQL 17 isolado: 21 migrations, RLS/grants, schema privado e idempotência da migration C112. Vinte chamadas concorrentes disputaram quatro reservas; contador permaneceu exatamente no teto, quatro aceites. Ausência de config, segredo inválido, ausência de usuário e valores inválidos bloquearam.
- Quatro cenários UI Chromium/WebKit, 320/1280 px, com componentes reais e fronteiras sintéticas; histórico/navegação/propostas e Gemini→GPT via stream. Captura mobile de fallback inspecionada, sem corte horizontal. Botão de cancelar visível e retorno de foco após acionamento por teclado confirmados nos dois motores.
- Lint, TypeScript, exportações PDF/DOCX e build de produção webpack local aprovados. Rodada final em 06/10, 19h02 BRT: 197 testes, tipos, build e quatro cenários UI aprovados; lint sem erros (dois avisos apenas no bundle temporário do harness). Publicação e CPD foram concluídos na sequência.
- Auditoria estática: PASS_WITH_ACCEPTED_RISK, sem achado bloqueante após centralizar logs. npm audit runtime: zero vulnerabilidades. Auditoria completa mantém cinco high no encadeamento de desenvolvimento ESLint/braces já documentado na C111; o gate npm completo continua não zero. Não foi aplicado upgrade forçado.

## Produção

Migration 21 aplicada e verificada; teto de US$5, RLS/grants e negativa acima do saldo comprovados. Ensaio real: 17/18 concluídos (12/12 GPT, 5/6 Gemini), quatro inconsistências detectadas pelo revisor. No domínio canônico, o Gemini gerou e o GPT revisou na mesma operação; proposta salva separadamente, fonte de contexto 5 preservada e igualdade integral dos elementos acadêmicos confirmada no banco. Reserva final dos testes US$0,060452; segredos conferidos por hash, nunca exibidos. Fixture arquivada reversivelmente. Health v06102026.4 ok, anônimo 401, cross-site 403, zero erros no deployment final. Ver CPD para os incidentes restritos ao preparo/fixture e os limites da evidência.
