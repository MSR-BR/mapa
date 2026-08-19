# Evidências de encerramento — Change 031

- Versão: `v19082026.4`.
- O fluxo real retornou `?code=` para `/`, demonstrando a necessidade do
  fallback de troca de sessão na página raiz.
- A raiz encaminha o código ao callback oficial, que usa
  `exchangeCodeForSession` em um Route Handler capaz de persistir cookies.
- A configuração de Redirect URL do Supabase deve conter
  `https://mapadapesquisa.com.br/auth/callback`.
