# Estado do projeto

## Blueprint

- Primário: APP v2.1.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change atual: nenhuma.
- Changes concluídas: 001–082 conforme `.specs/roadmap.md`.
- Changes pendentes: 083–088, aguardando aprovação e execução sequencial.

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

A Change 082 concluiu somente a auditoria e o planejamento de modos alternáveis.
Foram identificadas dependências do contrato imutável, lacunas de autorização e
RLS, definida a arquitetura-alvo e criadas as Changes 083–088. A arquitetura foi
refinada para preservar autoria completa e autônoma do Orientador, separada da
revisão vinculada. Nenhum código de produto, migration, dado, ambiente ou
deployment foi alterado; o último estado funcional publicado continua sendo a
C81 no deployment
`dpl_G8kNnBN9DayztcX1VM3U9EbuwUUU`.

## Questões em aberto

- Aprovação explícita para iniciar a Change 083.
- O conector Supabase recusou consultas somente leitura por falta de permissão;
  o preflight remoto deve ser concluído antes de qualquer DDL da C83.
- Antes da C88, decidir formalmente entre manter o DNS externo ou delegar os
  nameservers à Vercel. Sem decisão explícita, manter a configuração funcional.
