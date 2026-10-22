# Revisão integrada C123–C126 — 22/10/2026

**Resultado: NEEDS_REVIEW. Gate de publicação: BLOCKED.**
Revisão local concluída, com uma regressão funcional corrigida e pendências explícitas.
Nenhum commit/push/deploy, migration remota, alteração de Ads/GA4/Supabase,
chave/ambiente, e-mail enviado ou chamada paga. Não é CPD limpo.

## Candidato e método

- Base Git: `7fbd8e4a7fe95acd3a88fd23ad0dd621c9cc5e0c` (C122 local).
- `candidate.json` identifica por SHA-256 o snapshot local; `candidate.patch`
  contém o diff de implementação/testes/assets das C123–C126 sobre essa base.
  Não aplicar sobre a produção presumindo que ela já contém C122.
- Os pacotes individuais anteriores são registros históricos. O snapshot integrado
  prevalece para os arquivos corrigidos nesta revisão. O manifesto também registra
  os documentos, mas o patch executável exclui `.specs` e não inclui artefatos pessoais.
- Revisão S3: autorização, persistência, transições SQL, reserva de custo, telemetria,
  exportação e compatibilidade entre Changes. Dados sintéticos, Chrome sem perfil
  pessoal e rede interceptada; PostgreSQL 17.11 descartável sem rede/portas externas.
- Pó Mágico v20261020.002, HEAD local/remoto
  `81e3cbef9fc2b5b29074297490351f681ed16b47` confirmado em 22/10 por leitura.
  Checkpoints resume/review/delivery; blueprints APP/AI/security. Delta adotado:
  provar compatibilidade do SQL com revisão de etapas antigas antes de publicação.
  Codex/GPT-6; variante/esforço do runtime não expostos. Sem subagentes.

## Correções realizadas nesta revisão

### R1 — C125 bloqueava revisão legítima de etapa anterior (P1, corrigido)

Aluno já na metodologia, com problemática existente, pede revisão da problemática
mantendo `validating_methodology` e `methodology_matrix` como destino. A C111
permitia esse fluxo; a nova função da C125 o rejeitava com
`student_advisor_review_transition_invalid`, pois havia perdido o ramo de revisita.

Prova: a fixture passa antes da C125 e falha depois da versão original da C125
(`evidence/c125-revisit-before-fix.log`). A migration ainda não publicada foi
corrigida para preservar a regra C111, sem remover o teste NULL-safe `IS NOT TRUE`
nem os bloqueios de pareceres forjados. Novo teste verifica texto e progresso
preservados; cinco variações inválidas continuam recusadas: destino ausente,
avanço indevido, activeStep divergente, etapa futura e etapa sem conteúdo.
Após a correção: `c125_hardened_pass`, `student_advisor_gate_ok`,
`explicit_grants_ok`, `c125_local_security_ok`.

Arquivos: `supabase/migrations/20261022183455_c125_workflow_owner_guard.sql`,
`scripts/verify-c125-security-seed.sql`, `scripts/verify-c125-security.sql`.
Somente a migration NOVA e não aplicada foi editada; nenhuma migration histórica.

### R2 — simulador Research Starter incompatível com C124 (corrigido)

`scripts/verify-research-starter-resilience.mjs` não simulava `.retry(false)` e
`.abortSignal(signal)`, agora usados pela camada Data API. Produzia 502 no teste
que esperava 200. Adicionados métodos com assertions; suíte completa passou.
Isso era um defeito do simulador, não evidência de indisponibilidade de produção.

## Pendências que impedem liberar o conjunto

### R3 — versão Next.js com aviso aplicável (P1, aberto)

Consulta atual ao registry retornou **6 pacotes sinalizados: 1 crítico e 5 altos**.
`next@16.3.8` é dependência de produção e reúne três avisos. Não confundir seis
pacotes com seis falhas independentes. O `npm audit` online termina com código 1;
consulta offline anterior com zero não é evidência válida de ausência de avisos.

- [Server Actions / DoS](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r):
  aplicável por inspeção do App Router e de Server Actions em `modules/*/actions.ts`.
  Não houve exploração. Versão corrigida documentada: 16.4.1; registry sugere 16.4.2.
- [Imagem SVG / RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw):
  a mitigação oficial exige Sharp >=0.35.5, já instalado por override neste candidato.
  Não declarar exploração confirmada nem estado da instalação remota.
- [use cache / RCE](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr):
  não encontrados Cache Components/use cache retornando typed arrays no código do app.
  Pré-condição não observada; mantenedor ainda recomenda atualização.
- Cinco altos na cadeia de desenvolvimento ESLint/fast-glob/micromatch/braces.
  Não executar o downgrade automático de eslint-config-next sugerido pelo audit.

Próxima correção: atualização controlada e compatível do Next/ESLint com lockfile,
leitura dos guias da versão, nova auditoria, testes e build. **Nenhum pacote foi
alterado nesta revisão.** Evidências: `npm-audit-current.json`, `installed-next-sharp.json`.

### R4 — SEC-04, lembretes sem limite durável (P1, aberto e preexistente)

