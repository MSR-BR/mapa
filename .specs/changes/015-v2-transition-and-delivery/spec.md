# Change 015 — Transição, exportação e entrega do v2

Status: especificada; depende das Changes 010 a 014.

## Objetivo

Colocar o novo fluxo em produção sem perder projetos existentes, atualizar dashboard e exportações e validar a jornada completa antes de substituir a geração monolítica.

## Compatibilidade e migração

- Migração de banco é aditiva e reversível no nível de aplicação.
- Projetos legados recebem `workflow_version = 1`; novos projetos usam `workflow_version = 2` após ativação.
- Estruturas antigas continuam abrindo no editor e exportando.
- Não converter automaticamente conteúdo legado em etapas validadas.
- Opcionalmente oferecer “Criar uma versão v2 a partir deste projeto”, sempre preservando o original.
- RLS e índices cobrem todas as novas tabelas/colunas sem ampliar acesso.

## Dashboard

- Cards v2 mostram título, área, etapa atual e percentual baseado em validações reais.
- Rascunhos de descoberta não exibem o prompt integral como título.
- Abrir projeto leva à etapa pendente ou ao mapa final quando concluído.
- Duplicar um projeto v2 copia conteúdo para novo fluxo em rascunho, com IDs e rastreabilidade próprios.
- Excluir mantém a política de soft delete e não deixa jobs órfãos acessíveis.

## Exportações

- DOCX e PDF ganham um preset “Mapa da Proposta de Pesquisa”.
- A ordem e os campos correspondem à página final da Change 014.
- A matriz metodológica deve permanecer legível, com quebra adequada de tabela.
- Referências verificáveis e atribuição ao Research Starter permanecem incluídas.
- Avisos de incerteza e revisão acadêmica permanecem visíveis.
- Exportação usa somente a última versão concluída ou uma versão de rascunho explicitamente identificada.

## Rollout

1. Aplicar schema aditivo e verificar RLS.
2. Publicar código com v2 desativado por configuração server-side.
3. Executar migração de compatibilidade e testes em preview.
4. Habilitar v2 apenas para conta de teste/administrador.
5. Validar jornada real com IA, Research Starter, Supabase e exportações.
6. Liberar novos projetos gradualmente.
7. Manter rollback para criação v1 durante janela definida, sem apagar dados v2.
8. Remover criação v1 somente após aceite explícito; leitura v1 permanece.

## Observabilidade

- Medir abandono e duração por etapa, regenerações, alterações humanas, falhas por provedor e inconsistências mais frequentes.
- Não registrar conteúdo integral do prompt ou das etapas.
- Correlation ID acompanha descoberta, validações, jobs e exportação.
- Orçamentos de chamadas externas são monitorados por jornada.

## Quality gate

- Unitários: schemas, regras, invalidação, rastreabilidade e coerência.
- Integração: migrações, RLS, jobs, IA, Research Starter e exportadores.
- Componentes: cards, stepper, editores, tabela, alertas e página final.
- E2E: prompt -> seis cards -> escolha -> cinco etapas -> metodologia -> mapa final -> salvar -> reabrir -> exportar.
- E2E legado: abrir, editar e exportar projeto v1.
- Segurança: autorização horizontal, entrada maliciosa, rate limit e ausência de segredos no cliente.
- Não funcionais: mobile real, acessibilidade, falha de rede, duas abas e refresh em cada etapa.

## Critérios de aceite

- [ ] Nenhum dado legado é apagado ou reinterpretado como validado.
- [ ] Novos projetos completam a jornada v2 ponta a ponta.
- [ ] Dashboard restaura exatamente a etapa pendente.
- [ ] DOCX e PDF refletem fielmente o mapa final e suas referências.
- [ ] RLS impede leitura e escrita cruzadas em todos os novos recursos.
- [ ] Métricas não expõem conteúdo acadêmico ou dados pessoais.
- [ ] Build, testes, preview e smoke de produção passam.
- [ ] A ativação geral ocorre apenas após aceite explícito.

