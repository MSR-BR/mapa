# Change 002 — Implementar fundação do MVP

## Objetivo

Entregar identidade, persistência, autorização e o shell responsivo que sustentam os fluxos do produto.

## Subchanges

1. `002.1` — integrar o Supabase com configuração pública segura.
2. `002.2` — criar o modelo relacional, migrações e políticas RLS.
3. `002.3` — implementar autenticação básica e sessão.
4. `002.4` — implementar a fundação de gerenciamento de projetos.
5. `002.5` — concluir o shell responsivo e validar a change.

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
- [ ] Modelo de custos revisado antes do deployment.
- [ ] Fluxos de identidade completos.
- [ ] Autorização server-side e RLS verificadas.
- [ ] Migrações testadas.
- [ ] Estados da interface cobertos.
- [ ] Testes e documentação atualizados.

## Gate

Cada subchange exige aprovação antes da implementação. A aprovação de 002.1 não autoriza alterações de schema ou ativação de login.
