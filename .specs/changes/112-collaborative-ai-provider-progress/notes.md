# Decisões de implementação — 06/10/2026

## Autorização e estado

O responsável autorizou a próxima Change depois da C111 e criou/salvou uma chave OpenAI exclusiva para o Mapa. Reutilização local autorizada; não imprimir chave nem criar outra. Depois, autorizou “usd 5”: teto adicional de US$5/mês, testes incluídos. Avaliação real concluída, limite aplicado no Supabase, segredos exclusivos configurados na Vercel e v06102026.4 publicada. Evidências no CPD.

## Contrato e políticas

Os 13 pontos de geração existentes usam `generateStructured`, com os schemas anteriores, adaptadores distintos e validações de domínio preservadas. Gemini continua inicial; GPT é alternativo somente em timeout, 429 transitório, rede indisponível/5xx ou saída inválida. Máximo duas chamadas por operação, seis por pedido, 105 s globais e 35 s por tentativa. Autocomplete público permanece Gemini, sem fallback pago para GPT. SDK retries=0. Credencial/configuração, recusa, quota financeira, cancelamento e orçamento não acionam alternativa.

Cada pedido usa AsyncLocalStorage isolado, sinal de cancelamento e contador de tentativas/reserva. O limite por pedido considera geração e revisão. Nenhum modelo pode ser selecionado fora do catálogo de preços explicitamente permitido. Referências/IDs inválidos não chegam à persistência como resultado válido.

Metodologia e regeneração de unidade desatualizada têm revisão pelo outro provedor quando a flag estiver habilitada. Revisão recebe contexto vigente, versão-base, proposta explicitamente não aceita e até 20 evidências pertinentes, priorizando as usadas pela unidade. A validação aceita somente os IDs e referências realmente enviados ao revisor. Retorna até oito achados locais. Resultado fica na proposta/rascunho, sem aprovação humana automática. Edição posterior remove o atestado anterior; aceite da proposta preserva a revisão orientativa. Mapa final registra quais IAs realmente revisaram e indisponibilidade complementar.

CAS protege a persistência. Se uma geração atrasar, uma única segunda tentativa de gravação pode anexar a proposta antiga ao workflow mais recente, preservando conteúdo/drafts e somente se não surgiu uma proposta mais recente nem envio pendente. Proposta de contexto antigo fica bloqueada para aceite. Se houver nova disputa, retorna conflito sem sobrescrever.

## Progresso e privacidade

NDJSON no mesmo POST: eventos ordenados com ID de operação, fase, provedor e estado, seguidos do resultado JSON. Clientes antigos continuam recebendo JSON. Não há Realtime, polling contínuo, percentual ou etapa por temporizador. Research Starter/salvamento/verificação têm rótulos próprios; conclusão segue resposta do handler depois da gravação. Desconexão informa conferir a versão salva. A interface pode cancelar e ignora eventos de outra operação.

Observador central `ai-usage-v2` mantém nomes Gemini de eventos C101, amplia provider/model/role/attempt/tokens/custo e usa null para métrica desconhecida. Não registra prompt, resposta acadêmica, PII ou chave. OpenAI usa `store:false`; isso não promete ausência de retenção pelo provedor. Aviso de privacidade identifica GPT/OpenAI.

## Consumo e Supabase

Migration `20261006214054_c112_ai_budget.sql`: duas tabelas privadas com RLS, sem grants de leitura/escrita; uma linha de configuração e um contador mensal. Não guarda textos nem um registro por token/evento. RPC pública invoker chama função privada definer com search_path vazio, exigindo sessão autenticada e segredo independente do servidor. Configuração ausente/teto zero bloqueiam. UPDATE condicional serializa reservas concorrentes.

Reserva conservadora em microunidades de USD antes de cada chamada adicional (GPT ou revisão Gemini). Estima entrada pelo limite superior de bytes UTF-8 do prompt/schema + margem de framing, e saída pelo máximo de tokens. Não reembolsa reserva de timeout/erro, pois pode ter havido cobrança. Portanto o bloqueio pode ocorrer antes do gasto faturado atingir o teto. Chamadas externas ao Mapa não passam por este controle. Mês civil em America/Sao_Paulo. O teto adicional não muda o plano, crédito ou orçamento existente de Gemini/Ads.

Tarifas verificadas em 06/10/2026: GPT-6 Luna Standard US$0,10/1M entrada, US$0,50/1M saída; reserva usa US$0,125 de entrada por eventual escrita em cache. Gemini 3.6 Flash US$0,75/1M entrada e US$3,75/1M saída até 31/12; aumento já publicado para US$1,50/US$7,50 em 01/01/2027 altera a reserva, nunca o teto ou modelo. Estimativa não é fatura. Revalidar catálogo quando houver mudanças de fornecedor.

Fontes: [OpenAI GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [OpenAI preços](https://developers.openai.com/api/docs/pricing), [Gemini preços](https://ai.google.dev/gemini-api/docs/pricing), [Supabase funções](https://supabase.com/docs/guides/database/functions).

## Rollout e rollback

Flags server-side padrão false: MAPA_OPENAI_ENABLED e MAPA_AI_CROSS_REVIEW_ENABLED. Configuração de teto no banco é passo obrigatório antes de true, além da chave e MAPA_AI_BUDGET_SECRET. O segredo não deve estar em migration, Git, UI ou logs. Não usar service_role.

Para rollback, desligar revisão e OpenAI; Gemini, versões, propostas, navegação e salvamento continuam. Não remover tabelas, histórico C111 nem voltar a um build anterior incompatível com C111. Publicar apenas após ensaio previsto, configuração segura e gates de CPD. Rollout executado em dois estágios em 06/10; ambas as flags true no deployment final. Teto de US$5/mês e revisão acadêmica humana preservados.
