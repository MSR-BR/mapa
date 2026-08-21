# Change 040 — Paridade dos modos de entrada na home

**Estado:** Concluída em 21/08/2026.

## Objetivo

Alinhar a tela pública inicial ao dashboard, preservando a hierarquia aprovada
dos modos de criação e o contraste visual entre os subcards.

## Escopo

- Exibir `Mapa Avançado` como Opção 1 recomendada.
- Exibir `Mapa Rápido` como Opção 2.
- Manter a Opção 1 aberta por padrão e a Opção 2 recolhida.
- Aplicar os estilos `public-mode-card-advanced` e
  `public-mode-card-quick` também na home.
- Preservar a retomada do briefing e o login somente após a execução pública.

## Gate de saída

- Testes de fundação atualizados para os rótulos e classes da home.
- Suíte de testes e build aprovados.
- Deploy de produção publicado no domínio canônico.
