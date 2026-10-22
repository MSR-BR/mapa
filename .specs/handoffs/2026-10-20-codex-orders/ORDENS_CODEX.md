# Ordens para o Codex — continuação da auditoria de 20/10/2026

Cada bloco é independente: cole **um por vez** no Codex aberto na pasta do Mapa. Todos pressupõem o relatório `.specs/audits/claude-20261020/AUDITORIA_MAPA_APP_GA4_ADS.md` e a Change C122 (`.specs/changes/122-discovery-recovery-and-docx-safety/`).

Regras comuns (já repetidas em cada ordem): ler `AGENTS.md` e os guias de `node_modules/next/dist/docs/` antes de mexer em código Next.js; preservar alterações alheias; sem reset/clean/stash; sem ler chaves, cookies ou tokens; sem chamada paga de IA; sem alterar Ads, GA4, Supabase remoto, ambiente ou chaves; Pó Mágico só leitura.

Ordem sugerida: 1 → 2 (em paralelo com 3) → 4 → 5. A ordem 1 **só vale com a autorização do bloco** que está dentro dela; remova o bloco de autorização se ainda não quiser publicar.

---

## Ordem 1 — Revisar, commitar e (se autorizado) publicar a C122

```
Leia AGENTS.md, .specs/changes/122-discovery-recovery-and-docx-safety/spec.md e validation-2026-10-20.md, e .specs/audits/claude-20261020/AUDITORIA_MAPA_APP_GA4_ADS.md (seções 4.1, 6 e 8). Consulte Pó Mágico (somente leitura) e .specs/security/release-gate.md.

Tarefa:
1. Confira pwd -P, branch, HEAD (esperado f096d9f) e git status. Preserve .specs/handoffs/ e .specs/audits/. Revise o diff dos 4 arquivos modificados e dos 5 novos listados na spec; não altere a lógica sem reproduzir um defeito.
2. Rode npm run check, npm run test:research-starter, test:cards, test:limits, test:methodology, test:exports e npm run security:audit. Registre resultados reais. (npm run security:gate falha por npm audit em dependência de desenvolvimento: é preexistente, registre sem tentar contornar.)
3. Faça um commit local com escopo C122 (código, testes, spec, validação, roadmap e project-state), mensagem "fix(c122): ...". Não faça push nem deploy ainda.
4. Prepare o pacote de publicação: commit exato, destino (produção mapadapesquisa.com.br), versão seguinte à v16102026.2 seguindo o padrão do projeto, rollback (promover o deployment anterior), e smokes proporcionais (health, landing, /mapa, descoberta com projeto sintético, exportação Word). Classifique o diff como sensível (rota de API e IA). Mostre o pacote e marque PUBLICATION_STATE: APPROVAL_PENDING.

AUTORIZAÇÃO (válida só para este candidato, após eu ver o pacote do passo 4): <escreva aqui "autorizo push e deploy de produção do commit X" ou apague este parágrafo>. Sem essa frase, pare no passo 4.

Depois do deploy: confirme a revisão realmente publicada, health, smokes e logs sanitizados; registre CPD em .specs/changes/122-.../cpd-2026-10-20.md e atualize roadmap/project-state. Não altere Ads, GA4, Supabase remoto, chaves ou ambiente.
```

---

## Ordem 2 — Medição (GA-01…04), SEO e acessibilidade, sem migration

