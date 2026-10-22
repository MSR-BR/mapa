# Auditoria independente — Mapa da Pesquisa, GA4 e Google Ads

Execução Claude Code de 20/10/2026 (primeira execução desta pasta). Roteiro: `.specs/handoffs/2026-10-20-claude-audit/PROJECT_HANDOFF.md`. Parecer final: **NEEDS_REVIEW** (seção 10).

Convenções: **CONFIRMADO** = reproduzido por teste ou comprovado por leitura direta do código/SQL. **HIPÓTESE** = coerente com a evidência, sem prova. **NÃO VERIFICADO** = não havia acesso ou não foi executado. Números de linha referem-se ao HEAD `f096d9f`, salvo indicação.

---

## 1. Resumo acessível

**O que funciona.** Os contratos de jornada conferidos (Rápido/Avançado, rascunho preservado, regeneração isolada por quadro, limites de campo, aprovação obrigatória do Orientador, referências preservadas, Word com o mesmo conteúdo do PDF) passam nos 247 testes locais e nos cenários sintéticos de rota. Consentimento: um visitante novo não dispara nenhuma coleta antes de aceitar. O teto de US$ 5/mês do GPT não é contornável por retry, fallback ou concorrência nas rotas protegidas (verificado por leitura e testes com transporte simulado; o valor real no banco não foi verificado).

**O que falha.**
1. **Descoberta de propostas** (a etapa que o visitante de anúncio ou QR enfrenta primeiro). Havia um defeito comprovado: um projeto cuja descoberta foi interrompida ficava preso em "discovering" para sempre, e toda nova tentativa recebia 409. Além disso, **toda** falha era registrada no GA4 como `provider_invalid_response`, inclusive cancelamento, 401, 409 e erro de rede, o que tornava a causa das 12 falhas de 17–18/10 indecifrável. Ambos foram corrigidos localmente (seção 6). A causa real das 12 falhas continua **não comprovada**.
2. **Segurança (S3):** há caminhos para um Aluno contornar a aprovação do Orientador diretamente no banco (SEC-03), custo de IA sem limite durável por usuário (SEC-02/06), e um reenvio de e-mail sem limite que serve de relé (SEC-04). Nenhum foi corrigido nesta rodada (exigem migration ou decisão).
3. **Exportação:** o Word podia ficar corrompido por caracteres de controle colados pelo usuário (corrigido); o PDF perde símbolos fora do alfabeto latino (EX-03); um Aluno com Avançado aguardando o Orientador não consegue exportar nem rascunho (EX-01).

**O app está pronto para novo tráfego pago?** **Não.** Em 06–19/10, 26 eventos `generation_failed` contra 26 `generation_completed` (eventos, não pessoas, todas as etapas de geração). A medição de atribuição perde UTMs com pontos/espaços e na volta do login (GA-04). Zero cliques pagos aconteceram, portanto a conversão da página com tráfego pago nunca foi testada.

**O que fazer primeiro.**
1. Revisar e publicar (com autorização) as duas correções locais; depois, com uma tentativa real autorizada, confirmar nos logs a causa das falhas de descoberta (agora separáveis no GA4).
2. Decidir SEC-03 e SEC-01 (migrations/Auth) antes de crescer o uso.
3. Só depois considerar o piloto proposto na seção 7.2.

---

## 2. Escopo e identidade

| Item | Valor |
|---|---|
| Modelo executor | Claude Sonnet 5.5 (`claude-sonnet-5-5`), Claude Code, esforço de raciocínio baixo configurado pelo harness. Tokens/custo não medidos. |
| Delegação | 4 subagentes somente leitura (IA/bibliografia, GA4/SEO/UX, jornada/exportações, segurança), mesmo modelo por herança. Seus achados foram conferidos por amostragem (SEC-03, SEC-04, discover/route) antes de entrarem aqui; os demais são reproduzidos conforme o relato deles e marcados com o ID de origem. |
| Pó Mágico | `v20261020.002`, HEAD local = remoto `81e3cbef…`. Mapa continua ausente do `catalog.json` (não criei entrada). Classes: REPORT + APP + AI SYSTEM + DATA ANALYSIS + overlay SECURITY AND RESILIENCE; `S3_SENSITIVE` mantido. |
| Git inicial | branch `codex/change-003-004`, HEAD `f096d9f027e1…`, árvore: `M .specs/project-state.md`, `?? .specs/handoffs/` (o handoff). |
| Git final | mesmo HEAD, sem commit/push. Diff local em 4 arquivos modificados + 5 novos (seção 6); patch em `local-fixes.patch`. |
| Versão pública | `/api/health`: `ok`, `v16102026.2`, cinco integrações "configured" (consultado 20/10). HEAD difere de `ac44539` só em documentação (0 arquivos não documentais). Tag `v16102026.2` aponta `8aaf09d`; `ac44539` (correção do Word) é posterior, existe a tag `v16102026.2-r1`. O SHA realmente implantado **não foi verificado** (sem CLI Vercel nem acesso ao painel). |
| Acessos nesta rodada | Disponíveis: repositório, Node 22.23.2, `gh`, `curl` em páginas públicas, WebFetch, evidências persistidas do monitor de 20/10. **Não disponíveis/ não usados:** Google Ads, GA4, Vercel, Supabase remoto, Search Console. Toda cifra de Ads/GA4 abaixo é **evidência secundária datada** do monitor de 20/10 (extração 10:08Z), não consulta nova. |
| Fusos | GA4 `America/Rio_Branco`, BRL; Ads `America/Sao_Paulo`, EUR (2 h de diferença; dias e valores não alinhados). |

---

## 3. Matriz de auditoria

