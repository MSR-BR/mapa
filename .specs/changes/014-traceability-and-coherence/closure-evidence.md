# Evidências de conclusão — Change 014

Data: 2026-08-08

## Entregue

- Página final única do fluxo v2, exibindo título, problemática, objetivo geral, objetivos específicos, matriz metodológica/resultados esperados, tópicos dos Capítulos 2 e 4, referências e avisos.
- Painel de rastreabilidade navegável, com seleção de elemento e leitura de origens/destinos.
- Motor determinístico de coerência com bloqueios, avisos e sugestões.
- Revisão complementar por IA estruturada, limitada a avisos/sugestões, sem permissão para rebaixar bloqueios determinísticos.
- Ação de conclusão com confirmação, zero bloqueios obrigatórios e persistência de `final_map`.
- Correção por origem: avisos e elementos apontam para a etapa que deve ser ajustada.
- Resumo persistido do mapa final contendo referências verificáveis e avisos/sugestões para a exportação v2.
- Sem novas tabelas no Supabase; o fluxo usa o JSON versionado existente em `research_workflows`, evitando custo e manutenção desnecessários.

## Arquivos principais

- `modules/research-workflow/final-map.ts`
- `modules/research-workflow/final-map-workspace.tsx`
- `app/api/projects/[id]/final-map/route.ts`
- `modules/generation/gemini.ts`
- `app/dashboard/projects/[id]/page.tsx`
- `app/globals.css`
- `tests/research-workflow-v2.test.ts`

## Validação executada

Comando:

```bash
npm run check
```

Resultado:

- Lint: aprovado.
- Typecheck: aprovado.
- Testes: 48/48 aprovados.
- Verificação de exportações legadas: aprovada.
- Build Next.js: aprovado.

Observação: o build emite aviso externo sobre Node.js 20 futuramente não ser suportado pelo `@supabase/supabase-js`; não bloqueia a Change 014.

## Próximo gate

Change 015 — Transição e entrega do v2.