```
Leia AGENTS.md e as seções 4.2/4.3 do relatório .specs/audits/claude-20261020/AUDITORIA_MAPA_APP_GA4_ADS.md (IDs GA-01, GA-02, GA-03, GA-04, SEO-01, UX-01, UX-02, UX-06). Consulte node_modules/next/dist/docs/ para metadata, Script e nonce antes de editar. Parta do HEAD da C122 (ou da árvore atual com a C122 aplicada); abra a Change seguinte livre após conferir o roadmap.

Objetivo: corrigir, com testes de regressão, sem mudar a taxonomia de eventos além do necessário e sem alterar GA4/Ads:
- GA-01: usar workflowResponseFailure/workflowClientFailure (modules/research-workflow/request-failure.ts) em generation-workspace.tsx, literature-development-workspace.tsx, export-pdf-link.tsx, social-auth-form.tsx e dashboard-project-grid.tsx; remover o duplo disparo generation_retry + generation_started.
- GA-02/03: login_success só no SIGNED_IN após login_started; um único login_started por tentativa.
- GA-04: isSafeCampaignValue aceitar ponto, espaço e %, reencodando; adicionar utm_term e utm_id; guardar o objeto de campanha sanitizado (7+2 chaves) em sessionStorage antes do consentimento e usá-lo no primeiro page_view; não enviar nada antes do consentimento (manter o comportamento atual).
- SEO-01: completar openGraph/twitter de /mapa (imagem, siteName, locale, type).
- UX-01: aria-label no textarea rápido e remover autoFocus em dispositivos de toque. UX-02: mover o foco para o diálogo de consentimento, max-height com overflow, botão explícito "Aceitar métricas". UX-06: faixa WebVTT para o vídeo (se não houver transcrição disponível, crie o arquivo com a narração existente no código/specs; não invente conteúdo).
Testes: estender tests/analytics.test.ts (UTM com ponto, espaço, chave repetida; consentimento negado não envia), testes por fluxo para motivos distintos (429, 503, 422, offline), teste de metadata de /mapa. Rode npm run check.

Não faça commit/push/deploy. Entregue o diff e a validação. Não altere GA4, Ads, chaves, ambiente ou Supabase.
```

---

## Ordem 3 — Resiliência `PGRST303` e erros ignorados (SEC-07), sem migration

```
Leia AGENTS.md e o achado SEC-07 do relatório .specs/audits/claude-20261020/AUDITORIA_MAPA_APP_GA4_ADS.md, mais modules/profile/future-jwt-retry.ts, modules/profile/storage.ts e modules/projects/auth.ts. Consulte node_modules/next/dist/docs/ para route handlers. Não enfraqueça JWT, RLS nem identidade.

Objetivo: nas rotas e páginas listadas em SEC-07 (discover:34, generate:47/54/74/174/199-217, generation:33 e 50-56, exports:28, integrate:277 e 291-293, projects/advisor.ts:20, dashboard/projects/[id]/page.tsx:50, bug-reports:103), (a) nunca ignorar `error`; (b) transformar PGRST303 "JWT issued at future" e falhas transitórias do Data API em 503 com Retry-After, nunca em 404/409/200; (c) repetir com limite apenas leituras idempotentes (GET/HEAD) — no máximo três tentativas, até cinco segundos, como no retry existente; (d) checar a contagem de linhas em todo UPDATE (generation PATCH sem .select()). Crie um auxiliar único (por exemplo loadOrThrow) e reutilize-o. Mantenha o comportamento atual quando não houver erro.
Testes: um caso PGRST303 simulado por rota (esperado 503, nunca 404/409/200), um de erro persistente que falha fechado após as tentativas, e a suíte existente. Rode npm run check, test:methodology, test:cards, test:exports.

Sem commit/push/deploy. Entregue diff e validação, numerando a Change como a próxima livre.
```

---

## Ordem 4 — Migrations de segurança (SEC-03, SEC-05, SEC-01): somente local até autorização

