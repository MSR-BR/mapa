# Arquivos criados ou modificados

## Interface e autorização

- `app/dashboard/layout.tsx`: fornece ao cliente somente o papel ativo e a
  versão corrente do perfil.
- `app/dashboard/page.tsx`: separa biblioteca própria e projetos orientados,
  com filtros por `authoring_role` e vínculo efetivo.
- `app/dashboard/projects/[id]/page.tsx`: autoriza antes de buscar conteúdo e
  deriva autonomia do papel imutável do projeto.
- `modules/profile/active-profile-context.tsx`: DTO cliente mínimo e cabeçalho
  de concorrência para mutações.
- `modules/projects/actions.ts`: impede tentativa de supervisão em projeto
  autônomo de Orientador.
- Componentes de formulário, cards e painel de orientação em
  `modules/projects/`.

## Fluxo acadêmico e observabilidade

- Workspaces de geração, descoberta, definição, capítulos, metodologia,
  navegação, referências, revisão e mapa final.
- `modules/analytics/analytics.ts` e
  `modules/profile/account-mode-settings.tsx`: papel real e evento
  `profile_mode_changed` sem PII.
- `docs/operations.md`: contrato operacional do novo evento.

## Testes

- `tests/strict-role-interface.test.ts`: matriz Aluno/Orientador, isolamento de
  URL, autonomia, propagação de versão e analytics.
- `tests/foundation.test.mjs`: expectativas legadas atualizadas para o
  vocabulário aprovado.
- `package.json`: nova suíte incluída em `npm test`.
