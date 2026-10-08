# C116 — Abrir e fechar os modos do Mapa

Autorização em 08/10/2026: corrigir os controles +/− do Mapa Rápido/Avançado e **“cpd”** no projeto existente `mapadapesquisa` / `mapadapesquisa.com.br`.

## Diagnóstico e correção

O formulário público representava somente `quick` ou `advanced`: clicar no − de uma opção abria automaticamente a outra. O dashboard já aceitava o estado fechado. Permitir `null` também no formulário público: + abre a opção escolhida, − fecha a opção ativa e deixa ambas recolhidas. No máximo um modo aberto, como no dashboard; fechar não abre o outro.

Preservar texto e seleção ao recolher/reabrir. Manter Rápido aberto por padrão, Avançado fechado, links explícitos e retomada de rascunho. Com ambas fechadas, mostrar “Abra uma opção para começar”, desabilitar o envio e proteger o handler contra submissão sem modo. Cancelar continuação pendente de sugestão ao recolher/trocar modo.

## Verificação e publicação

Verificar controles reais no navegador, inclusive clique no próprio símbolo: Rápido aberto → fechar → ambos fechados → reabrir; Avançado abrir/fechar/reabrir; texto e seleção mantidos; envio desabilitado quando fechado; Enter/Espaço; desktop e móvel. Registrar regressão comportamental em evidência, sem criar testes que apenas repetem o código.

Gates existentes `npm run check` e `npm run security:gate`; sem chamada paga, modelo, chave, banco, Ads ou TERMO. Versão candidata `v08102026.3`. Rollback: `dpl_3GMByznobpVn94doEqXi59UVc9Xz` (`v08102026.2`). CPD com artefato do commit exato, produção inicialmente sem domínio, smoke, promoção, conferência canônica e Git limpo.