| Área | Status | Observação |
|---|---|---|
| App / jornada | VERIFIED (local, mocks) | Contratos da seção 3 do roteiro; EX-01, JR-02/03 abertos. |
| Autenticação / descoberta | PARTIAL | Código e rotas reproduzidos com mocks; causa das falhas históricas não comprovada; logs Vercel não consultados. |
| IA | VERIFIED (estático + testes simulados) | Sem chamada paga. Limite mensal real no banco NOT_CHECKED. |
| Bibliografia | VERIFIED (simulado) | Research Starter/Crossref reais NOT_CHECKED. |
| Histórico/concorrência | VERIFIED (mocks/leitura SQL) | Triggers contra banco real NOT_CHECKED. |
| Exportações | VERIFIED (estrutura e texto) | Word não aberto no Microsoft Word; renderização só por XML/pandoc. |
| Segurança | PARTIAL | Estático; RLS/Auth remotos e execução em PostgreSQL local NOT_CHECKED. |
| SEO | PARTIAL | Código e HTML público; dados de campo NOT_CHECKED. |
| GA4 / consentimento | PARTIAL | Código, testes e HTML público; rede/cookies/DebugView em navegador NOT_CHECKED. |
| Google Ads | PARTIAL (evidência secundária) | Leitura nova do Ads NOT_CHECKED. |
| Deploy / produção | PARTIAL | Health público apenas. |

---

## 4. Achados priorizados

Severidade: P0 bloqueia; P1 alto; P2 médio; P3 baixo/melhoria. Tipo: C = confirmado, H = hipótese, M = melhoria. "Estado" = situação ao fim desta rodada.

### 4.1 P1

**DSC-01 — Claim "discovering" sem saída (C; estado: CORRIGIDO LOCALMENTE).**
- Evidência: `app/api/projects/[id]/discover/route.ts` (HEAD) 50–52, 59–71 e 123–128. A rota grava `state:"discovering"` como reserva; só o processo em curso a libera. Se a função for encerrada pela plataforma (maxDuration 120 s), o cliente desistir sem que o `catch` rode, ou a escrita `failed` falhar (resultado não verificado), a linha fica "discovering"; a linha 50 devolve 409 "A descoberta já está em andamento." e a reserva só aceita `draft_prompt`/`failed`. Nenhum outro código lê ou reinicia esse estado (`grep`; `recoverWorkflowState` é código morto). A página mostra o botão "Buscar propostas" para esse estado.
- Reprodução: `scripts/verify-discovery-claim-recovery.mjs` com reserva de 60 min. **HEAD: 409; corrigido: 200 e `choosing_problem`.**
- Que isso aconteça em produção é **hipótese** (a interrupção precisa ocorrer; usuários móveis do QR a tornam plausível).
- Correção mínima aplicada: reserva só é retomada se `updated_at` for mais velha que 150 s (maxDuration + margem), com a mesma trava otimista por `revision` e `state`. Reserva recente continua 409; duas retomadas simultâneas: uma vence (200/409).
- Reversão: reverter o patch; sem migração.

**DSC-02 — Falhas de descoberta sem causa identificável (C para a instrumentação; causa raiz: HIPÓTESE, confiança baixa; estado: INSTRUMENTAÇÃO CORRIGIDA).**
- Evidência: `proposal-discovery-workspace.tsx:71` e `:178` (HEAD) gravavam `provider_invalid_response` para tudo que não fosse `TimeoutError`: cancelamento pelo usuário, 401, 403, 409, 429, 503 `profile_unavailable`, rede, JSON ilegível. A mensagem do `Error` bruto (por exemplo "Failed to fetch", "Unexpected token '<'") era exibida ao usuário. O retry reenviava o mesmo código fixo. Foi o mesmo defeito já diagnosticado para a metodologia em 15/10 e corrigido ali (`methodology-workspace.tsx`), mas não aqui.
- Linha do tempo GA4 de 18/10 (Rio Branco; BRT = +2 h): início e falha no mesmo minuto às 16:53, 20:37 e 20:38; início 16:55 e falha 16:56; início e conclusão 16:59. Quatro falhas em ≤ ~2 min do início: **incompatíveis com timeout de 105 s**; compatíveis com falha rápida determinística.
- Hipóteses, em ordem de plausibilidade (nenhuma comprovada): (H1) 409 por claim preso (DSC-01) após tentativa anterior interrompida, as tentativas consecutivas 20:37 e 20:38 se encaixam; (H2) cancelamento pelo usuário contado como falha; (H3) `PGRST303 JWT issued at future` (ver SEC-07: no `discover` o erro do `projects` é descartado e vira 404 "Fluxo v2 não encontrado"); (H4) `research-starter-unauthorized`/`invalid-request` (falha rápida 503/502); (H5) cota/indisponibilidade Gemini. Contra H4: uma conclusão 3 minutos depois.
- O que a evidência **não** prova: nem que JWT, Research Starter ou Gemini causou as falhas; nem o número de pessoas (`totalUsers` por origem é 1 para o QR); nem a versão do cliente.
- Correção mínima aplicada: classificador puro `discovery-failure.ts`; o componente usa o código declarado pelo servidor e o status HTTP, distingue cancelamento (`app_result:"cancelled"`), nunca mostra mensagem bruta, o retry carrega o motivo real, o rótulo de etapa inclui "salvamento das propostas" (antes um erro ao salvar era atribuído a "busca bibliográfica"). Sem novo código de motivo, a taxonomia GA4 não mudou.
- Próximo passo para fechar a causa: ver handoff DSC-02.

**SEC-03 — Aluno pode forjar `state`/`advisorReviews` por INSERT/DELETE (C estático; execução NÃO VERIFICADA; origem: subagente de segurança, conferido).**
- Evidência: o gatilho `enforce_student_advisor_workflow_progress` é `BEFORE UPDATE` (`20260919123000_c089…sql:169-174`), enquanto `research_workflows_insert_own` e `_delete_own` existem (`20260917003928_c087…sql:341-350`) e a migration c104 manteve INSERT/DELETE para `authenticated`. O dono pode apagar a própria linha e inseri-la com `stable_state='completed'` e revisões forjadas, usando a chave publicável e o próprio JWT. Mesmo em UPDATE, o caminho do dono não compara as revisões do Orientador já existentes.
- Impacto: derruba a regra "o avanço do Aluno mantém a aprovação obrigatória do Orientador" no nível do banco.
- Correção mínima: trigger/policy de INSERT que force estado inicial e revisões vazias; revogar DELETE em `research_workflows`; comparar `advisorReviews` antigo/novo para o dono. Teste: PostgreSQL local (`supabase:release-gate`): INSERT com `stable_state='completed'` deve falhar. **Exige migration remota: autorização explícita.**

