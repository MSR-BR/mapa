# Matriz canônica de recursos por modo

| Superfície ou ação | Aluno | Orientador | Comum |
|---|---:|---:|---:|
| Criar mapa rápido/avançado | Sim | Sim | Não |
| Ver/editar/excluir projeto próprio do perfil ativo | Sim | Sim | Não |
| Informar ou alterar orientador | Sim | Não | Não |
| Gerar, navegar e validar etapas próprias | Sim | Sim | Não |
| Integrar ou exportar projetos próprios | Sim | Sim | Não |
| Enviar etapa e lembrete ao orientador | Sim | Não | Não |
| Concluir o fluxo autoral do projeto próprio | Sim | Sim | Não |
| Listar projetos vinculados para revisão | Não | Sim | Não |
| Ler conteúdo de projeto vinculado | Não | Sim | Não |
| Comentar, solicitar correção ou aprovar | Não | Sim | Não |
| Reenviar lembrete ao estudante vinculado | Não | Sim | Não |
| Configurações e troca de modo | Não | Não | Sim |
| Perfil, consentimento, suporte e logout | Não | Não | Sim |
| Administração de relatos, quando autorizada | Não | Não | Sim |

## Regras adicionais

- Projetos criados como Aluno aparecem na biblioteca Aluno; projetos criados
  como Orientador aparecem na biblioteca Orientador.
- Projeto criado como Orientador é autônomo: não possui orientador, envio para
  supervisão nem espera de aprovação externa.
- Projetos vinculados ficam preservados, mas invisíveis e inacessíveis enquanto
  a conta estiver no modo Aluno.
- Trocar o modo não altera `owner_id`, `authoring_role`, `advisor_id`,
  conteúdo, status nem regras de supervisão.
- A mesma conta não pode ser orientadora de um projeto que ela própria possui.
- Administração por e-mail continua independente do modo Aluno/Orientador.
