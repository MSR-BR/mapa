# Superfícies previstas

- `modules/research-workflow/workflow-navigation.ts`, `workflow-progress.tsx` e workspaces de descoberta, definição, capítulos, metodologia e mapa final.
- `modules/research-workflow/schema.ts`, `storage.ts`, `workflow-references.ts`, `regeneration-guidance.ts`, `advisor-review.ts`, `clone.ts`, `dashboard.ts` e montagem do contexto.
- `app/api/projects/[id]/navigation/route.ts`, definição, capítulos, metodologia, mapa final, revisão, geração e exportações; carregamento da página do projeto.
- Novo módulo de versões/contexto e endpoints de consulta/restauração, com nomes finais definidos na implementação.
- Nova migration Supabase aditiva, `lib/supabase/database.types.ts`, manifesto/verificadores de grants e testes de RLS existentes. Gerar o arquivo da migration pelo fluxo suportado, sem executar SQL nesta fase.
- Testes de workflow, contexto, permissões, migração, concorrência e navegador; fixtures sem dados reais.
- Documentação de arquitetura, retenção, consumo e recuperação, atualizada apenas com decisões verificadas.

Nenhuma dessas superfícies de aplicação ou banco foi alterada ao criar a Change.