**SEC-01 — Reivindicação de projetos de Orientador por e-mail sem verificação (H; P1 se confirmado; confiança baixa-média).** `modules/projects/advisor.ts:11-13`, `claim_pending_advisor_projects`/`set_project_advisor` (c087) comparam e-mail sem `email_confirmed_at`/provedor. Depende de a inscrição por e-mail estar habilitada no Supabase (NOT_CHECKED). Correção: desabilitar signup por e-mail ou exigir identidade Google e e-mail confirmado nas duas funções.

### 4.2 P2

| ID | Área | Resumo e evidência | Tipo | Correção mínima / teste |
|---|---|---|---|---|
| SEC-02 / AI-05 | Custo | `/api/prompt-suggestions` pública chama o Gemini pago sem login; limite apenas em memória por instância (`lib/security/rate-limit.ts`). Rotas de IA autenticadas não têm limite algum; a chamada primária do Gemini não passa por `reserve_ai_budget` (`generate.ts:69-71`). | C (estático) | Exigir sessão, ou contador durável (Supabase/KV); teste de N+1 → 429. |
| SEC-06 / AI-04 | Custo | Um único contador mensal global; um usuário pode esgotá-lo para todos. | C | Cota por usuário/dia na função SQL. |
| SEC-04 | E-mail | `advisor-review/remind/route.ts:45-50`: sem intervalo mínimo, chave de idempotência com `randomUUID()`, destinatário é o e-mail livre do projeto, título controlado pelo aluno no assunto. Relé de e-mail ilimitado. Conferido. | C | Cooldown por revisão (ex.: 1/24 h) + limite por usuário; remover título do assunto. |
| SEC-05 | Bug reports | `anon` pode INSERT em `bug_reports` e no storage; bucket sem limite de tamanho/MIME; INSERT amplo permite definir `status`/`priority`/`admin_notes`. Contorna as validações da rota. | C (estático) | Limites no bucket; restringir colunas/CHECK; rota como único escritor. Exige migration. |
| SEC-07 | Resiliência | O retry de `PGRST303` cobre só a leitura de perfil (`profile/storage.ts:43`). Em todas as outras leituras/escritas da mesma requisição, o erro vira 404/409/500/502 genérico ou sucesso falso: `discover:34` (404), `generate:47,54,74,174,199-217`, `generation:33,50-56` (PATCH sem `.select()`, perde concorrência), `exports:28`, `integrate:277,291-293` (cai em estrutura legada obsoleta), `projects/advisor.ts:20` (falso 409 "orientador exigido"), `dashboard/projects/[id]/page.tsx:50`, `bug-reports:103`. | C | Auxiliar `loadOrThrow` (503 + Retry-After para PGRST303/transitórios), verificar `error` e contagem de linhas em todo UPDATE. Teste: PGRST303 simulado por rota → 503. **Proposta, não aplicada** (muitas rotas). |
| EX-01 | Exportação | `final-map/route.ts:160` deixa passar `prepare_export`/`save_export_review` com revisão pendente; o gatilho `capture_workflow_versions` bloqueia a escrita (`…c111…sql:116-120`) → 502 genérico; a rota de exportação responde 409 `briefing_review_required` (`exports/[format]/route.ts:55-57`). Aluno com Avançado aguardando o Orientador não exporta nem rascunho; botões não ficam desabilitados. Teste sintético não modela o gatilho. | C (leitura) | 409 `advisor_pending` claro, ou exportar com o texto substituto existente. |
| EX-02 | Exportação | Todo export Avançado exige uma revisão salva, que depende de IA; se Gemini estiver sem cota/orçamento não há caminho manual. | C (desenho) | Permitir exportar com o texto substituto e primeiro salvamento manual. |
| EX-03 | Exportação | `pdf.ts` usa Helvetica padrão (WinAnsi): `α≥β → Ω ✓ łódź ğ ş 日本語 😀 ≠ ∑` sai ilegível no PDF e correto no DOCX (60 ocorrências no DOCX, 0 no PDF). Afeta texto STEM. | C | Embutir fonte Unicode e incluí-la em `outputFileTracingIncludes`; teste `pdftotext`. |
| EX-04 | Exportação | Caracteres de controle (U+0007, U+000B, U+000C) colados pelo usuário geram `word/document.xml` mal formado; o Word acusa arquivo corrompido, o PDF funciona. | C | **CORRIGIDO LOCALMENTE** (seção 6). |
| GA-01 | Medição | Códigos de motivo fixos/imprecisos em outros fluxos: `generation-workspace.tsx:97`, `literature-development-workspace.tsx:159`, login (`social-auth-form.tsx:49-53`: sempre `provider_unavailable`), `export-pdf-link.tsx:71` (sempre `network`), integração (`unknown`). `generation_retry` seguido de `generation_started` conta a tentativa duas vezes. | C | Reusar `workflowResponseFailure`/`workflowClientFailure`; remover duplo disparo. Descoberta já corrigida. |
| GA-02 | Medição | `login_success` dispara por aba para qualquer sessão existente (`analytics-consent.tsx:65-67`); inflaciona "logins" (95 eventos na janela). | C (código) | Disparar só no `SIGNED_IN` após `login_started`. |
| GA-03 | Medição | `login_started` dispara duas vezes por tentativa (`public-start-form.tsx:103`, `social-auth-form.tsx:38`). | C | Um passo do funil. |
| GA-04 | Atribuição | `isSafeCampaignValue` (`^[A-Za-z0-9_-]{1,250}$`) descarta a chave inteira com ponto/espaço/`%`; `utm_term` e `utm_id` não são mantidos; UTMs da landing não acompanham `/mapa` nem `/login` (links simples), logo o consentimento dado depois do primeiro acesso gera sessão "direct/referral". Reproduzido com sonda local. | C | Ampliar regex e reencodar; guardar o objeto sanitizado (7 chaves) em `sessionStorage` antes do consentimento. |
| SEO-01 | SEO | `/mapa` define `openGraph` próprio, que substitui o do layout (merge raso): ficam só og:title/description/url; sem imagem, `site_name`, `locale`. HTML público confirma. | C | Completar `openGraph`/`twitter` em `/mapa`. |
| SEO-03 | Estratégia | A landing não cobre "estrutura do projeto", "pré-projeto" nem tem FAQ; só 2 URLs indexáveis para cinco intenções de anúncio. Pode contribuir para a nota 2/10 de experiência da página (hipótese). | M | Conteúdo/página por intenção. |
| UX-01 | Acessibilidade | O textarea rápido não tem `label`/`aria-label` (só placeholder) e usa `autoFocus` (teclado abre sozinho no celular). HTML público confirma. | C | `aria-label`; remover `autoFocus` em toque. |
| UX-02 | Acessibilidade | Diálogo de consentimento sem `aria-modal`, foco não é movido; em 375×667 pode cobrir "Continuar com Google" (layout NÃO renderizado). Não há "Aceitar métricas" explícito. | C (a11y) / H (layout) | Foco, `max-height`, botão de aceite. |
| UX-06 | Acessibilidade | Vídeo sem legendas/transcrição (WCAG 1.2.2). Os controles de velocidade 1×/1,5×/2× funcionam. | C | Faixa WebVTT. |
| AI-01 | IA | `monthly_limit_micros` nasce 0 e é configurado fora do repositório; constraint aceita até US$ 100. O valor real de US$ 5 não pôde ser verificado. | NÃO VERIFICADO | Teste de release-gate que falhe se ≠ 5000000. |
| GA-09 | Medição | Medição aprimorada do GA4 (cliques de saída, downloads, histórico) pode capturar URLs `/api/projects/<uuid>/exports/pdf` fora do invólucro de sanitização. | H | Desligar no admin do GA4; conferir no DebugView. |

