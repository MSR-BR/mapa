# C123 — Medição, atribuição, SEO e acessibilidade

Autorização de 20/10/2026: executar exclusivamente a Ordem 2, sem commit,
push, deploy ou alterações em Ads, GA4 e Supabase remoto. Base: C122,
`7fbd8e4a7fe95acd3a88fd23ad0dd621c9cc5e0c`. Preservar auditoria e handoffs.

## Estado

`LOCAL_REVIEW_READY_WITH_PENDING_ITEM`; `PUBLICATION_STATE: NOT_REQUESTED`.
GA-01…04, SEO-01 e UX-01/02 implementados e testados. UX-06 com WebVTT do
roteiro preparado, transcrição/sincronização do vídeo ainda pendente.
[Validação](validation-2026-10-20.md) e [diff de código/testes](local-changes.patch).

## Aceite

- GA-01: classificar erros por resposta/erro real nos cinco fluxos; uma tentativa
  de descoberta em repetição emite somente generation_retry, sem generation_started.
- GA-02/03: início somente no envio do formulário Google; sucesso somente após
  SIGNED_IN e uma tentativa iniciada, sem contar sessões existentes.
- GA-04: nove parâmetros permitidos, caracteres ponto/espaço/percentual,
  duplicatas rejeitadas; retenção sanitizada por aba até o primeiro page_view.
  Sem eventos nem carregamento da tag antes de consentimento.
- SEO-01: metadados completos de /mapa, preservando canonical e indexação.
- UX-01/02: entrada rápida nomeada sem foco automático, consentimento acessível
  com foco contido/restaurado, rolagem e botão Aceitar métricas.
- UX-06: arquivo WebVTT derivado da narração documentada, sem inventar falas;
  explicitar qualquer diferença entre roteiro e mídia recebida.
- Regressões locais, npm run check e diff revisável, sem publicação.

## Método e limites

Pó Mágico v20261020.002, HEAD local/remoto
81e3cbef9fc2b5b29074297490351f681ed16b47 confirmado em 20/10 (somente leitura).
Checkpoints start/classification/phase/Change: APP, medição e privacidade;
implementação autorizada, validação local e entrega sem commit. Modelo: Codex
(GPT-6; variante/esforço não expostos). Guias Next locais de metadata, scripts e
CSP/nonce consultados; skills Supabase e React usadas para revisão local.

Sem migrations, valores de credenciais, chamadas pagas, mudanças de dependências,
chaves, ambiente ou configurações externas. Ordens 3–5 ficam fora do escopo.
Rollback: descartar seletivamente apenas o diff C123 depois de revisão humana;
não há dados remotos nem migration a reverter.
