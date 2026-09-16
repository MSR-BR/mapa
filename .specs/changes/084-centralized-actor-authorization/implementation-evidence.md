# Evidências de implementação — Change 084

Data da validação local: 2026-09-16.

## Implementação

- O contexto canônico do ator usa `getClaims()` para a sessão e lê modo,
  versão e consentimento no banco, sem fallback para Aluno.
- Perfil ausente, perfil inválido e falha de consulta são estados distintos e
  falham de modo fechado.
- A política central combina modo ativo, `owner_id`, `authoring_role`,
  `advisor_id` e capacidade solicitada.
- As 14 rotas de `app/api/projects/**` usam os wrappers centrais; nenhuma
  delas depende de `requireAuthenticatedUser` ou de papel vindo do cliente.
- Criação rápida/avançada, edição, duplicação, exclusão, geração, integração e
  exportação aceitam autoria própria nos dois modos quando modo e autoria
  coincidem.
- Vínculo e troca de orientador e os cinco pontos de envio à supervisão usam
  `student_supervision`.
- Revisão e lembrete do Orientador exigem projeto de Aluno e vínculo real em
  `advisor_id` no modo estrito; o fallback por e-mail permanece somente com
  a flag desligada.
- Projetos próprios de Orientador seguem o ciclo de autoria sem supervisão.
- O consentimento ignora o papel do formulário e grava apenas
  `actor.activeRole`.
- Erros de autenticação, modo, recurso e concorrência usam respostas tipadas
  401, 403, 404 e 409, sem expor dados do projeto sem relação.
- `ACCOUNT_MODE_SWITCH_ENABLED=false` permanece como padrão. A C84 não foi
  publicada nem habilitada nesta etapa.

## Validação local

- `npm run check`: aprovado.
- Lint e TypeScript: aprovados.
- Testes: 102 aprovados, incluindo a nova matriz de ator e endpoints.
- Exportação: aprovada.
- Build Next.js 16.3.5: aprovado.
- `npm run security:audit`: aprovado em 521 arquivos; 14 de 14 rotas de
  projeto usam autorização central.
- `git diff --check`: aprovado.
- A ressalva informativa do auditor permanece: smokes remotos com duas contas
  dependem das credenciais de teste e serão executados no rollout posterior.

## Estado de entrega

Implementação e validação local concluídas. Commit, push e deploy da C84
permanecem pendentes; a produção continua na versão publicada ao fechar a C83.
