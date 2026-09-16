# Evidências de implementação — Change 084

Data da validação e publicação: 2026-09-16.

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
- `ACCOUNT_MODE_SWITCH_ENABLED=false` permanece como padrão; a variável não
  está definida em Production e, portanto, a troca de modo continua desligada.

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

## CPD e produção

- Implementação principal: commit `76999b2` (`feat: centralize account mode authorization`).
- Hotfix de redirecionamento sem sessão: commit `7e62bf5`
  (`fix: handle unauthenticated dashboard render`).
- Branch publicada: `codex/change-003-004`.
- Deployment final: `dpl_CXCa1RFjZRaGWTD5yysKNy6PCkFg`, estado `READY`,
  alvo `production`.
- URL técnica:
  `https://mapadapesquisa-mu497ugid-msr-brs-projects.vercel.app`.
- Domínio canônico: `https://mapadapesquisa.com.br`.
- Build remoto: Next.js 16.3.5, compilação, TypeScript e 20 páginas estáticas
  aprovados; build concluído em 15 s.
- Smoke: raiz `200`; `/api/health` com `status: ok`; `/dashboard` sem sessão
  retorna `307` para `/login`; API protegida retorna `401` com
  `authentication_required`.
- Varredura de logs após o smoke: nenhum erro encontrado.

## Estado de entrega

Implementação, validação, commit, push e deploy da C84 concluídos. A troca de
modo permanece deliberadamente desativada até a C85.
