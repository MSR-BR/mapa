# C100/C108 — preparo de medição para Google Ads (03/10/2026)

Estado: código testado e enviado à branch, mas **Production restaurada ao release anterior** após falha em navegação autenticada. Prova de conversão e atribuição com dados reais pendente. Nenhum vínculo Google Ads, campanha ou gasto foi criado.

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
- Commits `fde1ebb` (funcional) e `1230d0d` (versão) na branch `codex/change-003-004`. Preview do commit funcional pronto, porém `degraded` porque Preview não tem Resend/Research Starter; não foi promovido.
- Primeiro deploy de Production exibiu versão antiga por override de `NEXT_PUBLIC_APP_VERSION` e foi revertido. O segundo deployment `dpl_BmGkPZ2wAuh7oMrCxodytzBp34Vi` exibiu `v03102026.1`, health `ok` e landing HTTP 200 no domínio canônico. Porém uma visita autenticada ao dashboard falhou com `profile_unavailable`, causa `PGRST303` / `JWT issued at future` no log do servidor. O deployment estável anterior `dpl_5HNbcpExdtFzQRgNBYKPbGWLWC98` foi promovido novamente; a mesma sessão voltou a abrir projeto normalmente, e o health público voltou a `v01102026.4`/`ok`. O override público de versão em Production foi alinhado a `v01102026.4` enquanto a versão nova não é aprovada.
- Correção preparada após a falha: o proxy agora encaminha ao renderizador o cookie realmente atualizado após o refresh (um teste com `NextRequest` comprovou que o clone anterior mantinha o valor antigo) e aplica os cabeçalhos de não-cache recebidos de `@supabase/ssr`. As leituras de perfil repetem **somente** `PGRST303` com `JWT issued at future`, no máximo três vezes e por até cinco segundos; as demais falhas continuam fechadas. Lint, tipos, testes e build passaram em cópia isolada. Isso mitiga o caso observado sem afrouxar autorização ou RLS; a origem do desalinhamento temporal ainda não está comprovada.
- Commit `0a9e157` enviado à branch; deployment candidato `dpl_Dqgt19WpQP1YAb86qKN29Sw2aoKX` foi criado com `--prod --skip-domain`, está `READY`, reporta health `ok`/`v03102026.2` e não recebeu o domínio canônico. O domínio público continuou em `v01102026.4`/`ok`. A tentativa de smoke programático com as duas contas E2E foi impedida pelo `email_provider_disabled`; o login Google usa `NEXT_PUBLIC_APP_URL` canônico e não valida a URL isolada. Nenhum perfil ou projeto foi alterado pelo smoke.
- Bloqueio de release: validar aluno e orientador em ambiente com OAuth funcional. Como o Google retorna ao domínio canônico, isso exige um staging OAuth autorizado ou uma promoção controlada com usuário disponível para testar imediatamente e plano de reversão. Não promover só com health público. Os conectores Supabase/Vercel desta sessão não deram acesso aos logs privados para comprovar a causa no serviço.
- Após uma publicação segura, ainda requer Tag Assistant/DebugView na propriedade real, criação persistida, espera pelo orientador, aprovação final, ausência de PII e leitura de `source/medium` em nova janela. A anomalia histórica `dashboard`/`unknown` ainda não tem causa isolada.
- Não vincular/importar para Ads nem lançar campanha antes de corrigir/validar atribuição e aprovar a janela de observação pós-publicação. A conta `MSR-BR` pertence ao TERMO e fica fora de escopo.

## Reversão

- Código: o deployment estável `dpl_5HNbcpExdtFzQRgNBYKPbGWLWC98` está ativo. No plano atual, `vercel rollback` a uma versão anterior à última falhou com 402; `vercel promote <deployment-id>` restaurou o alias canônico. O deployment novo permanece pronto, mas não deve ser promovido sem corrigir e validar o erro autenticado.
- GA4: se necessário, remarcar `project_start` como key event apenas após confirmar a semântica da versão em produção. Nenhum dado histórico foi apagado.
