# Validação

- 28 cenários aprovados: Chromium/WebKit × 320/390/768/900/1024/1280/1440 px
  × Aluno/Orientador. Formulário e CSS reais, dados fictícios.
- Medidos: largura útil, limites do viewport, ausência de interseção entre
  texto/orientações, ações abaixo dos campos e popup contido na tela.
- Interações: contexto/pedido, Escape, adicionar/remover/promover objetivo.
- Capturas desktop 1440, tablet 900 e WebKit mobile 390 inspecionadas.
- Nenhuma conta, banco ou chamada real de IA envolvida.
- `npm run check`: lint, tipos, 156 testes, exportações e build aprovados.
- `npm run security:gate`: `PASS_WITH_ACCEPTED_RISK`, zero vulnerabilidades
  npm; permanecem somente os riscos transversais já registrados no perfil S3.
- Revisão do diff: apenas JSX/CSS, versão pública e teste/documentação; nenhum
  handler de persistência, geração, autenticação ou autorização foi alterado.
- Rollback de interface: deployment anterior `dpl_C3gTCk8DzC5uUfwWjsE8oLYMYS5P`.
- Deployment READY e promovido após health `ok`/versão `.4`, login 200 e
  negação anônima 401. Domínio canônico confirmou home/login 200, CSS novo,
  versão `.4`, anônimo 401 e cross-site 403. Detalhes no CPD.
