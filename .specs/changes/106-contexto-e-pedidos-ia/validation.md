# Validação — C106

- Teste puro de escopo, duplicação e limites de pedidos pontuais e contexto.
- Teste do componente/CSS reais em Chromium e WebKit, desktop e celular, sem rede externa ou conta.
- `npm run check` e `npm run security:gate`.
- Smoke pós-deploy: versão, health, login público e proteção de API anônima.
- Não equivale a E2E autenticado do ciclo Aluno–Orientador nem prova qualitativa da resposta do Gemini.

## Resultado local inicial

- `npm run check`: passou com lint, tipos, grants locais, **156/156 testes**,
  exportações DOCX/PDF e build Next.js 16.3.8.
- `npm run security:gate`: `PASS_WITH_ACCEPTED_RISK`, zero vulnerabilidades
  no `npm audit`; riscos transversais conhecidos mantidos.
- `scripts/verify-ai-guidance-ui.mjs`: **4/4** cenários Chromium/WebKit ×
  1280/390 px, tabs, preservação de valores, popup ⓘ, Escape e sem overflow.
