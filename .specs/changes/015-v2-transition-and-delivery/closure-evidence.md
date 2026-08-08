# Evidências de implementação — Change 015

Data: 2026-08-08

## Entregue localmente

- Compatibilidade v1/v2 preservada por `workflow_version`.
- Rollout server-side via `MAPA_V2_ROLLOUT` e `MAPA_V2_ALLOWED_EMAILS`.
- Fallback para geração v1 quando o v2 estiver desabilitado por configuração.
- Dashboard v2 com título resumido/derivado, área, etapa atual e percentual calculado por validações reais.
- Rascunhos v2 não usam o prompt bruto como título do card.
- Duplicação de projetos v2 clona o conteúdo para novo workflow com IDs e links de rastreabilidade próprios.
- Exportação DOCX/PDF do preset “Mapa da Proposta de Pesquisa”.
- Exportação v2 distingue versão concluída de rascunho explicitamente identificado.
- Referências verificáveis, Research Starter e avisos/pendências permanecem visíveis nas exportações v2.
- Fluxo v1 continua abrindo e exportando pela rota antiga.
- Nenhuma tabela nova foi criada; a mudança usa `projects`, `research_workflows` e exportadores existentes.

## Arquivos principais

- `modules/research-workflow/rollout.ts`
- `modules/research-workflow/dashboard.ts`
- `modules/research-workflow/clone.ts`
- `modules/projects/actions.ts`
- `app/dashboard/page.tsx`
- `modules/projects/project-card-modal.tsx`
- `app/api/projects/[id]/exports/[format]/route.ts`
- `modules/export/docx.ts`
- `modules/export/pdf.ts`
- `modules/export/types.ts`
- `tests/research-workflow-v2.test.ts`
- `tests/foundation.test.mjs`

## Validação executada

Comando:

```bash
npm run check
```

Resultado:

- Lint: aprovado.
- Typecheck: aprovado.
- Testes: 52/52 aprovados.
- Verificação de exportações legadas: aprovada.
- Build Next.js: aprovado.

Observação: o build emite aviso externo sobre Node.js 20 futuramente não ser suportado pelo `@supabase/supabase-js`; o `package.json` já exige Node >= 22.13.0.

## CPD e produção

- Commit publicado: `840f0ff Complete research map v2 delivery`.
- Branch publicada: `codex/change-003-004`.
- Deploy de produção: `dpl_H6AmWFyGgdxZXJWXbeqxVkaRZK4N`.
- URL canônica validada: `https://mapadapesquisa.vercel.app`.
- Inspeção Vercel: deployment `Ready`, alias de produção aplicado.

Smoke público executado em produção:

- Home: HTTP 200.
- `/api/health`: `status=ok`.
- `/login`: HTTP 200.
- `/dashboard`: redireciona para login sem sessão, comportamento esperado.
- `/api/prompt-suggestions`: respondeu com 3 sugestões usando a integração de IA em produção.

## Integrações externas validadas

- Supabase: projeto `aeaweherkrqmlqnxsmib` verificado.
- Supabase/RLS anônimo: acesso público a `projects` e `research_workflows` negado como esperado.
- Gemini: saída estruturada compatível com schema `1.0.0`.
- Research Starter: respondeu `status=partial`, com 3 referências verificáveis e confiança `medium`.

## Auditoria Supabase

- MCP específico do projeto `supabase_mapa` operacional.
- Migrações remotas listadas:
  - `20260722013741_create_projects_foundation`
  - `20260807225154_create_research_workflow_v2_foundation`
  - `20260807225429_index_research_workflow_project_owner`
- Advisor de segurança: aviso de painel para ativar proteção contra senhas vazadas no Supabase Auth.
- Advisor de performance: avisos informativos de índices ainda não usados. Mantidos por enquanto porque são índices funcionais do fluxo e o baixo uso pode ser apenas reflexo de tráfego inicial.

## Pendências fora do código

- Configurar usuários de teste locais (`TEST_USER_A_EMAIL`, `TEST_USER_A_PASSWORD`, `TEST_USER_B_EMAIL`, `TEST_USER_B_PASSWORD`) para rodar `npm run supabase:verify-authenticated-rls`.
- Validar manualmente uma jornada autenticada completa no navegador: login, seis cards, escolha, etapas, salvar, reabrir, exportar DOCX/PDF.
- Ativar no painel do Supabase Auth a proteção contra senhas vazadas.
