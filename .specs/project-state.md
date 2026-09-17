# Estado do projeto

## Blueprint

- Primário: APP v2.3.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: 088 — Homologação E2E e rollout de modos.
- Changes funcionalmente concluídas: 001–087 conforme `.specs/roadmap.md`.
- Change 087 concluída: migrations, correção de `INSERT ... RETURNING`, matriz
  remota, Advisors, flag, CPD e smokes aprovados.
- Change 088 permanece pendente para homologação final observada e gate de
  domínio/DNS/e-mail.

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
- Em produção, a mesma conta pode alternar o modo ativo entre Aluno e Orientador
  nas configurações; a troca não altera a autoria dos projetos existentes.
- O estado-alvo aprovado permite escolher Aluno ou Orientador na mesma conta;
  banco, servidor, interface e RLS aplicam o mesmo modo.
- O modo ativo é persistido no banco, versionado e trocado apenas por RPC; JWT,
  metadata e armazenamento local não são fontes de autorização.
- Ambos os perfis criam projetos Rápidos/Avançados e mantêm sua biblioteca
  própria: projetos de Aluno podem ter supervisão externa; projetos de
  Orientador são autônomos. O Orientador também recebe uma fila separada de
  projetos estudantis vinculados para revisão.
- Cada projeto tem `authoring_role` imutável; trocar o modo nunca altera
  autoria, propriedade, supervisão, vínculo ou conteúdo.
- Avisos acadêmicos orientam sem bloquear; integridade técnica continua
  obrigatória.
- A jornada usa quatro macroetapas e passos internos navegáveis para trás.

## Estado validado mais recente

As Changes 084–087 publicaram autorização centralizada, configurações de modo,
interfaces estritas e RLS consciente do modo. As migrations `20260917003926` e
`20260917003928` foram aplicadas; a validação autenticada revelou uma falha de
`INSERT ... RETURNING`, corrigida por roll-forward em `20260917015508` antes da
ativação. A matriz remota final aprovou 15 verificações, o E2E Aluno–Orientador
foi aprovado e `npm run check` concluiu 119/119 testes com build Next.js 16.3.5.

Security e Performance Advisors apresentaram zero erros; os avisos intencionais
foram documentados. `ACCOUNT_MODE_SWITCH_ENABLED=true` está ativa somente em
Production. O deployment `dpl_2SZj3hikYutHnXpDkSeuEgh5178x`, com commit funcional
`b1cda6c`, está `READY` em `https://mapadapesquisa.com.br`. O seletor foi
confirmado em sessão autenticada, os smokes foram aprovados e não houve log de
erro após a publicação. A C88 continua necessária para a homologação final
observada e o gate independente de domínio/DNS/e-mail.

## Questões em aberto

- Antes da C88, decidir formalmente entre manter o DNS externo ou delegar os
  nameservers à Vercel. Sem decisão explícita, manter a configuração funcional.
