# Evidência de auditoria — Change 055

Data: 26/08/2026  
Versão de código: `v26082026.3`

## Verificações

- `npm run gemini:verify`: aprovado.
- `npm run supabase:verify`: aprovado.
- `npm run research-starter:verify`: bloqueado por `HTTP 401 unauthorized`.
- Logs de produção confirmaram `research_starter_request_failed` com código
  `unauthorized` na chamada de descoberta.
- O endpoint do Research Starter está acessível; a falha não é DNS ou rota.
- Deploy de produção concluído em `https://mapadapesquisa.com.br`:
  `dpl_68MgpUAp7Daha5e6u4ZnBEzkXsx8` (estado `READY`).
- Smoke checks pós-deploy: `/login` e `/api/health` responderam `200`; o
  health-check confirmou `x-health-status: ok`.
- O deploy atual inclui a correção do Mapa Rápido e mantém o fluxo avançado;
  o código de produção está na versão `v26082026.3`.
- Correção pós-auditoria: o Mapa Rápido passou a preencher `title` e
  `problemStatement` no servidor antes de `parseProjectForm`; o clique em
  **Gerar mapa** não é mais rejeitado por campos clássicos ausentes.

## Resultado

O defeito de diagnóstico e a duplicação do briefing foram corrigidos no código.
A geração com referências permanece bloqueada até a atualização da chave do
Research Starter em produção. Após a troca, executar novamente
`npm run research-starter:verify` e o botão **Tentar novamente**.

Change 055 permanece **em andamento** enquanto a chave válida não for
configurada no ambiente Production da Vercel.