`app/api/projects/[id]/advisor-review/remind/route.ts:45` permite novo envio para
cada POST autorizado e gera idempotência aleatória. Sem intervalo persistido por
revisão/ator, repetição pode abusar do serviço de e-mail e gerar custo. Confirmado
por inspeção; nenhum envio real. Não pertence às implementações das Ordens 2–5.
Correção recomendada: reserva atômica/cooldown por revisão e ator, proteção de
concorrência, tratamento explícito da falha e teste local com transporte simulado.
O intervalo é de notificações, não uma cota diária de uso do app/IA.

### R5 — C123 esconde orientação de erro (P2, aberto)

`modules/research-workflow/request-failure.ts:62` substitui códigos desconhecidos
por mensagem genérica. `chapters/route.ts` retorna 409 `student_advisor_required`,
mas a interface da literatura usa esse helper e não informa que falta cadastrar
orientador. Também há respostas 409 antigas sem código. Reproduzido sem rede em
`evidence/advisor-required-message.log`. A condição continua bloqueando corretamente,
mas pedir apenas para tentar de novo não resolve e induz a impressão de travamento.
Correção recomendada: códigos estáveis para os 409 conhecidos e mensagens locais
permitidas, com testes dos caminhos de orientação. Não voltar a exibir erro bruto.

## Validação realizada

| Verificação nesta revisão | Resultado |
|---|---|
| npm test | 263 testes PASS (211 principais + 13 DOI + 39 IA), mais 45 cenários Data API e harness de sugestões |
| test:exports e exports:verify | PASS; 553 campos compartilhados PDF/Word e Unicode exato |
| test:methodology, test:cards, test:limits | PASS; inclui recuperação/metodologia e 13 cenários de cards |
| test:research-starter | PASS após reparar o simulador; falha inicial preservada |
| Browser de medição | 30 cenários PASS, rede interceptada |
| Browser de exportação/sugestões | 5 fluxos PASS, rede interceptada, nenhuma IA paga |
| C125 antes/depois | Regressão reproduzida, corrigida e cinco pedidos inválidos recusados; aprovação/isolamento/grants PASS |
| supabase:release-gate após correção | PASS: 24 migrations locais, 19 funções, 11 tabelas |
| lint / typecheck / git diff --check | PASS; um warning preexistente em foundation.test.mjs:887 |
| security:audit / fast check | PASS_WITH_ACCEPTED_RISK estático / PASS; não substituem o parecer manual |
| npm audit online | FAIL: seis pacotes sinalizados; detalhe acima |

Build Webpack e concorrência do orçamento são evidências anteriores da C126,
não reexecutadas aqui: nenhum arquivo de runtime da aplicação mudou nesta revisão.
O build padrão Turbopack havia falhado por limitação do ambiente; não declarar
`npm run check` completo nem `security:gate` aprovado. A auditoria atual sozinha
já impede PASS do gate de segurança. Logs em `evidence/`.

## Limitações e decisões preservadas

- Login no app para sugestões de IA, sem cota diária por usuário (decisão humana).
  Uso anônimo tem sugestões locais; saldo global insuficiente não bloqueia digitação.
  Reservas conservadoras incluem Gemini e fallback; um usuário pode consumir o saldo
  compartilhado. Valor/funcionamento de US$5 no destino ainda não verificados.
- C123 UX-06 continua pendente: roteiro de 60s não comprova sincronização do vídeo
  de 76,57s. Não conectar legenda inventada; transcrever/sincronizar a mídia real.
- Sem comprovação remota de Auth/Storage/PostgREST, links Google históricos,
  tamanho/MIME de upload por HTTP, configurações GA4 ou aplicação destas Changes.
- Não classificar o site como comprometido nem atribuir falhas históricas a estes
  achados sem evidência causal. Nenhum conteúdo acadêmico privado foi consultado.

## Sequência de publicação e rollback (plano, não execução)

1. Corrigir R3/R4/R5 e concluir ou delimitar explicitamente UX-06. Regerar candidato
   exato e executar gates completos sobre esse candidato.
2. Com autorização de leitura do destino, conferir revisão publicada, migrations,
   drift, backup/restauração e metadados do contador. Não presumir que a C122 local
   está publicada. Definir versão pública e destino exatos antes da autorização.
3. Revisar adaptador de duplicação estudantil: publicar código compatível antes das
   três migrations C125. Autorizações de commit/deploy e de banco são separadas.
4. Após eventual aplicação autorizada: testar aluno/orientador, revisão de etapa
   antiga sem perda, exportações, sugestão anônima/local e autenticada; conferir
   health/revisão/ledger/ACLs sem chamadas pagas desnecessárias.
5. Rollback preferencial é correção à frente. Não voltar a servidor que clone etapa
   avançada com a C125 ativa; não reabrir aprovação forjada nem apagar históricos.
   Compensação SQL exige nova migration, snapshot real e autorização própria.
   Reverter C126 pode reintroduzir consumo Gemini sem reserva: avaliar esse risco.

Este pacote é **para revisão**, não uma autorização ou um candidato liberado para
deploy. Os planos individuais continuam válidos onde não conflitarem com os
achados e hashes desta revisão.
