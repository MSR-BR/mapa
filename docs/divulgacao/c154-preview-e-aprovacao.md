# C154 — Prévia e decisão de publicação

**Estado:** C154-v1 aprovada para [encaminhamento local ao desenvolvimento](c154-encaminhamento-desenvolvimento.md); `PUBLICATION_STATE: APPROVAL_PENDING`. Nada foi publicado ou configurado. A [prévia HTML local](c154-preview.html) apresenta a entrada atual e a candidata lado a lado; há também capturas [desktop](c154-preview-desktop.png) e [celular](c154-preview-mobile.png). Ela ilustra hierarquia e quebra de texto; a aparência final depende da implementação e de revisão visual em produção de desenvolvimento.

## Pacote exato submetido à revisão

- **Superfície:** primeiro bloco da home `https://mapadapesquisa.com.br/`, abaixo dos dois botões de entrada.
- **Única alteração de conteúdo:** inserir a frase **“Prepare sua ideia sem login. Para gerar e guardar o mapa, entre com sua conta Google.”** Não mudar H1, descrição principal, rótulo “Começar meu projeto”, botão “Como funciona”, destinos, modos nem vídeo.
- **Destino do CTA:** `/mapa`, sem UTM interno. Nenhuma mudança nos links externos da UFF nesta etapa.
- **Visibilidade se aprovada e publicada:** pública para todos os visitantes da home. A leitura prioritária dos resultados será UFF, separada dos demais canais.
- **Metadados:** título, descrição, canonical, Open Graph e schema atuais da home permanecem como estão. Nenhuma proposta de alteração em Ads, GA4, Search Console, consentimento ou orçamento.
- **Revisão candidata:** C154-v1, definida pelo texto exato acima e pelos arquivos locais `c154-experimento-entrada.md`, `c154-preview-e-aprovacao.md` e `c154-preview.html`. SHA-256 do protocolo `e0b102aa7e0f3e3cea23bebb8c52431aa100383e8f6d168c5cc4e15f24b37994`; SHA-256 da prévia HTML `7f00da351ba10f76aa3abfac9fa3804bda2057092e26baa9369e80b8bd9c2e9a`. Não há revisão de código do aplicativo nem commit de publicação.

## Conferências para o desenvolvimento, após a autorização de encaminhamento

1. Inserir a frase semanticamente como texto de apoio do primeiro CTA, com contraste e leitura de tela adequados, sem transformar a frase em botão ou link.
2. Conferir em largura móvel pequena e desktop que o CTA continua visível e a frase não cria quebra excessiva.
3. Abrir `/mapa` sem login e confirmar que a pessoa consegue preparar a ideia; confirmar que gerar/guardar exige Google. Se esse comportamento tiver mudado, devolver a cópia para revisão antes de publicar.
4. Preservar o consentimento e o GA4 existentes; não criar eventos, conversões ou UTMs internos para esta candidata.
5. Registrar revisão, hora, destino e resultado do deploy. Se houver desvio de promessa, layout ou indicador operacional, restaurar a home sem a frase e registrar a revisão de rollback.

## Limites da decisão

O funil UFF de 06–26/10 foi **84 primeiras visitas medidas → 15 logins → 6 inícios**, sem prazo fixo de seguimento e com concentração em poucos dias. A frase responde a uma hipótese de clareza, não a uma causa comprovada. O resultado da campanha paga não será usado como evidência da candidata, pois a atribuição a `google / cpc` não foi confirmada pelo ID da campanha. Falhas de geração e avanço por projeto dependem de acompanhamento separado, conforme [protocolo C154](c154-experimento-entrada.md).

**Validação local da prévia:** Chromium renderizou a versão desktop em 1440 px e celular em 390 px; em 320 px não houve rolagem horizontal (`scrollWidth=clientWidth=320`). As duas versões mantiveram os mesmos rótulos de botões; somente a B exibiu a frase candidata. Isso valida apenas o protótipo local, não o CSS nem o fluxo do aplicativo publicado.

**Decisão recebida:** o responsável respondeu “de acordo” em 27/10/2026 à aprovação da C154-v1 **para encaminhar ao projeto de desenvolvimento**. O [handoff local](c154-encaminhamento-desenvolvimento.md) foi preparado. A aprovação cobre a candidata textual e o destino proposto `/mapa`, mas **não** aprova peça UFF, Ads, GA4, Search Console, outras modificações nem publicação. A revisão implementada deverá ser mostrada antes de um aceite próprio para deploy.

- HANDOFF_APPROVAL: aprovado em 27/10/2026, resposta “de acordo” nesta conversa
- HANDOFF_STATE: LOCAL_DOCUMENT_READY; sem envio a outra tarefa ou pessoa

- PUBLICATION_STATE: APPROVAL_PENDING
- REVIEW_CANDIDATE: C154-v1 — frase exata e destino `/mapa` descritos acima; prévia local `docs/divulgacao/c154-preview.html`
- APPROVED_REVISION: nenhuma
- APPROVED_DESTINATION: nenhum
- APPROVAL_EVIDENCE: nenhuma
- PUBLICATION_EVIDENCE: nenhuma
