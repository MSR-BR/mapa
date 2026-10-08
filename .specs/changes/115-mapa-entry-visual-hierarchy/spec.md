# C115 — Hierarquia visual da entrada do Mapa

**Estado:** concluída e publicada em `v08102026.2`. [CPD e evidências](cpd-2026-10-08.md).

Autorização de 08/10/2026: o responsável pediu menos caixas aninhadas, cores/tonalidades diferentes para área externa, Mapa Rápido e Avançado, e **“cpd”**. Implementação e publicação no projeto existente `mapadapesquisa`, domínio `mapadapesquisa.com.br`.

## Escopo aprovado

- Área externa em verde acinzentado, Avançado em verde claro e Rápido em azul suave.
- Remover a moldura intermediária escura e as caixas decorativas de produto/perguntas; preservar os contornos dos controles, foco visível e estado selecionado.
- Textos escuros e campos claros, com contraste AA. Os rótulos/ícones continuam distinguindo os modos sem depender somente de cor.
- Ajuste adicional solicitado durante a execução: Avançado fechado por padrão, Rápido aberto em `/mapa`; `?modo=avancado` abre Avançado explicitamente. Retomada de rascunho existente continua preservada.
- CSS limitado a `.mapa-entry-form`. Sem mudar conteúdo, geração, persistência, IA, autenticação, dados, dashboard, Ads ou TERMO.

## Aceite e release

Conferir os dois modos, troca preservando texto, seleção, ajuda/foco e ausência de overflow em 320/390/1280 px. Não criar testes de lógica para alteração exclusivamente visual; executar os gates existentes (`npm run check`, `npm run security:gate`) e inspecionar o CSS compilado/produção.

Versão candidata `v08102026.2`. Rollback: deployment C114 `dpl_FEYPqXiH4EAP1A9HpKYU2Mz3QB1b` (`v08102026.1`). Sem migration ou chamada paga. Registrar candidato exato, publicação, verificação e fechamento em `cpd-2026-10-08.md`.
