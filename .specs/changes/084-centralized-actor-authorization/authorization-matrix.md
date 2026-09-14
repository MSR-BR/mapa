# Matriz de autorização server-side

## Aluno obrigatório

- Server Actions: criar, editar, duplicar, excluir e definir orientador.
- APIs: `generation`, `generate`, `discover`, `proposal-selection`,
  `definition`, `chapters`, `methodology`, `final-map`, `navigation`,
  `references`, `integrate` e `exports`.
- Requisito adicional: `owner_id = auth.uid()`.

## Orientador obrigatório

- API de comentário, correção e aprovação de revisão.
- Requisito adicional: vínculo por `advisor_id`; compatibilidade temporária por
  e-mail só até a reivindicação atômica do vínculo.

## Bifurcado

- Reenvio de lembrete: Aluno+proprietário envia ao orientador;
  Orientador+vínculo envia ao estudante.

## Comum ou fora da matriz de perfil

- Login, callback, recuperação de senha, configurações, consentimento, suporte,
  relato de problema e health.
- Administração de relatos mantém sua autorização administrativa própria.
