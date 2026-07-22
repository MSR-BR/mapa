# Change 002 — Implementar fundação do MVP

## Objetivo

Entregar identidade, persistência, autorização e o shell responsivo que sustentam os fluxos do produto.

## Plano reconciliado da Parcela 2

A lista original de dez itens continua sendo a referência de acompanhamento. Durante a execução, alguns itens foram agrupados em cinco subchanges técnicas; o status abaixo restaura a correspondência com o plano original.

| Item | Entrega | Status em 22/07/2026 | Evidência ou pendência |
|---|---|---|---|
| 002.1 | Instalar e configurar Supabase | Concluído | Clientes SSR/browser, ambiente seguro e conexão remota verificada. |
| 002.2 | Criar schema e migração inicial | Concluído | Migração versionada aplicada ao projeto `aeaweherkrqmlqnxsmib`; tipos gerados. |
| 002.3 | Implementar RLS e isolamento por usuário | Concluído | Quatro políticas, negação anônima e teste negativo real com dois usuários aprovados. |
| 002.4 | Cadastro, confirmação e login | Concluído | Cadastro implementado; conta demo criada e confirmada; login real validado até o dashboard. |
| 002.5 | Sessão, logout e recuperação de senha | Concluído | Sessão persistente, logout e solicitação anti-enumeração verificados; entrega SMTP demo limitada pelo plano Free foi registrada como risco residual. |
| 002.6 | Shell responsivo do dashboard | Concluído | Direção híbrida aprovada e implementada; entrada dominante, cards, navegação e estados responsivos. |
| 002.7 | Tratamento de erros e observabilidade | Concluído no escopo da fundação | Estados de erro/carregamento e logs Supabase verificados; observabilidade de produção permanece na Change 006. |
| 002.8 | Testes de autenticação e autorização | Concluído | 15 testes, proteção de rotas, RLS anônima, login, sessão, logout e isolamento com dois usuários aprovados. |
| 002.9 | Auditoria Supabase | Concluído | Advisor de segurança limpo; performance apenas com aviso informativo de índice ainda sem uso. |
| 002.10 | Encerramento e commit da Change 002 | Concluído | Evidências registradas em `closure-evidence.md`; gates finais aprovados. |

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
- [x] Supabase Free definido como limite obrigatório; revisão de uso pré-deployment transferida para a Change 006.
- [x] Fluxos de identidade da fundação completos; limite SMTP gratuito registrado como risco residual.
- [x] Autorização server-side, negação anônima e isolamento RLS com dois usuários verificados.
- [x] Migração aplicada remotamente e reaplicada em PostgreSQL vazio local.
- [x] Estados principais da interface cobertos.
- [x] Testes automatizados e documentação técnica atualizados até a implementação corrente.
- [x] Evidências finais e commit de encerramento registrados.

## Decisão de encerramento

A Change 002 foi **formalmente encerrada em 22/07/2026**. Custos de outros provedores, região final, retenção e LGPD continuam como gates da Change 006. O Supabase deve permanecer no plano Free.

## Gate

Cada subchange exige aprovação antes da implementação. A aprovação de 002.1 não autoriza alterações de schema ou ativação de login.
