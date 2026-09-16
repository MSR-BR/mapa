# Estado do projeto

## Blueprint

- Primário: APP v2.1.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: 083 — migration e validação remota aprovadas; CPD pendente.
- Changes funcionalmente concluídas: 001–083 conforme `.specs/roadmap.md`.
- Changes pendentes: CPD da 083 e execução sequencial de 084–088.

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

A Change 083 instalou a fundação versionada de modos no Supabase de produção.
A migration `20260916163351 account_mode_database_foundation` foi registrada
como a 14ª migration. Treze perfis e 65 projetos foram migrados; seis
auto-orientações redundantes foram removidas e uma supervisão externa foi
preservada como autoria histórica de Aluno. A trilha de eventos está protegida
por RLS, a RPC de troca continua sem EXECUTE e nenhuma interface de troca foi
liberada. Advisors, E2E, smokes, build e domínio foram aprovados.

## Questões em aberto

- Executar CPD da Change 083 antes de iniciar a 084.
- Antes da C88, decidir formalmente entre manter o DNS externo ou delegar os
  nameservers à Vercel. Sem decisão explícita, manter a configuração funcional.
