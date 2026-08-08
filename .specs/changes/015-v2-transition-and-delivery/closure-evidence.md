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

## Pendências fora deste passo

- CPD/deploy.
- Preview/smoke de produção.
- Jornada real em produção com IA, Research Starter, Supabase e exportações.
