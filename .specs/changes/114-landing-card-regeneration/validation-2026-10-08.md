# C114 — Verificação local de 08/10/2026

Estado desta rodada local: implementada e pronta para revisão, ainda não publicada naquele momento. Publicação posterior autorizada e concluída: [CPD de 08/10](cpd-2026-10-08.md), `v08102026.1`.
Base Git: `892584dc54020190dbb48ece73cbffe84a79b758`, branch `codex/change-003-004`.
Árvore já continha C113 e registros C109/C110; esses arquivos foram preservados.

## Resultado por requisito

1. Landing sem formulário de criação embutido. Título mais compacto, CTA visível e links reais para `/mapa`, `/mapa?modo=avancado` e `/mapa?modo=rapido`. Metadata, canonical, conteúdo editorial e JSON-LD preservados; `/mapa` incluído no sitemap. Nenhuma garantia de indexação pelo buscador é inferida.
2. Página pública dedicada: preparar a ideia nos dois modos não exige login. Gerar/persistir continua exigindo conta Google e as permissões existentes. O rascunho segue pelo fluxo de retomada já existente.
3. Regeneração individual para problemática, objetivo geral, cada OE, tópico, título, classificação e linha metodológica. A página é salva antes da IA; texto atual, orientação e contexto entram no pedido. Resultado visível como rascunho, sem promover o contexto confirmado ou substituir outros quadros. Falha/CAS preserva a gravação anterior. Trocar contexto/pedido mantém o texto; ações têm ajuda. Voltar salva antes de navegar; Próximo confirma e segue, mantendo a aprovação do orientador para projetos de aluno.
4. Otimização consulta Research Starter e acrescenta fontes ao arquivo comum, com deduplicação. Não regenera tópicos nem remove suas associações, referências manuais ou fontes anteriores.
5. Literatura identifica quantidade exigida (3–6), tópico e campo inválido; títulos têm indicação de obrigatoriedade e erro localizado. Recomendações de coerência permanecem orientativas. Rascunhos com menos de três tópicos podem ser salvos; não há aceite de proposta global necessário para a nova regeneração individual.
6. Primeiro avanço dos objetivos gera tópicos quando ainda não existem. Literatura vazia mostra explicação e recuperação explícita. Revisitar uma etapa não substitui os tópicos existentes.

## Verificações

| Verificação | Resultado |
| --- | --- |
| `npm test` | 211 testes: 178 gerais, 13 DOI, 20 IA, incluindo o contrato do novo prompt. |
| `npm run test:cards` | 13 cenários de rotas reais com fronteiras simuladas: escopo, autorização, revisão concorrente, falha, preservação, rascunho parcial, busca aditiva e inicialização da literatura. |
| `node scripts/verify-versioned-workflow-routes.mjs` | Regressão C111 aprovada. |
| `npm run typecheck` | Aprovado. |
| `npm run lint` | Aprovado; bundles gerados em `tmp/` excluídos do lint, mantendo código e testes fonte verificados. |
| `npm run security:audit` | `PASS_WITH_ACCEPTED_RISK`; riscos existentes (limitação de taxa por instância, ausência de antivírus de anexos, validação remota não inferida). |
| `npm run supabase:verify-explicit-grants` | Aprovado; sem migration ou alteração de políticas/grants. |
| `npm run exports:verify` | DOCX/PDF sintéticos gerados. |
| `next build --webpack` | Aprovado em cópia isolada `/tmp/mapa-c114-build`, sem arquivos de ambiente; acesso externo somente às fontes públicas exigidas por `next/font`. |
| `git diff --check` | Aprovado. |

## Navegador local

`node scripts/serve-workflow-review.mjs` serve os componentes e rotas reais com autenticação, armazenamento, IA e Research Starter simulados. As páginas públicas são renderizadas do código real com wrappers locais de Link/Image/headers; não reproduz OAuth nem infraestrutura de produção.

- Link da landing abriu `/mapa?modo=rapido`; alternância para Avançado mostrou as cinco perguntas sem login.
- Edição de OE2 + orientação → somente OE2 regenerado; OE1/OE3 preservados.
- Troca pedido/contexto manteve o texto; regeneração não limpou o pedido.
- Edição nova de OE1 → Voltar → reabrir objetivos: edição recuperada, junto do OE2 regenerado.
- Otimizar literatura: de uma para duas fontes; três tópicos e associações anteriores permaneceram intactos.
- Em 320px e 390px, largura do documento igual à viewport; ações e campos acessíveis. Layout desktop conferido em 1280px.

Evidências: [landing](evidence/landing.jpg), [entrada pública](evidence/mapa-entry.jpg), [regeneração individual sintética](evidence/card-regeneration.jpg).

## Limites e publicação

- Nenhuma chamada paga, alteração de chave/ambiente, modelo, orçamento, campanha, banco remoto ou deploy nesta execução. Nenhum dado do projeto de Sérgio foi utilizado.
- Os testes verificam requisição, persistência, isolamento e falhas; qualidade acadêmica da resposta real da IA e OAuth em produção não foram executados.
- Revisar o diff C114 e decidir o candidato de publicação, preservando a C113 pendente. O gate local exige autorização explícita do alvo de deploy. Depois de publicar: confirmar revisão/canônico, validar login/retomada, fluxo autenticado e regeneração por quadro com projeto de QA autorizado.
- Rollback funcional: reverter os arquivos C114 e republicar o candidato anterior; sem rollback de banco, pois não há migration. Histórico e rascunhos existentes continuam no formato C111.
