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

## Produção

- C106 inicial `20f9db5` / `v01102026.2` foi publicada e passou no smoke.
  Uma revisão de interface apontou dois detalhes menores corrigidos no commit
  final `71b1e16824339ffc1ff4abad8dc47d1b35a5378a`.
- Commit final: `npm run check` e `npm run security:gate` aprovados; o teste
  Chromium/WebKit agora inclui retorno automático à aba de contexto após sucesso.
- Deployment `dpl_C3gTCk8DzC5uUfwWjsE8oLYMYS5P` ficou READY com domínio
  inicialmente inalterado; health imutável `ok` em `v01102026.3`, login 200,
  mutação sem sessão 401 e origem externa 403. Depois foi promovido.
- Domínio `https://mapadapesquisa.com.br`: health `ok`, versão
  `v01102026.3`, quatro provedores configurados, home/login 200, API anônima
  401 e cross-site 403. Navegador isolado confirmou o login com Google.
- UI privada foi provada localmente pelo componente real em quatro cenários;
  não houve E2E autenticado em produção nem chamada real ao Gemini nesta change.
