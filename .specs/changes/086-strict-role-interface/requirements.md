# Requisitos

- Aplicar integralmente a matriz canônica da C82.
- Remover criação, projetos próprios, integração, duplicação, exclusão e edição
  do dashboard Orientador.
- Remover lista e entrada de revisão do dashboard Aluno.
- Ocultar `E-mail do orientador` e qualquer ação de aluno no modo Orientador.
- Exibir no Orientador somente projetos de terceiros realmente vinculados.
- Impedir abertura direta de workspace incompatível antes de renderizar título
  ou conteúdo.
- Preservar dados invisíveis; nenhuma troca deve excluir ou converter projetos.
- Eliminar o conceito `isAdvisorOwner` dos workspaces de criação.
- Manter Configurações, consentimento, suporte, relatos autorizados e logout.
- Atualizar textos, analytics e estados vazios sem misturar Aluno/Orientador.
- Manter tudo sob a feature flag até a C87.
