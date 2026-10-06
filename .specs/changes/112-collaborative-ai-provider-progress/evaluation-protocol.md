# Protocolo de avaliação — definido antes de chamadas pagas

Protocolo fixado antes da inferência; executado após autorização de US$5/mês. Resultados em evaluation-2026-10-06.md. Estado inicial: nenhuma inferência paga executada. Chave fornecida pelo responsável, salva por ele em `.env.local`, arquivo ignorado. `GET /v1/models`: HTTP 200, `gpt-6-luna` disponível. A lista não comprova capacidade de inferência/faturamento, vínculo organizacional ou qualidade.

## Candidatos e limites

Baseline já usado no Mapa: `gemini-3.6-flash`. Candidato complementar: `gpt-6-luna`, Responses API, raciocínio low, serviço Standard, sem ferramentas, `store:false`. É um candidato para tarefas delimitadas, ainda sujeito à avaliação. Nenhuma substituição automática por modelo maior.

Amostra sintética: seis casos fixos, sem dados de usuários: (1) problemática e objetivo alinhados, (2) objetivo que extrapola o recorte, (3) mudança anterior de população mantendo tópico antigo, (4) método incompatível com o objetivo, (5) evidência insuficiente e resultado empírico inventado, (6) referência/ID não autorizado. Usar os mesmos textos, IDs e fontes fornecidas para ambos.

No máximo 18 chamadas: seis gerações Gemini, seis revisões GPT e seis chamadas GPT para comparar o contrato de geração/fallback. O erro técnico é injetado localmente, sem pagar uma chamada intencionalmente inválida. Limite do ensaio: menor entre US$0,50 e o teto mensal autorizado, contabilizado no mesmo período antes de habilitar o aplicativo. Se o limite não bastar, interromper o ensaio e registrar inconclusivo; não ampliar sozinho.

## Critérios prévios

- Schema, IDs, referências e preservação do escopo: 100% obrigatórios, após no máximo um reparo dentro do limite compartilhado.
- Zero aprovação acadêmica automática, fonte inventada aceita ou sobrescrita de contexto.
- GPT deve identificar pelo menos três das quatro inconsistências acadêmicas deliberadas nos casos 2–5, com justificativa ligada ao caso; caso 1 não deve receber bloqueio/fato inventado.
- Comparar precisão de achados, falsos positivos, referências, latência, tokens e custo estimado contra Gemini. Avaliação humana qualitativa registrada caso a caso; amostra pequena não estima desempenho geral.
- Metas operacionais: cada tentativa até 35 s, total até 105 s; até duas tentativas por operação, seis no pedido completo, reserva total até US$0,50 por pedido. Sem retry interno do SDK.
- Revisão indisponível mantém geração válida e identifica a ausência; concordância não valida fontes.

Liberar primeiro fallback/progresso. Habilitar revisão cruzada somente se os critérios acima passarem. Sem resultado inventado quando uma etapa não puder ser executada.