### 4.3 P3 (resumo)

| ID | Resumo |
|---|---|
| SEC-08 | `ACCOUNT_MODE_SWITCH_ENABLED` padrão `false` falha aberta (pula checagem de versão do perfil e consentimento); o perfil de segurança diz que flags falham fechadas. Produção documentada como `true` (não verificado). |
| SEC-09 | `/api/research-starter/reports` só exige usuário autenticado (sem perfil/consentimento/limite), sem uso na UI. |
| SEC-10 | PATCH admin de bug report zera `resolved_at` quando `status` não vem; admins fixos no código e no SQL. |
| SEC-11 | Upload de bug: MIME declarado pelo cliente, sem sniffing, sem limpeza se o INSERT falha. |
| SEC-12 | Webhook Resend: corpo lido antes da verificação sem teto; download de anexo sem timeout. Assinatura e janela de 5 min verificadas. |
| SEC-13 | CSP: `style-src 'unsafe-inline'`, `img-src https:`, sem `upgrade-insecure-requests`; `connect-src` sem hosts regionais do GA. |
| SEC-14 | `npm audit --audit-level=high` sai 1 (5 altas, **somente cadeia de desenvolvimento**; 0 com `--omit=dev`), logo `security:gate` não passa como escrito. `allowScripts` pode não ser honrado pelo npm (hipótese). |
| SEC-15 | `audit-security.mjs` testa texto (`includes`), não comportamento; padrões de segredo não cobrem `sk-`, `eyJ`, `sb_secret_`; contagens do relatório defasadas. |
| SEC-16 | Logs permitem `projectId`/`jobId` (vinculáveis ao dono; o perfil proíbe "identificadores de usuário", redação ambígua); `definition`/`chapters` devolvem `error.message` bruto. |
| SEC-17 | `set_project_advisor` revela se um e-mail tem conta e vincula qualquer usuário sem aceite. |
| EX-05 | DOCX legado (v1): sem marcadores `[R01]` nem quebras de linha, rótulos "R001". |
| EX-06 | Restos do "Otimizar literatura" retirado na C121: rota `chapters` ainda aceita `action:"optimize"` (chamada ao Research Starter sem UI), ramos `optimize` em `workflow-edit`/`save-versioned-workflow`/`ai/review`, eventos GA, CSS, UI legada v1 (`generation-workspace.tsx:190,208`), `docs/operations.md:343`, `tests/foundation.test.mjs:388,789`. |
| EX-07 | DOCX omite silenciosamente logo/código de barras se faltarem arquivos. |
| JR-02 | "Texto Mapa da Pesquisa" editado no relatório só é salvo ao exportar; navegar ou recarregar perde a edição. |
| JR-03 | `quick-start-form.tsx:54` retoma e envia automaticamente rascunho pendente (< 24 h) em qualquer visita ao dashboard; reload/duas abas durante "Iniciando…" podem criar dois projetos. |
| JR-04 | Mensagens de limite genéricas (objetivo específico < 15 caracteres; salvamento de metodologia; `save_export_review` 400). |
| JR-05 / GA-12 | `proposal_viewed` disparava a cada novo objeto `discovery` (inclusive ao escolher um card). **CORRIGIDO** (chaveado por `reportId`). |
| GA-05 | `accounts.google.com` como referral: configuração do GA4 (lista de referências indesejadas), não alterada. |
| GA-06/07 | Revogar não apaga cookies `_ga*`/`_gcl_*` (a coleta para após recarregar); o checkbox "Publicidade" não tem efeito com "Métricas" desligado e a UI não avisa; `consent_choice` só em aceite. |
| GA-08 | CSP pode bloquear hosts regionais do GA ou de anúncios ao conceder publicidade (NÃO testado em navegador). |
| GA-10/11/13 | `page_referrer` desatualizado após navegação SPA; `project_start` não idempotente entre abas/navegadores; fluxos `definition`/`final-map` não emitem evento de falha. |
| SEO-04/05/06/07 | robots/sitemap corretos; `Host:` ignorado pelo Google; `lastModified` fixo; `/` e `/mapa` são `no-store` (sem CDN); vídeo `preload="none"` ok; `.mp4` passa pelo proxy. |
| UX-03/04/05 | Rascunho em `localStorage` (24 h) em texto claro; Enter envia (sem Shift em teclado móvel); diálogos de info sem trap/retorno de foco. |
| AI-02..03 | Reserva GPT ocorre antes do cálculo do tempo restante; sobre-reserva (nunca bypass) quando o fallback é Gemini ou revisor Gemini. |
| AI-06..10 | `review.ts` grava provedor/modelo configurados mesmo com revisão `disabled`/`unavailable`; truncamentos silenciosos: rótulo da regra `.slice(0,120)`, `referenceIds` cortados a 12, título/autores/abstract/DOI no caminho automático (DOI cortado = DOI errado), `coherenceFindings.slice(-40)`. |
| AI-11/12 | `regenerate_card` descarta `stepProposals[step]` pendente ao salvar (H); regenerar linha sobrescreve campos do draft (esperado, coberto por histórico). |
| AI-13..17 | Crossref sem `select=`: 1 MiB pode ser excedido com listas grandes (80 linhas ≈ 682 KB medido); sinal do Crossref usa todo o orçamento restante; dedup só por `referenceId` (mesmo DOI de fontes distintas); `broadenResearchQuery` corta o último termo; ramo `gemini-quota-exhausted` morto para `AiError`. |
| AI-18 | 400/404 do Gemini vira `configuration` sem fallback (por desenho); modelo aposentado (404) não recairia no GPT. Melhoria, com cuidado de orçamento. |
| JS-01 | Timeout cliente de 110 s da descoberta (`AbortSignal.timeout(110_000)`) é ignorado: `useAiProgress.request` substitui `init.signal` pelo próprio (`use-ai-progress.ts`). O ramo `TimeoutError` é inalcançável; o prazo real é o do servidor (105 s). Só a descoberta passa `signal`. Proposta: `AbortSignal.any([init.signal, controller.signal])`. Não aplicado (hook compartilhado, baixo ganho). |

