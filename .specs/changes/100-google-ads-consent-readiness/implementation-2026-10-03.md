# C100/C108 — preparo de medição para Google Ads (03/10/2026)

Estado: implementação local validada; publicação e prova com dados reais pendentes. Nenhum vínculo Google Ads, campanha ou gasto foi criado.

## Código

- Consentimento básico: não carrega a tag antes da escolha nem após recusa. Métricas e publicidade têm escolhas separadas, revisáveis no rodapé; ao revogar métricas, recarrega a página para remover a tag já injetada.
- Consent Mode v2: default dos quatro sinais em `denied` antes de configurar o GA4; após aceitar métricas, `analytics_storage=granted`; `ad_storage` e `ad_user_data` dependem da escolha separada de publicidade; `ad_personalization` continua sempre `denied`.
- URLs enviadas em `page_view` removem UUIDs e parâmetros privados. Na landing pública, apenas parâmetros de campanha com formato restrito são preservados, inclusive `gclid` para futura atribuição.
- `project_start` sai dos cliques de intenção e é emitido só após leitura autorizada do projeto criado e persistido; a aba evita reenviar o evento ao revisitar a URL. `project_completed` exige transição persistida para `completed`, inclusive na aprovação final pelo orientador. O 200 de “aguardando revisão” não conta conclusão.
- `consent_choice` deixa de ser emitido em cada montagem da tag e passa a ocorrer somente após alteração explícita com consentimento analítico. A política de privacidade explica as escolhas e a revogação.

## GA4

- Propriedade verificada: `550650234` (Mapa da Pesquisa). Em Admin > Eventos, `project_start` foi desmarcado como evento-chave até a nova implementação estar publicada e validada. Leitura posterior: permanecem `project_completed` e `purchase` (este sem stream) como key events.
- Conversão candidata para Ads: `project_start` **depois da criação persistida**, pois ocorre na sessão do autor. `project_completed` pode ser disparado na sessão do orientador e não deve ser presumido atribuível ao clique do aluno. A decisão final e eventual remarcação como key event dependem de prova E2E em produção, sem duplicidade.
- Não foram alterados filtro de tráfego interno, retenção, definições legadas, vínculos Ads nem dados históricos.

## Validação e próximos gates

- Lint, TypeScript, build e suíte de testes passaram. O navegador local, com ID GA4 fictício, comprovou: pré-escolha/recusa sem tag; métricas sim/publicidade não; publicidade sim/métricas não sem tag; revogação com recarga sem tag; personalização sempre negada.
- Após publicar: verificar Tag Assistant/DebugView na propriedade real, criação persistida, espera pelo orientador, aprovação final, ausência de PII e leitura de `source/medium` em nova janela. A anomalia histórica `dashboard`/`unknown` ainda não tem causa isolada.
- Não vincular/importar para Ads nem lançar campanha antes de corrigir/validar atribuição e aprovar a janela de observação pós-publicação. A conta `MSR-BR` pertence ao TERMO e fica fora de escopo.

## Reversão

- Código: promover o deployment estável anterior no Vercel.
- GA4: se necessário, remarcar `project_start` como key event apenas após confirmar a semântica da versão em produção. Nenhum dado histórico foi apagado.
