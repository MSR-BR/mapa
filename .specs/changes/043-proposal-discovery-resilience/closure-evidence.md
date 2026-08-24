# Evidências de encerramento — Change 043

- O cliente do Research Starter passou a tratar JSON inválido, 408, 429,
  5xx, timeout e ausência de configuração com erros tipados.
- O serviço de descoberta normaliza URL, autores, DOI, ano, venue e abstract
  antes de validar o contrato persistido.
- O gerador de propostas repete uma vez a resposta estruturada com instruções
  de reparo; referências não verificadas continuam sendo rejeitadas.
- A rota de descoberta registra a etapa, retorna mensagens específicas e
  sinaliza que o briefing foi preservado para a nova tentativa.
- A interface mostra retry sem duplicar o estado vazio e mantém o pedido original
  visível.
- O smoke externo do Research Starter retornou `status=partial`, 3 referências e
  confiança média. O smoke do Gemini retornou HTTP 429 `RESOURCE_EXHAUSTED` por
  créditos pré-pagos esgotados; o app agora expõe esse bloqueio com mensagem
  específica e `retryable=false`.
- Versão: `v23082026.2`.