### 4.4 Controles confirmados como funcionando

- Consentimento: página pública sem referência a GTM/gtag; tag só carregada após `localStorage[mapa.analytics-consent.v1]==="accepted"`; recusa = nenhuma coleta; "Publicidade" sem "Métricas" não envia nada; `allow_google_signals:false`, `ad_personalization` sempre negado; parâmetros GA em lista permitida (12 chaves `app_*` enumeradas); `page_location` sanitizado (UUID e query removidos, só 7 chaves de campanha em `/` e `/mapa`).
- Segurança: as 17 rotas de `app/api/projects/**` usam o gate central; filtros de proprietário presentes; sem `service_role` fora de docs/SQL/scripts; sem segredos versionados (varredura `sk-`, `AIza`, `eyJ`, `sb_secret_`, `whsec_`, PEM); RLS em 11/11 tabelas; funções `SECURITY DEFINER` com `search_path` fixo e `EXECUTE` revogado de `public`/`anon`; open redirect do callback tratado; assinatura do webhook com janela de 5 min e `timingSafeEqual`; logs com lista de campos permitidos; CSP com nonce, HSTS, `nosniff`, `frame-ancestors 'none'`; verificação de origem em mutações `/api/`.
- IA: ponto único de chamada; modelo desconhecido falha fechado; `thinkingLevel:"minimal"` em camelCase só para `gemini-3.6-flash`; reserva de orçamento antes de cada tentativa GPT, falha fechada sem segredo/RPC; no máximo 2 tentativas por operação e 6 no total; progresso nomeia só o provedor que de fato roda; texto do usuário nunca truncado em falha.
- Jornada: toda mutação usa `revision` (CAS); `validate` recusado se a base mudou; rascunho, proposta, versão validada e contexto são estados distintos; histórico/restauração no servidor; regeneração isolada (13 cenários) e limites compartilhados HTML/Zod/IA.
- Exportação: PDF e Word da mesma fonte (`buildFinalReport`); sintético: 0 de 112 sequências ausentes em cada formato; pares original/reformulação presentes nos cinco campos; originais longos íntegros.

---

## 5. Resultado quantitativo de Ads e GA4

Fonte: `monitor-2026-10-20.json/.txt` (Codex, extração 20/10 às 10:08Z). **Não reconsultado nesta rodada.**

### 5.1 Google Ads — 06–19/10/2026 (America/Sao_Paulo; EUR)

| Métrica | Valor |
|---|---:|
| Impressões | 9 (RSA antigo 3, novo 6) |
| Cliques / gasto / conversões | 0 / €0,00 / 0 |
| CPC médio, custo por conversão | **não calculáveis** (sem clique/conversão) |
| Estado | `primary_status ENDED` (fim 19/10 23:59:59); `status` administrativo `ENABLED` |
| Estratégia | Maximizar cliques, teto de CPC €0,30; orçamento médio €2/dia; só Pesquisa Google |
| Consultas | "projeto de pesquisa" 7, "criador de tcc" 1, "pré projeto" 1 |

Impressões por dia (06→19/10): 1,1,0,1,0,0,0,0,0,0,**5**,1,0,0. As cinco de 16/10 e a de 17/10 ocorreram com teto €0,45 (15/10 21:03 → 18/10 06:07).

