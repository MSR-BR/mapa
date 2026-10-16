# C120 — Validação — 16/10/2026

## Evidência anterior à correção

- Git inicial limpo, branch codex/change-003-004, HEAD dea3107 (documentação de monitoramento Ads, preservada).
- Vercel: projeto mapadapesquisa / prj_uz62Dh56BHDeHozBfrAACFFZ5mUS / team_jQuUBnU7RDJh0O3XASyu1WeS. Produção v15102026.1, deployment dpl_3a4tcL8VHNSFPomKARi4h7y2r43u.
- Logs via CLI: oito requisições de descoberta entre 13:27:09Z e 13:31:25Z com Research Starter HTTP 400 / invalid-request, após interpretação Gemini bem-sucedida. O HTTP 200 da resposta externa é o envelope de streaming; o resultado interno informa falha. Não contam usuários únicos. Nenhum texto privado foi necessário para diagnosticar.
- Incompatibilidade reproduzida pelo contrato: geração até 240 caracteres, topic v1 limitado a 180. Sem corpo original nos registros, não se afirma que cada erro histórico tenha essa causa.
- Consulta sintética pública pelo navegador autenticado: seis propostas e 20 referências, sem alterar mapas reais. Demonstra serviço funcionando para uma consulta curta.
- A chave específica existe em Produção por metadados; seu valor não foi lido, exportado ou alterado. Local sem chave própria. O script legado de produção usa senha e não autentica neste projeto Google-only; não foi habilitado login por senha para contornar isso.

## Correção e regressões

- Prompt/schema de geração limitados a 180; fronteira comum também limita por palavra para consultas legadas e otimização. O briefing e o conteúdo já salvo permanecem intactos.
- Prazo bibliográfico total de no máximo 50s; na descoberta há reserva de 35s para propostas/persistência dentro do prazo global existente. Máximo de duas tentativas no Research Starter e uma consulta Crossref, sem nova chamada de IA para fallback. Retry-After longo desvia para a alternativa em vez de repetir antecipadamente. Cancelamento bloqueia novas chamadas/resultados tardios.
- Respostas externas validadas e limitadas em bytes. Autenticação e entrada inválida são distintas de indisponibilidade. Logs só contêm códigos, quantidade, comprimento e duração; sem texto livre/chave.
- Crossref: somente metadados públicos, DOI/título, correspondência lexical mínima, deduplicação, limites e proveniência explícita; nenhuma síntese científica inventada. Falha/ausência de referências adequadas preserva a entrada e permite tentar novamente. Aviso de cobertura reduzida na descoberta e otimização; progresso compatível com leitores antigos.
- Teste real Crossref em 16/10: três referências, três DOIs, 749ms, status partial. Consulta sintética, sem IA paga. Esse resultado não garante disponibilidade futura.

## Verificações aprovadas

- 238 testes: 190 gerais, 13 DOI, 35 IA/Research Starter (12 novos C120).
- Oito cenários de rota real com limites externos sintéticos: principal/fallback, reabertura idempotente, 401, 400, ambas as fontes indisponíveis, acesso negado. Salva seis propostas e mantém as cinco respostas originais; falhas não deixam conteúdo falso ou apagam briefing.
- Tipos, lint (somente um aviso antigo em tests/foundation.test.mjs), exportações PDF/DOCX, auditoria de segurança, grants explícitos, build local Webpack e diff check.
- Auditoria das dependências de produção: zero vulnerabilidades. Nenhuma dependência adicionada.
- Interface real com resultado sintético de fallback: pedido original, seis propostas e aviso Crossref exibidos. Evidência: evidence/fallback-ui.jpg.

## Limitações e publicação

A busca alternativa tem cobertura menor e filtro lexical, não equivalência semântica garantida. Se ambas as fontes falharem ou não houver referências pertinentes, o erro recuperável continua necessário. Não há promessa de indisponibilidade zero. Sem alteração de banco, modelos, chaves, orçamento ou Ads. Publicação e smoke final serão registrados no CPD.
