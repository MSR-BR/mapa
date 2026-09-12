# Evidência de fechamento — Change 070

## Resultado

- O contador de tópicos associados considera apenas tópicos existentes no capítulo correto.
- IDs duplicados e órfãos em linhas metodológicas são removidos na reconciliação.
- A abertura/salvamento da metodologia e o mapa final normalizam vínculos antigos sem remover tópicos válidos.

## Check

Em 11/09/2026, `npm run check` concluiu: lint, typecheck, 83 testes, verificação de exportações e build.

## Produção

- Deploy: `dpl_7VBunUaSPEq5kd114M4wazXN3Kuu`
- Inspeção: `https://vercel.com/msr-brs-projects/mapadapesquisa/7VBunUaSPEq5kd114M4wazXN3Kuu`
- Produção: `https://mapadapesquisa.com.br`
- Health check: `status: ok`; Gemini, Resend, Research Starter e Supabase configurados.
