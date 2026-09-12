# Evidência de fechamento — Change 065

## Implementação

- `ResearchPromptInput` comunica explicitamente a sugestão selecionada.
- No dashboard, a seleção aguarda o estado do campo e submete o mesmo formulário de criação usado pelo botão “Gerar mapa”.
- Na home pública, a seleção aguarda o estado do campo e aciona o mesmo envio que preserva o rascunho antes do login.
- Erros locais anteriores são limpos ao selecionar uma nova sugestão.

## Check local

Em 11/09/2026, `npm run check` foi concluído com sucesso: lint, typecheck, 78 testes, verificação de exportações e build de produção.

## Limite de publicação

A Change 065 foi publicada em produção em 11/09/2026.

- Deploy: `dpl_FbQnd62arhA6u9CL21WRq7tBZKmt`
- URL de inspeção: `https://vercel.com/msr-brs-projects/mapadapesquisa/FbQnd62arhA6u9CL21WRq7tBZKmt`
- Produção: `https://mapadapesquisa.com.br`
- Health check: `status: ok`; Gemini, Resend, Research Starter e Supabase configurados.
