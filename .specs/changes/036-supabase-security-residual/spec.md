# Change 036 — Auditoria Supabase e segurança residual

## Objetivo

Fechar os itens remanescentes da auditoria de segurança diretamente no projeto
Supabase e nos controles de produção, sem ampliar permissões nem expor dados.

## Submudanças

1. Confirmar que todas as migrations de endurecimento foram aplicadas no projeto
   remoto correto.
2. Validar RLS com as duas contas E2E reais: estudante proprietário e orientador
   vinculado, além do caminho anônimo.
3. Registrar a disponibilidade das políticas de senha/autenticação no plano
   contratado, sem exigir recursos exclusivos de planos pagos.
4. Revisar funções `SECURITY DEFINER`, `search_path`, grants e acesso anônimo.
5. Validar rate limiting da aplicação para sugestões e suporte.
6. Revisar a regra global do Vercel Firewall, mantendo primeiro modo de
   observação e publicando somente após analisar falsos positivos.
7. Executar `npm run security:audit`, testes, build e smoke test público.
8. Atualizar o relatório com evidência da execução remota e riscos residuais.

## Critérios de aceite

- Usuários não conseguem ler, editar, excluir ou integrar projetos alheios.
- A migration remota aparece aplicada no projeto Supabase `aeaweherkrqmlqnxsmib`.
- Não há segredo em código, logs, bundles ou variáveis públicas.
- Limites de requisição e firewall têm comportamento documentado.
- Toda exceção ou bloqueio permanece registrado como risco residual explícito.

## Execução e evidências — 20–21/08/2026

### Controles aprovados

- `npm run security:audit` — aprovado: nenhum segredo rastreado, variáveis
  públicas sem credenciais, RLS detectado nas seis tabelas públicas, rotas de
  projeto autenticadas, cabeçalhos/CSP/CSRF e regras de privacidade aprovados.
- `npm run supabase:verify-rls` — aprovado: acesso anônimo a `projects` e
  `research_workflows` negado.
- `npm run supabase:verify-authenticated-rls` — aprovado: o orientador não
  conseguiu ler, editar ou excluir o projeto/workflow fora do vínculo do fluxo.
  O fluxo proprietário–orientador vinculado também foi validado com as contas
  E2E da C35/C039; o caminho anônimo foi validado separadamente.
- Data API remota — `projects`, `generation_jobs`, `research_structures`,
  `research_workflows`, `user_profiles` e `legal_consents` responderam `200`
  no projeto configurado.
- Rate limiting dinâmico — aprovado: 15 sugestões/minuto e 5 suportes/hora;
  a requisição seguinte é bloqueada com `Retry-After` positivo.
- `npm run check` — aprovado: lint, typecheck, 61 testes, verificação de
  exportação PDF e build de produção.
- Smoke público — aprovado: `https://mapadapesquisa.com.br/` e
  `/api/health` responderam `HTTP 200` com CSP, HSTS, `X-Frame-Options`,
  `nosniff` e `Referrer-Policy` presentes.

### Atualização da C039 — 21/08/2026

- `npm run supabase:verify-authenticated-rls` foi repetido com as contas E2E de
  estudante e orientador; isolamento entre projetos e workflows foi confirmado.
- `npm run supabase:verify-advisor-student` foi repetido e confirmou o fluxo
  completo de vínculo, revisão, correção, aprovações e limpeza do projeto
  temporário.
- As duas contas E2E existentes são suficientes para o escopo do piloto; não foi
  criada uma terceira conta permanente.

### Bloqueios externos mantidos explícitos

- A aplicação remota das 9 migrations foi confirmada pelo CLI com
  `npx supabase migration list`; a coluna **Remote** está preenchida até
  `20260819100000`.
- A consulta MCP de advisors Supabase continua retornando `permission denied`
  pelo conector, mas a mesma verificação foi executada com sucesso pela CLI
  autenticada (`npx supabase db advisors`). Os únicos avisos restantes são os
  dois RPCs `SECURITY DEFINER` intencionais, concedidos somente a
  `authenticated`, e a proteção de senhas vazadas fora do escopo do plano Free.
- O endpoint público `/auth/v1/settings` confirmou que e-mail e Google estão
  ativos e que cadastro não está desabilitado. A proteção contra senhas vazadas
  é um recurso exclusivo de planos pagos e, portanto, não faz parte do escopo
  do piloto no plano Free; não será tratada como falha ou pendência desta
  Change.
- O conector Vercel não encontrou o projeto `mapadapesquisa` (404), mas o CLI
  autenticado (`msr-br`) confirmou e publicou a regra `Monitor prompt
  suggestions` em produção: `POST /api/prompt-suggestions`, 100 requisições por
  IP a cada 60 s, ação `log`. Não há alterações pendentes (`hasDraft=false`).

### Estado da change

**Concluída em 21/08/2026 — migrations, controles de aplicação, RLS remoto,
Firewall, build, smoke, autenticação aluno–orientador, E2E e advisor via CLI
aprovados.** O bloqueio do conector MCP não impede a auditoria equivalente, e a
proteção de senhas vazadas está fora do escopo do plano Free. Nenhum dado de
usuário permanente foi criado ou alterado durante esta auditoria.
esta auditoria.
