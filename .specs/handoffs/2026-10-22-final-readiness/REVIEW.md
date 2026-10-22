# Revisão para publicação — C122–C128, 22/10/2026

**RELEASE_GATE: BLOCKED.** O conjunto está validado localmente, mas ainda não está
liberado para produção. O bloqueio atual é de preparação/validação do destino e
escopo incompleto de acessibilidade; os antigos R3/R4/R5 foram corrigidos.
Nenhum novo defeito bloqueante de implementação foi identificado nesta revisão
focal, o que não equivale a garantia de ausência de defeitos.

Sem commit/push/deploy, alterações em Ads/GA4/Supabase remoto, credenciais, chamadas
pagas ou e-mails. Somente leitura de código, build isolado e documentação local.

## Candidato exato e aplicabilidade das evidências

Base Git `7fbd8e4a7fe95acd3a88fd23ad0dd621c9cc5e0c`, C122 commit local, com
C123–C128 ainda sem commit. `candidate.json` fixa 375 arquivos por SHA-256.
O snapshot inclui o estado completo usado no build, sem `.env`, caches,
credenciais ou os pacotes documentais antigos. Não é um commit de release.

Conferência dos manifestos integrados C123–C126, sobrepostos pelos manifests
C127/C128: **108 arquivos verificados, nenhuma divergência**. Assim, os testes
anteriores continuam aplicáveis aos mesmos arquivos. Os pacotes anteriores são
históricos, não devem ser aplicados em sequência cegamente; esta revisão atualiza
a prontidão sem reescrever os resultados antigos.

Revisão focada nas fronteiras alteradas: erros de dados e persistência, sessão,
reserva de IA, autorizações de revisão, cópia estudantil, lembretes, exportação,
metadados/consentimento, resolução de dependências e ordem de migrations.

## Situação de cada Change

| Change | Resultado local | Falta antes de considerar publicada |
|---|---|---|
| C122 — descoberta/Word | Correção de claim expirado e XML testadas; commit somente local | Publicação conjunta com as demais correções, identidade/versão exata |
| C123 — medição/SEO/acessibilidade | GA-01…04, metadata, entrada rápida e consentimento testados | UX-06: legenda/transcrição realmente sincronizada; validação GA4 no destino |
| C124 — Data API/PGRST303 | Leituras limitadas, erros explícitos e gravações verificadas, sem retry de escrita | Smoke real de Auth/PostgREST e status, sem atribuir causa aos erros históricos |
| C125 — segurança SQL | Três migrations locais; fraude reproduzida/bloqueada; revisita preservada | Ledger/drift/backup, vínculos existentes, Auth/Storage/PostgREST, aplicação autorizada |
| C126 — exportação/custo | PDF/Word sem dependência de IA; rascunho e save manual; login para sugestões | Confirmar contador global US$5 e configuração operacional no destino |
| C127 — Next/lembretes/mensagens | Next 16.4.2; limite durável de lembretes; mensagens orientativas | Nova RPC/migration no destino; planejar intervalo sem lembretes durante rollout |
| C128 — dependências dev | Audit completo zero; adaptador restrito testado e instalação limpa | Incluir tools/next-root-glob; revisar adaptador ao atualizar o plugin |

## Pendências para publicar, em ordem

### P1 — Validar banco, identidade e custo no destino

Quatro migrations novas ainda **não aplicadas**: três C125 e uma C127.
Sem consulta remota nesta revisão, não há confirmação de ledger, ausência de drift,
backup/restauração utilizável, metadata do bucket e configuração de identidade.
Os stubs PostgreSQL testam as regras SQL, não o HTTP real de Storage/PostgREST/Auth.

Antes da autorização de aplicação, verificar por metadados:
- revisão publicada e ledger atual, sem presumir C122 já publicada;
- backup utilizável e snapshot de definições/ACLs para recuperação;
- vínculos antigos sem identidade Google/e-mail confirmado (a migration não faz
  saneamento retroativo), para não presumir que todos já são confiáveis;
- limite `monthly_limit_micros = 5000000` e contador disponível: a C126 passa a
  depender dele também para Gemini primário; sem configuração, IA falha fechada;
- `ACCOUNT_MODE_SWITCH_ENABLED=true` no destino: o fallback do código ainda é
  false (`modules/profile/authorization.ts:64`), portanto não presumir proteção
  de versão de perfil/consentimento apenas por o código compilar.

Não ler valores de chaves. Configurações Auth/GA4 não foram alteradas nem validadas
nesta revisão; qualquer alteração futura requer escopo/autorização próprios.

### P1 — Definir ordem e reversão seguras do conjunto

