# Change 002 — Implementar fundação do MVP

## Objetivo

Entregar identidade, persistência, autorização e o shell responsivo que sustentam os fluxos do produto.

## Plano reconciliado da Parcela 2

A lista original de dez itens continua sendo a referência de acompanhamento. Durante a execução, alguns itens foram agrupados em cinco subchanges técnicas; o status abaixo restaura a correspondência com o plano original.

| Item | Entrega | Status em 22/07/2026 | Evidência ou pendência |
|---|---|---|---|
| 002.1 | Instalar e configurar Supabase | Concluído | Clientes SSR/browser, ambiente seguro e conexão remota verificada. |
| 002.2 | Criar schema e migração inicial | Concluído | Migração versionada aplicada ao projeto `aeaweherkrqmlqnxsmib`; tipos gerados. |
| 002.3 | Implementar RLS e isolamento por usuário | Parcial | Quatro políticas de proprietário e negação anônima verificadas; falta teste negativo autenticado com dois usuários. |
| 002.4 | Cadastro, confirmação e login | Concluído | Cadastro implementado; conta demo criada e confirmada; login real validado até o dashboard. |
| 002.5 | Sessão, logout e recuperação de senha | Parcial | Sessão, logout, solicitação e atualização de senha implementados; falta E2E real de recuperação por e-mail. |
| 002.6 | Shell responsivo do dashboard | Concluído | Direção híbrida aprovada e implementada; entrada dominante, cards, navegação e estados responsivos. |
| 002.7 | Tratamento de erros e observabilidade | Parcial | Estados de erro/carregamento e logs Supabase inspecionados; observabilidade estruturada da aplicação fica para preview/deployment. |
| 002.8 | Testes de autenticação e autorização | Parcial | Testes automatizados, proteção de rotas, RLS anônima e login demo aprovados; faltam dois usuários e recuperação E2E. |
| 002.9 | Auditoria Supabase | Concluído | Advisor de segurança limpo; performance apenas com aviso informativo de índice ainda sem uso. |
| 002.10 | Encerramento e commit da Change 002 | Pendente | Requer concluir os testes autenticados restantes, registrar evidências e atualizar o checklist final. |

## Subchanges técnicas executadas

1. `002.1` — integração Supabase.
2. `002.2` — schema relacional e RLS.
3. `002.3` — autenticação e sessão.
4. `002.4` — fundação de gerenciamento de projetos.
5. `002.5` — direção visual e shell responsivo.

## Requisitos

- Cadastro, login, logout, sessão e recuperação de senha.
- Modelo inicial de usuário/projeto e migrações.
- Autorização por proprietário no servidor e no banco por RLS.
- Navegação, layout responsivo, estados vazios e tratamento de erros.
- Logs estruturados e configuração segura.

## Critérios de aceite

- Usuário autenticado acessa o painel; visitante é direcionado à autenticação.
- Usuários não acessam registros alheios, mesmo por chamada direta à API.
- Recuperação de senha não revela se o e-mail existe.
- Navegação funciona em móvel, tablet, desktop e teclado.
- Migrações podem ser aplicadas em banco vazio.

## Arquivos a modificar

- Rotas de autenticação e dashboard.
- Módulos `auth` e `projects`.
- Schema e migrações do banco.
- Componentes de layout, segurança e observabilidade.
- Testes correspondentes.

## Testes a executar

- Unitários de autorização e validação.
- Integração de autenticação e banco.
- E2E de cadastro, login e recuperação.
- Acessibilidade e responsividade do shell.
- Build de produção.

## Checklist de conclusão

- [x] Provedores Supabase e Vercel aprovados.
- [ ] Modelo de custos revisado antes do deployment — pendência deliberadamente transferida para a Change 006.
- [ ] Fluxos de identidade completos — falta recuperação por e-mail ponta a ponta.
- [ ] Autorização server-side e RLS verificadas — falta isolamento autenticado com dois usuários.
- [ ] Migrações testadas — aplicada no projeto remoto; falta reaplicação controlada em banco vazio/ambiente descartável.
- [x] Estados principais da interface cobertos.
- [x] Testes automatizados e documentação técnica atualizados até a implementação corrente.
- [ ] Evidências finais e commit de encerramento registrados.

## Decisão de encerramento

A Change 002 permanece **implementada, mas não formalmente encerrada**. Custos, região final, retenção e LGPD não bloqueiam o desenvolvimento local; serão gates obrigatórios da Change 006. Para encerrar a Change 002, executar apenas:

1. teste de isolamento com dois usuários autenticados;
2. teste real do fluxo de recuperação de senha;
3. teste controlado da migração em ambiente vazio ou descartável;
4. revisão móvel autenticada e registro das evidências;
5. atualização final dos checklists e commit de encerramento.

## Gate

Cada subchange exige aprovação antes da implementação. A aprovação de 002.1 não autoriza alterações de schema ou ativação de login.
