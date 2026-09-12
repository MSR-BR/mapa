# Evidência de fechamento — Change 072

## Resultado

- O modelo padrão foi alterado de `gemini-2.5-flash`, indisponível para a chave atual, para `gemini-3.6-flash`.
- Todas as 13 chamadas de geração migraram de `thinkingBudget: 0`, configuração do Gemini 2.5, para `thinkingLevel: "minimal"`, compatível com Gemini 3.
- `GEMINI_MODEL` permite substituir o modelo no servidor sem publicar a configuração no navegador; sem override, o padrão validado é usado.
- O prompt e o schema da metodologia continuam exigindo um título final produzido pela IA, com limite de até 240 caracteres.

## Diagnóstico das integrações

- A listagem de modelos da conta confirmou `gemini-3.6-flash` com suporte a `generateContent`.
- O modelo antigo respondeu 404 e informou que não estava disponível para novos usuários.
- O smoke de Gemini 3.6 com `thinkingBudget: 0` respondeu 400; com `thinkingLevel: "minimal"`, texto e JSON estruturado passaram.
- O `401` do Research Starter foi isolado à variável legada no ambiente local. A credencial dedicada de produção permaneceu protegida pela Vercel e a rota autenticada do Mapa respondeu 200 com relatório `partial` e 3 referências.
- O arquivo temporário de variáveis foi removido imediatamente após a Vercel substituir os segredos por marcadores protegidos.

## Check

Em 11/09/2026, concluíram com sucesso:

- `npm run gemini:verify`: saída estruturada compatível com schema 1.0.0 no modelo `gemini-3.6-flash`;
- geração real de metodologia: 4 linhas e título final de IA com 49 caracteres;
- `npm run check`: lint, typecheck, 85 testes, verificação de exportações e build;
- smokes no domínio canônico: health 200, sugestões Gemini 200 com 3 itens e Research Starter autenticado 200;
- logs do deployment: nenhum evento de nível `error` na janela pós-publicação.

## Deploy

- Deployment: `dpl_BeNtfChz7iKdcneZHyD69LhmRodY`;
- URL imutável: `https://mapadapesquisa-9m4xuq3sn-msr-brs-projects.vercel.app`;
- domínio canônico promovido: `https://mapadapesquisa.com.br`;
- estado verificado pela Vercel: `READY`, target `production`.
