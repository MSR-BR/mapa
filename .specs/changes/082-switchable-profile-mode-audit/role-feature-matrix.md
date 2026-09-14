# Matriz canônica de recursos por modo

| Superfície ou ação | Aluno | Orientador | Comum |
|---|---:|---:|---:|
| Criar mapa rápido/avançado | Sim | Não | Não |
| Ver/editar/excluir projeto próprio | Sim | Não | Não |
| Informar ou alterar orientador | Sim | Não | Não |
| Gerar, navegar e validar etapas próprias | Sim | Não | Não |
| Integrar ou exportar projetos próprios | Sim | Não | Não |
| Enviar etapa e lembrete ao orientador | Sim | Não | Não |
| Listar projetos vinculados para revisão | Não | Sim | Não |
| Ler conteúdo de projeto vinculado | Não | Sim | Não |
| Comentar, solicitar correção ou aprovar | Não | Sim | Não |
| Reenviar lembrete ao estudante vinculado | Não | Sim | Não |
| Configurações e troca de modo | Não | Não | Sim |
| Perfil, consentimento, suporte e logout | Não | Não | Sim |
| Administração de relatos, quando autorizada | Não | Não | Sim |

## Regras adicionais

- Projetos próprios ficam preservados, mas invisíveis e inacessíveis enquanto a
  conta estiver no modo Orientador.
- Projetos vinculados ficam preservados, mas invisíveis e inacessíveis enquanto
  a conta estiver no modo Aluno.
- Trocar o modo não altera `owner_id`, `advisor_id`, conteúdo ou status.
- A mesma conta não pode ser orientadora de um projeto que ela própria possui.
- Administração por e-mail continua independente do modo Aluno/Orientador.