```
Leia AGENTS.md, .specs/security/profile.md, .specs/security/release-gate.md e os achados SEC-01, SEC-03 e SEC-05 do relatório .specs/audits/claude-20261020/AUDITORIA_MAPA_APP_GA4_ADS.md. Leia as migrations 20260917003928_c087_harden_mode_aware_rls.sql, 20260919123000_c089_require_student_advisor_approval.sql, 20260924222657_c104_reduce_legacy_explicit_grants.sql e scripts/verify-*-local.sh.

Escreva migrations NOVAS (nunca editar as antigas), cada uma com RLS e grants explícitos juntos, search_path fixo e EXECUTE mínimo:
- SEC-03: impedir que o proprietário (Aluno) INSERT/DELETE a linha de research_workflows para forjar state/stable_state/advisorReviews (trigger de INSERT que force estado inicial e revisões vazias; revogar DELETE para authenticated se nenhum fluxo legítimo o usa — confirme por grep em app/ e modules/; comparar advisorReviews antigo e novo em UPDATE do dono).
- SEC-05: bucket de bug reports com file_size_limit e allowed_mime_types; restringir colunas inseríveis em bug_reports (status='new', admin_notes nulo, sem resolved_at/priority arbitrários) por grant de colunas ou CHECK.
- SEC-01: nas funções claim_pending_advisor_projects e set_project_advisor, exigir email_confirmed_at não nulo e identidade Google.
Testes: estender os verificadores locais em PostgreSQL 17 descartável (INSERT forjado com stable_state='completed' deve falhar; anon com priority='urgent' deve falhar; usuário sem e-mail confirmado reivindica 0 projetos; fluxos legítimos Aluno/Orientador continuam passando). Rode npm run supabase:release-gate e os verify-*-local.sh pertinentes (Docker local; confirme que nenhum script toca o projeto remoto).

NÃO aplique nenhuma migration no Supabase remoto, não altere Auth, não rode scripts *-remote* nem verify-rls. Entregue as migrations, os testes e um plano de aplicação com rollback para minha autorização explícita separada.
```

---

## Ordem 5 — Custo de IA (SEC-02/06, AI-04/05) e exportação (EX-01/02/03)

```
Leia AGENTS.md e os achados SEC-02, SEC-06, AI-04, AI-05 (custo) e EX-01, EX-02, EX-03 (exportação) do relatório .specs/audits/claude-20261020/AUDITORIA_MAPA_APP_GA4_ADS.md. Não troque modelos nem provedores; não aumente o teto de US$ 5/mês; não faça chamada paga.

Parte A — decisão pendente do responsável: PARE e pergunte antes de implementar o custo. Pergunta: /api/prompt-suggestions deve exigir login, ou ter limite durável sem login? E qual cota por usuário/dia? Só implemente após minha resposta (preferência a confirmar: login obrigatório + cota diária por usuário na função SQL reserve_ai_budget, em migration nova, só local).

Parte B — pode seguir sem migration:
- EX-01/02: o export Avançado não pode exigir IA nem ficar bloqueado com revisão pendente do Orientador: exportar com o texto substituto já existente em final-report.ts, com mensagem clara; prepare_export/save_export_review com revisão pendente devem devolver 409 advisor_pending legível (o gatilho capture_workflow_versions bloqueia a escrita); permitir primeiro salvamento manual da reformulação. Preserve a aprovação obrigatória e os originais.
- EX-03: embutir uma fonte Unicode com licença que permita redistribuição no pdf.ts (registre a licença), incluí-la em outputFileTracingIncludes, e provar por pdftotext que α≥β → Ω ✓ łódź ğ ş ≠ ∑ saem corretos; manter a aparência do PDF.
Testes: harness de rota com revisão pendente, falha de IA e Word/PDF sintéticos comparados; rode npm run check, test:exports, exports:verify.

Sem commit/push/deploy.
```

---

## Ações só suas (sem Codex)

1. **Supabase (painel, somente leitura):** o signup por e-mail está ativo? `monthly_limit_micros` vale 5000000?
2. **GA4 (admin):** incluir `accounts.google.com` na lista de referências indesejadas e desligar cliques de saída, downloads e histórico da medição aprimorada.
3. **Ads:** nada a fazer agora; reativar só depois da descoberta estável, atribuição corrigida e landing alinhada (relatório, seção 7.2).
4. **Autorizações:** deploy da C122, migrations remotas e qualquer gasto são decisões suas, por candidato.
