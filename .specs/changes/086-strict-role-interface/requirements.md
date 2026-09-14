# Requisitos

- Aplicar integralmente a matriz canônica da C82.
- Manter `QuickStartForm`, Mapa Rápido/Avançado e gestão completa de projetos
  próprios nos dashboards Aluno e Orientador.
- Mostrar em cada modo somente projetos próprios cujo `authoring_role`
  corresponda ao perfil ativo.
- Remover lista e entrada de revisão do dashboard Aluno.
- No modo Aluno, manter orientador opcional, envio para supervisão, lembretes e
  leitura das devolutivas.
- No modo Orientador, ocultar `E-mail do orientador`, “Validar como
  orientador”, envio à supervisão e espera de aprovação externa em seus projetos
  próprios; usar o CTA autoral comum “Validar etapa”.
- Separar no dashboard Orientador “Meus projetos” de “Projetos orientados” e
  exibir nesta segunda área somente projetos de estudantes realmente vinculados.
- Impedir abertura direta de workspace incompatível antes de renderizar título
  ou conteúdo.
- Preservar dados invisíveis; nenhuma troca deve excluir ou converter projetos.
- Substituir branches baseados apenas no modo atual, como `isAdvisorOwner`, por
  `isSelfDirectedProject` derivado do `authoring_role` imutável do projeto.
- Permitir edição acadêmica completa do projeto próprio de Orientador, mas
  limitar projeto de estudante vinculado às ações de revisão.
- Manter Configurações, consentimento, suporte, relatos autorizados e logout.
- Atualizar textos, analytics e estados vazios sem misturar Aluno/Orientador.
- Manter tudo sob a feature flag até a C87.