Perdas estimadas de participação (sentinela `0.9001`=">90%"): perda por classificação ">90%" em 8 dos 14 dias, todos sem impressão; nos dias com impressão a perda por classificação foi de 6% a 48% e a perda por orçamento de 48% a >90%, **com gasto zero**.

### 5.2 GA4 — 06–19/10/2026 (America/Rio_Branco; BRL)

| Indicador | Total | Excl. `codex_validation/qa` e `mapa_team/internal` |
|---|---:|---:|
| Sessões | 129 | 104 |
| Usuários (janela inteira) | 17 | 16 |
| Eventos | 1.965 | 1.804 |
| `project_start` | 40 | 38 |
| `export_pdf_completed` | — | 20 |
| `generation_completed` / `generation_failed` | — | 26 / 26 |

Origem (sessões, sem QA): direto 73; QR `scanned.page/referral` 19; Google orgânico 8; `(not set)` 2; `accounts.google.com/referral` 2. Nenhum `google/cpc`. Eventos não são projetos únicos nem funil. Uso interno não identificado permanece (residual).

### 5.3 Limitações

Janela e extração do monitor, sem reconsulta; GA4 pode reprocessar; fusos e moedas não alinhados; amostra de 9 impressões não sustenta efeito causal.

### 5.4 Baixa entrega: comprovado × hipótese

| Item | Classe | Fundamento |
|---|---|---|
| Entrega foi insuficiente para avaliar aquisição ou o produto | **Comprovado** | 9 impressões, 0 cliques. |
| O teto €0,30 coincide com o piso da faixa de topo de página do Keyword Planner (€0,26–0,61) para a palavra principal, com qualidade 2/10 | **Comprovado (dados)**, sem prova de causalidade | Rascunho C109 e monitor. |
| Perda por classificação >90% nos dias sem impressão | **Comprovado** (estimativa do Ads) | `daily`. |
| Elevar o teto a €0,45 produziu 6 impressões em ~2,4 dias (0 antes → 0,4/dia) mas 0 cliques | **Observado, sem controle** | Amostra mínima e sequencial; não prova ganho. |
| Ranking (lance baixo × nota de qualidade) é a causa dominante | **Hipótese forte** | Coerência dos itens acima; sem teste controlado. |
| Orçamento limitou a entrega | **Não sustentado** | Perda por orçamento com gasto zero é estimativa instável. Nos dias em que a classificação deixou de ser o gargalo apareceu perda por orçamento alta, sinal a investigar, não conclusão. |
| Demanda insuficiente | **Hipótese fraca** | Planner: ~4.400 buscas/mês para a palavra principal. |
| Correspondência exata muito restrita | **Hipótese** | Seis palavras, cinco exatas e uma de frase. |
| Experiência da página abaixo da média (só na palavra principal) | **Comprovado para essa palavra**; não generalizar | `post_click_quality_score BELOW_AVERAGE`. Landing `/` serve cinco intenções (SEO-03). |
| Aprendizado / elegibilidade / política | **Não sustentados** | Anúncio e palavras aprovados e elegíveis; encerramento por data não é reprovação. |
| Cadeia de conversão | **Consistente com o desenho** | `project_start` secundária no padrão da conta e única ação do objetivo personalizado `6459352879`, atribuído à campanha. Não há erro a corrigir; alterar o padrão da conta poderia afetar TERMO. |
| Conta lista conversão de outro produto | Observado | Meta exclusiva do Mapa só tem `project_start`. |
| Geografia/idioma/redes/URL/UTM | Conforme o rascunho C109 (BR presença, pt, parceiros e Display desligados, URL `https://mapadapesquisa.com.br/` + sufixo UTM); leitura nova **NÃO VERIFICADA** |

Nenhuma ação foi tomada no Ads. Campanha encerrada e automação pausada preservadas.

---

## 6. Correções realmente executadas (locais, não publicadas)

**Não houve commit, push, deploy, promoção de alias, migração, alteração de ambiente, chamada paga de IA nem alteração em Ads/GA4.** O diff está na árvore de trabalho e em `.specs/audits/claude-20261020/local-fixes.patch` (523 linhas). Registrada depois, a pedido do responsável, como **C122** (`.specs/changes/122-discovery-recovery-and-docx-safety/`, `LOCAL_PREVIEW_READY`, sem commit nem deploy).

| # | Arquivos | Antes | Depois |
|---|---|---|---|
| 1 DSC-01 | `app/api/projects/[id]/discover/route.ts`; `modules/research-workflow/discovery-failure.ts` (novo); `scripts/verify-discovery-claim-recovery.mjs` (novo) | Reserva "discovering" abandonada → 409 permanente. | Reserva expirada (>150 s) é retomada com a mesma trava por `revision`/`state`; recente = 409; retomada simultânea = 1×200 e 1×409; falha ao salvar relata etapa `saving`. |
| 2 DSC-02 | `modules/research-workflow/proposal-discovery-workspace.tsx`; `discovery-failure.ts`; `tests/discovery-failure.test.ts` (novo) | Tudo `provider_invalid_response`; cancelamento contado como falha; mensagem bruta exibida; retry com código fixo. | Código pelo `errorCode` declarado/HTTP (401→`auth_required`, 403→`permission_denied`, 409→`duplicate_action`, 429, `provider_*` só para códigos de provedor, `unknown` para 404/5xx não declarados), cancelamento = `app_result:"cancelled"`, mensagem fixa em português, retry carrega o motivo real, rótulo de etapa corrigido. |
| 3 JR-05 | `proposal-discovery-workspace.tsx` | `proposal_viewed` duplicado ao escolher card. | Chaveado por `reportId` e contagem de referências. |
| 4 EX-04 | `modules/export/docx.ts`; `modules/export/xml-safe.ts` (novo); `tests/docx-xml-safety.test.ts` (novo) | `\u000B`/`\u0007`/`\u000C` → `document.xml` inválido. | Remoção só desses caracteres (não de tab/LF/CR), cópia sem mutar a entrada, nos dois geradores DOCX. |
| — | `package.json` | — | `tests/discovery-failure.test.ts` e `tests/docx-xml-safety.test.ts` em `npm test`; `verify-discovery-claim-recovery.mjs` em `test:research-starter`. |

