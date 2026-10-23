# Preparação de publicação C129–C134 — 23/10/2026

**Resultado do gate pré-publicação: BLOCKED para publicação agora.** O código local foi validado, mas ainda faltam migration aplicada no projeto Supabase de destino, autorização do commit exato e verificação pós-publicação. Este registro não autoriza deploy.

## Escopo e destino

- Base local: branch `codex/change-003-004`, HEAD `3b366af` no início da execução. O pacote candidato inclui a migration aditiva `20261023165336_c129_ai_budget_settlement.sql`, ledger/RPC de reserva e liquidação, botão opcional de IA, controle de sugestões por conta autenticada, mensagens de erro e telemetria sanitizada. C131 acrescenta apenas avaliador de rotas; os modelos existentes continuam. O SHA do commit candidato deve ser lido diretamente do Git após o fechamento.
- Destino pretendido, ainda não acionado: banco Supabase do Mapa `aeaweherkrqmlqnxsmib`, seguido pelo projeto Vercel de produção `mapadapesquisa`. A aplicação pública permanece `v22102026.1`.
- C130 já elevou somente o teto interno a US$100/mês com leitura independente. Não repetir essa mudança nem zerar consumo.

## Evidência local

`npm test` passou (280 testes nas quatro suítes Node, mais harnesses); `test:research-starter`, `test:limits`, `test:suggestions`, `typecheck`, `lint` e build Next/Webpack passaram. `verify-ai-settlement-local` e `verify-explicit-grants-local` passaram em PostgreSQL descartável. `security:audit` retornou `PASS_WITH_ACCEPTED_RISK` sem nova falha; `git diff --check` passou. Toda geração usada nas simulações é falsa: zero chamadas pagas.

Os testes cobrem 50 reservas concorrentes, liquidação idempotente e 50 pedidos simultâneos para o mesmo mapa com apenas uma geração/gravação. **Não são 50 alunos concluindo mapas.** Cotas RPM/TPM/RPD, custo de uma jornada completa e qualidade comparativa entre Gemini/GPT não foram comprovados. Logs Vercel pelo conector retornaram HTTP403; relatórios C131/C134 são sintéticos.

## Ordem e reversão

1. Congelar e rever o diff num commit candidato; confirmar o destino e o backup/estado de definições do banco sem ler segredos.
2. Conferir drift e aplicar a migration aditiva antes do frontend; reler funções, grants e tabela privada. A RPC legada permanece para a versão atual.
3. Publicar **aquele commit exato** na Vercel e testar autenticação, sugestão local sem custo, clique opcional de IA com autorização específica para teste pago se necessário, reserva/liquidação e preservação de rascunho. Evitar gerar IA paga apenas para monitorar.
4. Se o novo app falhar, reverter apenas o app para o deployment anterior; manter a migration e o ledger, que são aditivos e compatíveis com a RPC antiga. Não apagar reservas, não devolver gasto histórico e não baixar automaticamente o teto mensal.

O gate [secure-release-gate](/Users/marioreis/.agents/skills/secure-release-gate/SKILL.md) exige autorização explícita para a **revisão exata e o destino** antes da publicação em produção. C129 depende do backend novo; publicar o app antes da migration pode bloquear a geração. Nenhuma migration remota ou deploy foi executado neste pacote.
