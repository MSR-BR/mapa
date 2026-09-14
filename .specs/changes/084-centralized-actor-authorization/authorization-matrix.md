# Matriz de autorização server-side

## Autoria própria — Aluno ou Orientador

- Server Actions: criar, editar, duplicar e excluir.
- APIs: `generation`, `generate`, `discover`, `proposal-selection`,
  `definition`, `chapters`, `methodology`, `final-map`, `navigation`,
  `references`, `integrate` e `exports`.
- Requisitos: `owner_id = auth.uid()` e
  `project.authoring_role = actor.active_role`.
- Criação deriva `authoring_role` no servidor/banco. Duplicação preserva o
  valor. Integração aceita apenas fontes do perfil ativo e a saída o herda.

## Aluno obrigatório

- Definir ou trocar orientador, enviar etapa para supervisão e reenviar lembrete
  ao orientador.
- Requisitos adicionais: propriedade e `authoring_role=student`.

## Orientador obrigatório

- API de comentário, correção e aprovação de revisão.
- Requisitos adicionais: projeto `authoring_role=student` e vínculo por
  `advisor_id`; compatibilidade temporária por e-mail só até a reivindicação
  atômica do vínculo.
- Projeto próprio `authoring_role=advisor` usa o fluxo integral de autoria,
  sem as APIs de revisão ou supervisão.

## Bifurcado

- Reenvio de lembrete: Aluno+proprietário envia ao orientador;
  Orientador+vínculo envia ao estudante.

## Comum ou fora da matriz de perfil

- Login, callback, recuperação de senha, configurações, consentimento, suporte,
  relato de problema e health.
- Administração de relatos mantém sua autorização administrativa própria.