Reproduções: (1) rota com mocks, HEAD → `{"status":"failed","staleClaim":{"status":409,"state":"discovering"}}`, corrigido → `passed` (stale 200, fresh 409, takeover 200/409, save 502/`saving`). (4) mesmo teste do Word contra a versão de HEAD de `docx.ts` → `not ok` (`AssertionError`), contra a corrigida → `ok`. Contratos próximos preservados: `test:research-starter` (C120) e `test:exports` (C121) passam.

Efeito de medição (revisar com cuidado): no GA4, `generation_failed` de descoberta passa a vir com `app_result:"cancelled"` quando o usuário cancela, e os motivos deixam de ser quase todos `provider_invalid_response`; séries históricas não são comparáveis com as novas.

---

## 7. Propostas não executadas

### 7.1 Priorização

| Prioridade | Proposta | Dependências / risco | Esforço (estimativa) | Autorização necessária |
|---|---|---|---|---|
| 1 | Publicar C122 (itens 1–4 da seção 6) | Revisão do diff; deploy proporcional; rollback = deployment anterior | 0,5 dia | Deploy de produção |
| 2 | Fechar a causa DSC-02: uma tentativa real, autorizada, correlacionada com log Vercel sanitizado (30 min de retenção) e GA4 já separado | Depende de 1 | 1–2 h | Teste real (sem custo pago relevante) |
| 3 | SEC-03 (triggers INSERT/DELETE, revogar DELETE, comparar revisões) com `supabase:release-gate` | Migration; risco de regressão no fluxo de Orientador; teste local obrigatório | 1 dia | Migration remota |
| 4 | SEC-01: confirmar no Supabase se signup por e-mail está ativo; endurecer as duas funções | Verificação read-only no painel | 2 h | Alteração de Auth/RLS |
| 5 | Custo: login obrigatório ou limite durável em `prompt-suggestions`; cota por usuário/dia; passar a chamada primária do Gemini por `reserve` (SEC-02/06, AI-04/05) | Decisão de produto (visitante sem login) | 1–2 dias | Migration + decisão |
| 6 | SEC-07: `loadOrThrow` + retry PGRST303 amplo (incluindo POST rejeitado antes da execução, mas só GET/HEAD no primeiro corte) e checagem de `error`/linhas | Muitas rotas; testes por rota | 2–3 dias | Revisão de código |
| 7 | SEC-04 (cooldown do lembrete), SEC-05 (bug reports), SEC-12, SEC-16 | Migration para SEC-05 | 1–2 dias | Migration (SEC-05) |
| 8 | EX-01/02/03: exportar com texto substituto, 409 claro, fonte Unicode no PDF | Fonte com licença; tracing | 1–2 dias | Deploy |
| 9 | Medição: GA-01…04, SEO-01, UX-01/02/06 | Atualiza taxonomia e histórico | 2 dias | Deploy; ajuste no GA4 para GA-05/09 |
| 10 | Limpeza do "Otimizar literatura" (EX-06) e de dívida de `audit-security.mjs`/`security:gate` (SEC-14/15) | Decidir se v1 mantém | 1 dia | — |

### 7.2 Novo piloto de Ads — proposta separada (nada autorizado, nada executado)

**Condição prévia (quando a melhor decisão é não anunciar ainda):** não reativar enquanto (a) a descoberta falhar em ~50% dos eventos de geração, (b) a atribuição perder UTMs na volta do login (GA-04) e (c) a landing não responder às intenções anunciadas. Anunciar antes disso paga para medir um funil quebrado e produz leitura ambígua.

**Se C122 e as correções de medição estiverem publicadas e verificadas, e a taxa de falha da descoberta nas últimas duas semanas for baixa (proposta: ≤ 10% dos `generation_started` sem QA):**

| Elemento | Proposta |
|---|---|
| Hipótese única | Com Ad Rank limitado por lance próximo ao piso e qualidade 2/10, uma página de destino dedicada à intenção "projeto de pesquisa" (título e H1 espelhando a palavra) eleva a experiência da página e o volume de impressões elegíveis da palavra exata principal. |
| Alterações | (1) Nova URL de destino para o único grupo; (2) manter teto de CPC €0,45 (já exercitado, sem gasto); (3) manter as seis palavras e as 17 negativas; (4) nenhuma mudança em estratégia, redes, localização. |
| Dependências | Landing dedicada publicada com aprovação; UTMs preservados até `/mapa` e login; conversão `project_start` inalterada. |
| Duração | 10 dias. |
| Orçamento | Média €2/dia (inalterada). |
| Limite acumulado | €20 (nova regra horária; a de €28 permanece como segunda proteção). |
| Sucesso | ≥ 30 impressões da palavra principal e (≥ 3 cliques ou CTR ≥ 2%); nota de experiência da página ≥ "média". |
| Fracasso | < 10 impressões em 7 dias → encerrar e **não** elevar lance; conversas de produto antes de nova rodada. |
| Interrupção | Custo acumulado ≥ €20; qualquer reprovação de política; queda do health; falha de descoberta > 10% nas últimas 24 h. |
| Reversão | Pausar a campanha; restaurar a URL anterior; manter a regra de custo. |

Todos os valores são propostas, não autorização.

---

## 8. Validação

