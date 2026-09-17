# Estado do projeto

## Blueprint

- Primário: APP v2.1.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: 087 — RLS e vínculos conscientes do modo.
- Changes funcionalmente concluídas: 001–086 conforme `.specs/roadmap.md`.
- Change 087 em validação: implementação e testes locais concluídos, fase 1
  aplicada remotamente e fase 2 ainda não executada.
- Change 088 permanece pendente para homologação E2E e rollout final.

## Decisões-chave

- Aplicação Next.js publicada na Vercel em `https://mapadapesquisa.com.br`.
- Em 16/09/2026, o domínio raiz respondia HTTP 200/HTTPS na Vercel e o A
  apontava para `76.76.21.21`, enquanto os nameservers permaneciam externos em
  `d.sec.dns.br` e `e.sec.dns.br`.
- DNS externo funcional é aceito. Delegar para a Vercel é opcional, exige
  autorização explícita, preservação integral da zona/e-mail e janela separada
  das migrations/RLS; o gate pertence à C88.
- Supabase é responsável por banco e autenticação; RLS protege os dados.
- Gemini e Research Starter são acessados somente pelo backend.
- `RESEARCH_STARTER_MAPA_API_KEY` é o único nome aceito para a credencial do
  Research Starter e permanece restrito ao backend de Production.
- Em produção, o papel inicial da conta ainda é permanente até a conclusão da C88.
- O estado-alvo aprovado para planejamento permite escolher Aluno ou Orientador
  na mesma conta; banco, servidor, interface e RLS devem aplicar o mesmo modo.
- O modo ativo será persistido no banco, versionado e trocado apenas por RPC;
  JWT, metadata e armazenamento local não serão fontes de autorização.
- No estado-alvo, ambos os perfis criam projetos Rápidos/Avançados e mantêm sua
  biblioteca própria: projetos de Aluno podem ter supervisão externa; projetos
  de Orientador são autônomos. O Orientador também recebe uma fila separada de
  projetos estudantis vinculados para revisão.
- Cada projeto terá `authoring_role` imutável; trocar o modo nunca altera
  autoria, propriedade, supervisão, vínculo ou conteúdo.
- Avisos acadêmicos orientam sem bloquear; integridade técnica continua
  obrigatória.
- A jornada usa quatro macroetapas e passos internos navegáveis para trás.

## Estado validado mais recente

As Changes 084–086 publicaram autorização centralizada, configurações de modo e
interfaces estritas com `ACCOUNT_MODE_SWITCH_ENABLED` desligada. Na C87, as duas
migrations, o verificador PostgreSQL 17 e a matriz automatizada foram concluídos;
`npm run check` aprovou 118/118 testes e o build Next.js 16.3.5. A migration
`20260917003926 c087_grant_switch_active_role` foi aplicada no Supabase e o smoke
remoto confirmou RPC idempotente e UPDATE direto do perfil negado. A migration
`20260917003928 c087_harden_mode_aware_rls` está preparada, mas não foi executada:
ela requer autorização explícita por alterar RLS, funções, privilégios e triggers
do banco de produção. A flag continua desligada e a C88 continua necessária.

## Questões em aberto

- Antes da C88, decidir formalmente entre manter o DNS externo ou delegar os
  nameservers à Vercel. Sem decisão explícita, manter a configuração funcional.