Publicar servidor compatível com cópia estudantil antes da C125, evitando que
instâncias antigas tentem inserir cópias já aprovadas. Enquanto a RPC C127 não
existir, o novo handler de lembretes retorna 503 sem enviar: planejar essa janela.
Aplicar somente as quatro migrations/hashes aprovados, interrompendo após falha.
Uma migration posterior falhar não reverte as anteriores já confirmadas.

Depois conferir catálogo/ledger e fluxo sintético Aluno→pedido→Orientador,
revisita sem perda, exportação com revisão pendente e proteção de reenvio.
Transporte real de e-mail e IA paga não estão autorizados por esta revisão.
Preferir correção à frente: não promover C121/C122 antigos como rollback cego,
pois reintroduzem Next vulnerável/cópia incompatível/ausência de reserva de custo.
Não apagar mapas, históricos ou contadores para reverter.

### P2 — Identificação pública da versão e pacote final

`lib/app-version.ts:2` continua com fallback `v16102026.2`; a variável pública
`NEXT_PUBLIC_APP_VERSION` tem precedência. É preciso escolher e aplicar um
identificador coerente com o novo candidato (por exemplo v22102026.1, apenas
proposta). Publicar com o identificador antigo prejudica diagnóstico e auditoria.
Não alterei código nem ambiente para escolher por você.

O pacote final precisa incluir fontes/licença, o adaptador tools/next-root-glob,
lockfile e quatro migrations. O build desta revisão comprovou que as três fontes
DejaVu e os assets da marca entram no tracing da rota de exportação. Separar
fonte de produto dos patches/relatórios históricos; não usar git add . sem revisão.
Depois de qualquer ajuste, refazer manifesto/testes afetados antes de autorizar
commit e publicação do candidato exato. A autorização atual não inclui essas ações.

### P2 — UX-06 ainda incompleta

O player continua sem faixa de legendas. O rascunho WebVTT deriva de roteiro de
60 s e não comprova as falas do vídeo de 76,57 s. Para concluir C123, transcrever e
sincronizar o vídeo real ou delimitar explicitamente esse item como adiado antes
de liberar o conjunto. Não conectar a faixa não conferida como se estivesse pronta.

### Privacidade/medição — verificação administrativa separada

GA-05 (referências indesejadas) e GA-09 (medição aprimorada) permanecem pendentes.
A configuração GA4 pode coletar URLs fora da sanitização do app; o risco é hipótese
até conferência no painel/DebugView. Verificar antes de declarar a medição validada
ou iniciar novo tráfego pago. Testes locais não confirmam atribuição paga.
Ads não foi consultado, alterado ou reativado; publicação do app não o autoriza.

## O que deixou de bloquear

- R3/SEC-14: Next atualizado, audit completo/produção zero (C127/C128).
- R4/SEC-04: proteção durável, concorrência e destinatário canônico testados (C127).
- R5: códigos/mensagens orientam usuário e preservam campos (C127).
- **Build padrão Turbopack: PASS nesta revisão.** Instalação limpa em pasta
  temporária, sem `.env` nem credenciais; Next 16.4.2, 22 páginas geradas.
  Isso supera a antiga limitação do sandbox sem trocar o comando por Webpack.

## Evidências de teste e limites

Reutilizadas, com hashes iguais: 269 testes + harnesses, 31 cenários browser de
medição e cinco de exports, 553 campos PDF/Word, SQL local com concorrência e
aprovação/isolamento, lint/tipos, instalação limpa e security:gate local PASS.
Lint mantém um warning preexistente, não vulnerabilidade.

Novas nesta revisão: comparação de 108 hashes, build padrão a partir de snapshot
limpo e conferência do tracing de fontes/marca. Não repeti SQL/browser/IA porque
não houve alteração de implementação desde as verificações correspondentes.
Não declarei uma nova execução integral de npm run check.

A fonte DejaVu corrige os caracteres STEM/latinos ampliados testados; não garante
todos os alfabetos, CJK ou emojis. Isso já está documentado em assets/fonts/dejavu.
Sem cota diária por usuário por decisão humana: um usuário ainda pode consumir
o saldo global, embora a reserva limite o total. Demais P3 do relatório Claude
(legados, downloads de anexos, melhorias de funil/UX e bibliografia) não foram
convertidos em correções por esta revisão e não são todos bloqueios automáticos.

## Método

Skills Pó Mágico, project-security-audit e secure-release-gate já consultadas;
S3, leitura focal e reutilização de baseline do mesmo código. Pó Mágico
v20261020.002, core/blueprints APP/security reutilizados; checkpoints resume/review/
delivery. Codex/GPT-6, variante não exposta; sem subagentes. Archive não alterado.
O gate BLOCKED segue as exigências de candidato/destino/recuperação da skill,
independentemente de já existirem testes locais aprovados. Nenhuma aprovação
adicional é pedida nesta entrega; primeiro devem ser fechadas as pendências acima.
