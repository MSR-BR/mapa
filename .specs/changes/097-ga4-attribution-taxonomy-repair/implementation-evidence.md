# Evidências de implementação — Change 097

Data da implantação: 24/09/2026
Janela de observação: 24/09/2026 a 08/10/2026

## Código e produção

- Commit funcional: `bdb7608 fix(analytics): repair GA4 attribution taxonomy`.
- Branch publicada: `codex/change-003-004`.
- Deployment Vercel: `dpl_9Cbsri68KvXY6t4ppoPsn2WtqNz4`, estado READY.
- Artefato: `https://mapadapesquisa-e03nyl0bc-msr-brs-projects.vercel.app`.
- Domínio canônico validado: `https://mapadapesquisa.com.br`.
- `/api/health` respondeu `status=ok`, com todos os provedores configurados.
- Gate local aprovado: lint, typecheck, 129 testes, verificação das exportações
  e build de produção.

## Contrato de mensuração

- Os nomes dos eventos existentes foram preservados para continuidade
  histórica.
- Todo contexto de produto passou a usar somente parâmetros prefixados:
  `app_auth_state`, `app_role`, `app_surface`, `app_entry_mode`,
  `app_product_type`, `app_stage`, `app_result`, `app_reason_code`,
  `app_reference_count_bucket`, `app_has_advisor`, `app_macro_stage` e
  `app_step`.
- A emissão do parâmetro reservado `source` e do legado `stage_number` foi
  removida. Aquisição `source`/`medium` volta a ser responsabilidade exclusiva
  do GA4 e das UTMs.
- A macroetapa é separada do passo interno: problemática = 1; objetivo geral e
  objetivos específicos = 2; literatura e desenvolvimento = 3; metodologia e
  mapa final = 4.
- A allowlist continua bloqueando texto livre, PII, UUIDs e valores de alta
  cardinalidade.

## Configuração autenticada do GA4

- Conta `346683903`, propriedade `550650234`, stream `15460310071`, Measurement
  ID `G-MKFYYRZG87`.
- Foram cadastradas doze dimensões de evento com os mesmos nomes `app_*` do
  contrato.
- As onze definições legadas permaneceram intactas para consulta histórica;
  não houve exclusão nem reescrita de dados.
- `project_start` e `project_completed` foram marcados como key events.
  `advisor_approved` permaneceu como diagnóstico, não como conversão primária.
- O key event padrão `purchase` aparece sem dados de stream e não pode ser
  desmarcado pela interface do GA4; não integra os relatórios operacionais.
- A exploração “Mapa — Jornada principal” foi reconstruída e salva como funil
  aberto: `login_success` → `project_start` → `stage_completed` →
  `project_completed`.
- Para 27/08–23/09/2026, o funil aberto mostrou 8 usuários em login concluído,
  30 em projeto iniciado, 22 em etapa concluída e 6 em projeto concluído. A
  leitura aberta mede entrada em cada etapa; não deve ser tratada como uma
  coorte sequencial fechada.
- O filtro `Internal Traffic` permanece em Testing, operação Exclude e valor
  `traffic_type=internal`. Ele não foi ativado sem evidência de eventos marcados
  por `Test data filter name`, evitando perda irreversível de tráfego legítimo.
- Retenção preservada em dois meses para eventos e quatorze meses para usuários
  durante esta janela conservadora de privacidade.

## Teste controlado

- Uma submissão pública do Mapa Rápido foi executada em aba temporária de
  produção com consentimento de métricas aceito apenas nessa aba.
- O evento `project_start` foi capturado exatamente uma vez com
  `app_auth_state=anonymous`, `app_role=unknown`, `app_surface=home`,
  `app_entry_mode=quick`, `app_product_type=unknown` e `app_result=started`.
- Em seguida foi capturado `login_started` com o mesmo contexto aplicável.
- Nenhum dos dois eventos continha o parâmetro reservado `source`; o rascunho e
  as chaves temporárias de captura foram removidos depois do teste.

## Quebra de série e observação

- A mudança de taxonomia em 24/09/2026 cria uma quebra de série para dimensões
  de contexto do produto. Comparações por essas dimensões não devem misturar
  dados anteriores e posteriores à data.
- Os nomes dos eventos continuam comparáveis; a interpretação de aquisição
  `source`/`medium` só deve ser considerada limpa no período pós-migração.
- A C097 permanece em observação até 08/10/2026 para verificar duplicidade,
  aquisição, distribuição dos parâmetros, key events e coerência do funil.

## Escopo preservado e rollback

- Search Console e Google Ads não foram alterados.
- Em rollback, reverter o commit/deployment e desabilitar somente as novas
  definições ou marcações, sem apagar eventos ou dimensões históricas.
- O filtro Internal Traffic não exige rollback porque continua em Testing.

## CPD

- Contexto: a auditoria C096 encontrou eventos ativos, porém atribuição
  contaminada por `source`, ausência de key events e funil vazio.
- Problema: aquisição e contexto interno compartilhavam nomes, impedindo confiar
  em origem, ativação e conclusão.
- Decisão: preservar eventos, migrar parâmetros para `app_*`, registrar novas
  dimensões, marcar dois resultados duráveis e reconstruir o funil.
- Estado: implantação e validação inicial concluídas; baseline de 14 dias em
  observação antes do encerramento definitivo.