| Comando | Resultado | Natureza |
|---|---|---|
| `npm run lint` (baseline, antes das mudanças) | exit 0, 1 aviso preexistente (`tests/foundation.test.mjs:887`) | estático |
| `npm run typecheck` (baseline e final) | exit 0 | estático |
| `npm test` (baseline) | 190 + 13 + 38 = 241 testes, todos passam | unit/mocks |
| `npm run check` (final: lint, typecheck, grants estático, test, `exports:verify`, build) | **exit 0**; `test`: 196 + 13 + 38 = **247** (os 6 novos incluídos), 0 falhas; `next build` concluído | estático/unit/mocks |
| `npm run test:research-starter` | 12 testes; resiliência 8 cenários; recuperação de claim: passed; 0 chamadas externas/pagas | integração local simulada |
| `npm run test:cards` | 13 cenários de rota | idem |
| `npm run test:limits` | passed | idem |
| `npm run test:methodology` | C117 (14 cenários) e C119 passed | idem |
| `npm run test:exports` | rotas de exportação PDF/DOCX passed | idem |
| `npm run security:audit` | `PASS_WITH_ACCEPTED_RISK` (3 avisos, 0 falhas) | estático |
| `npm run supabase:verify-explicit-grants` | pass (21 migrations, 11 tabelas, 17 funções) | estático |
| `npm audit --audit-level=high` | **exit 1**, 5 altas só em dependências de desenvolvimento; `--omit=dev`: 0 | consulta ao registro |
| `git diff --check` | ok | estático |
| Subagentes: suítes de IA, jornada, exportações, segurança | 38+20, 135, 13, 38, 31 testes passam; resiliência, cartas, limites, metodologia, exportações em cópia fora do repositório | mocks |
| Sondas de exportação (Unicode, caracteres de controle) e de UTM | achados EX-03, EX-04, GA-04 | local |

Não executado, com motivo: `supabase:release-gate`, `supabase:verify-*-local`, `verify-ai-budget.sh` (exigem Docker/PostgreSQL, não iniciados); `*-remote*`, `verify-rls`, `verify-gemini`, `research-starter:verify*`, smoke, seeds (rede remota/paga, fora da rodada); Lighthouse/CrUX; navegador real (rede/cookies/CSP, layout do consentimento em celular, Word); consultas novas a Ads, GA4, Vercel e Supabase remoto (sem acesso nesta rodada). `exports:verify` e `test:exports` gravam em `tmp/` (ignorado pelo Git). `Falha preexistente`: `security:gate` não passa por causa de `npm audit` (SEC-14).

---

## 9. Handoff ao Codex

| ID | Feito / pendente | Executor sugerido | Arquivos / recursos | Próximo passo | Critério de aceite | Autorização |
|---|---|---|---|---|---|---|
| DSC-01 | Feito localmente | Codex (revisão e publicação) | `discover/route.ts`, `discovery-failure.ts`, harness | Revisar diff, abrir C122, deploy | `test:research-starter` verde; em produção, projeto com reserva >150 s retoma | Deploy de produção |
| DSC-02 | Instrumentação feita; causa pendente | Codex + responsável | proposal-discovery-workspace, logs Vercel, GA4 | Após o deploy, uma tentativa autorizada correlacionada com log sanitizado | Causa identificada em log + `app_reason_code` distinto no GA4 | Teste real |
| EX-04 / JR-05 | Feito localmente | Codex | `docx.ts`, `xml-safe.ts` | Publicar junto da C122 | Word com `\u000B` abre; `proposal_viewed` 1×/relatório | Deploy |
| SEC-03 | Pendente | Codex | migration nova, `scripts/verify-*-local.sh` | Escrever migration + teste local | INSERT forjado falha em PostgreSQL local; aplicar remoto | Migration remota |
| SEC-01 | Pendente (verificação) | Responsável | Supabase Auth (painel, somente leitura) | Conferir signup por e-mail e confirmação | Fluxo de Orientador só com e-mail verificado Google | Alteração de Auth |
| SEC-02/04/05/06 | Pendente | Codex | `prompt-suggestions`, `remind`, bucket, `reserve_ai_budget` | Decidir login/limite durável e cotas | Testes N+1→429; cooldown; bucket com limites | Decisão + migration |
| SEC-07 | Pendente | Codex | rotas listadas em 4.2 | `loadOrThrow` + testes PGRST303 por rota | Cada rota devolve 503, não 404/409/200 | Revisão |
| EX-01/02/03 | Pendente | Codex | `final-map/route.ts`, `exports/[format]/route.ts`, `pdf.ts` | Exportar com texto substituto; fonte Unicode | Aluno com revisão pendente exporta; `pdftotext` devolve símbolos | Deploy |
| GA-01…04, SEO-01, UX-01/02/06 | Pendente | Codex | analytics, `/mapa`, consentimento | Corrigir motivos, UTMs, metadados, a11y | Testes de analytics/axe; UTM com ponto preservada | Deploy |
| GA-05/09 | Pendente | Responsável | Admin GA4 | Lista de referências indesejadas; desligar medição aprimorada | Sem `accounts.google.com` como origem; sem `file_download` de exportação | Alteração no GA4 |
| AI-01 | Pendente | Responsável | Banco | Conferir `monthly_limit_micros = 5000000`; adicionar teste de release | Valor igual a US$ 5 | Leitura/consulta |
| Novo piloto | Proposta | Responsável decide | Seção 7.2 | Só após DSC-02 fechado e medição corrigida | Critérios 7.2 | Reativação/gasto |
| EX-06, SEC-14/15 | Pendente | Codex | `chapters/route.ts`, `docs/operations.md`, `audit-security.mjs` | Limpeza e ajuste do gate | `security:gate` verde | — |

---

## 10. Parecer final

**NEEDS_REVIEW.** O que foi auditado é compreensível e reproduzível, mas há pendências que exigem decisão ou acesso que esta rodada não tinha: causa real das falhas de descoberta (não comprovada), três itens de segurança que dependem de migration/Auth remotos (SEC-01, SEC-03, SEC-05), custo de IA sem limite durável, e nenhuma verificação nova de Ads, GA4, Vercel ou Supabase remoto. As quatro correções locais passam em `npm run check` e nos harnesses, mas **não estão publicadas**. Esta auditoria não é um gate de produção aprovado: para publicar será preciso candidato exato, revisão, destino, validação proporcional e rollback conforme `.specs/security/release-gate.md`.
