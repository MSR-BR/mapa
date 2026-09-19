# Requisitos

- Exibir a solicitação de e-mail do orientador antes da primeira validação do
  projeto estudantil.
- Permitir criação, edição e salvamento de rascunho sem orientador.
- Bloquear a validação no cliente e no servidor enquanto o e-mail estiver
  ausente.
- Depois do envio, manter a etapa atual até aprovação do orientador.
- Aplicar a mesma defesa às etapas posteriores para projetos estudantis legados.
- Impedir avanço direto pela Data API/RLS sem decisão do orientador.
- Preservar integralmente o fluxo autônomo de projetos com
  `authoring_role=advisor`.
- Não transformar avisos acadêmicos de coerência em bloqueios.
