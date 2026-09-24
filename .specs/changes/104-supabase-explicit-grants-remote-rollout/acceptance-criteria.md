# Critérios de aceite

- O destino remoto e a ref foram confirmados sem ambiguidade.
- O histórico remoto inicial corresponde às 18 migrations anteriores e, após
  autorização/aplicação, inclui somente a 19ª migration C104 esperada.
- As oito tabelas públicas têm RLS, policies e grants alinhados ao manifesto.
- As doze funções próprias têm segurança, `search_path` e `EXECUTE` mínimos.
- Não há view ou sequence própria não declarada.
- `private` não está exposto pela Data API.
- O Security Advisor não contém erro bloqueante não resolvido.
- O papel `anon` não alcança dados privados.
- O comportamento autenticado e o isolamento entre contas foram comprovados
  sem reativar o provedor Email/senha.
- Fixtures foram removidas e os modos originais restaurados.
- O release gate registra resultado, evidência, limites e rollback.
