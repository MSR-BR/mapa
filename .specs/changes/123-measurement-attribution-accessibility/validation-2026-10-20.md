# Validação local — C123, Ordem 2, 20/10/2026

Base: `7fbd8e4a7fe95acd3a88fd23ad0dd621c9cc5e0c`, branch
`codex/change-003-004`. Sem commit, push, deploy, migration, alteração de ambiente
ou configurações remotas. Auditoria e handoffs anteriores preservados.

## Implementação

- GA-01: `WorkflowHttpError` preserva a classificação de `workflowResponseFailure`
  até o catch de `workflowClientFailure`. Aplicado a geração, capítulos,
  exportação e integração. JSON inválido/ausente não vira automaticamente erro
  de IA; status HTTP de erro continua útil mesmo com HTML. 503 sem código fica
  `unknown`; 503 com `persistence_failed` fica falha de salvamento. Não inferimos
  indisponibilidade de um provedor a partir do status genérico.
- Login: o contrato de retorno só informa `access` ou `google`, sem HTTP ou causa.
  `access` → `permission_denied`; `google` → `unknown`. Não inventar 429, 503,
  422 ou offline num callback sem esses dados. Uma notificação por código/montagem.
- GA-02/03: início exclusivamente ao enviar o formulário social; intenção de
  abrir /login não é outro login. Sucesso exige `SIGNED_IN` e uma tentativa
  emitida com consentimento na mesma aba, nos últimos 30 minutos. Removido
  getSession como origem de sucesso. INITIAL_SESSION, refresh e SIGNED_IN sem
  tentativa não contam. O observador não examina usuário, chave ou token.
- Repetição da descoberta emite somente `generation_retry`, preservando o motivo.
- GA-04: allowlist de nove chaves; aceita ponto, espaço e percentual, reencoda com
  URLSearchParams; rejeita duplicatas, controles, URLs e e-mails inclusive
  codificados. SessionStorage guarda somente o objeto sanitizado, sem URL bruta.
  A primeira campanha pendente acompanha navegação pública/login. Configuração
  inicial e eventos até o primeiro page_view usam campanha lembrada em URL de
  caminho sanitizado (inclusive /login); depois a memória é consumida. Os demais
  eventos mantêm a política prévia de retirar queries privadas. Nunca envia
  UUIDs de projetos, prompt, título de projeto ou next. Captura local anterior ao
  consentimento é a solicitada na Ordem 2; não carrega Google nem envia eventos.
- SEO-01: metadados completos e independentes em /mapa (merge raso do Next).
- UX-01: nome acessível na entrada rápida e nenhum autofocus; também removido
  em desktop para não roubar foco de navegação/diálogo.
- UX-02: diálogo modal nativo, foco inicial/restaurado, contenção explícita de Tab,
  fundo inerte, altura máxima/rolagem e Aceitar métricas (publicidade desativada).

## Testes e evidências

- `npm run check`: lint sem erros (um aviso preexistente em foundation.test.mjs),
  TypeScript, grants estáticos, **253 testes** e verificação das exportações
  PDF/Word passaram. O build padrão Turbopack falhou no sandbox:
  `binding to a port / Operation not permitted`. Não declarar check completo verde.
- `npm run build -- --webpack`: build alternativo local aprovado; não modifica
  o comando padrão nem substitui a verificação desse comando em ambiente apto.
- `npm run security:audit`: `PASS_WITH_ACCEPTED_RISK`; análise estática não prova
  segurança remota e não resolve os achados SEC das Ordens 3/4/5.
- **30 cenários de navegador aprovados**, com componentes reais, React real, perfil temporário,
  dados sintéticos, router/Auth/IA substituídos e TODA requisição interceptada.
  Quatro fluxos exercitam 429, 503 com/sem código, 422, offline e JSON inválido
  (download binário não é tratado como JSON). Login testa o contrato limitado
  real; descoberta verifica ausência da contagem duplicada. Testa teclado,
  recusa/aceite, publicidade recusada, ausência de login_success para sessão
  preexistente e foco/rolagem em viewport móvel. Não comprova OAuth remoto.
- Execução reproduzível do harness com Playwright instalado externamente:
  `PLAYWRIGHT_CHANNEL=chrome PLAYWRIGHT_MODULE_PATH=<caminho>/playwright/index.mjs node scripts/verify-measurement-browser.mjs`.
  Nenhuma dependência adicionada ao projeto. Em ambiente com Playwright local,
  o caminho é opcional; Chrome deve estar instalado se canal chrome for usado.
- Imagens conferidas em `tmp/c123-browser/` (375×667 e 320×320, com rolagem); logs finais copiados em `evidence/` nesta pasta da Change.
- `git diff --check`: aprovado. HEAD permanece o da C122; árvore intencionalmente
  modificada para revisão, sem alegação de CPD limpo.

## UX-06: pendência explícita

Foi preparado [WebVTT de roteiro](video-roteiro-base.pt-BR.vtt), com texto e tempos
**existentes** em `docs/notebooklm-promo-video.md` (C080). A mídia recebida na C081
mede **76,57 s**, enquanto o roteiro-base termina em **60 s**. Não há transcrição
sincronizada nem prova de que as falas do vídeo sejam idênticas ao roteiro.
Por isso o arquivo é um rascunho de revisão e NÃO foi ligado como faixa de
legendas no player: fazê-lo declararia equivalência não verificada. Não foram
inventadas falas, aplicado serviço de transcrição ou consumidos créditos.
UX-06 permanece aberto até conferir/transcrever o áudio real e sincronizar a
faixa; os demais itens desta Ordem estão implementados e testados localmente.

## Fontes técnicas e limites de publicação

- Next.js instalado: guias metadata/generate-metadata, scripts (afterInteractive,
  nonce encaminhado) e content-security-policy. Não alterado nonce/CSP.
- [Supabase onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
  e [changelog](https://supabase.com/changelog.md), consultados em 20/10. A mudança
  TLS de 12/10 refere-se a cifras antigas; nenhuma alteração de callback ou de
  configuração remota é necessária nesta Change.
- Revisão React: hooks com cleanup, timers limitados, sem consulta de Auth dentro
  do callback, estado/foco contidos, sem novos efeitos de rede de IA.
- A série histórica de login/falhas/repetições não é diretamente comparável com
  a futura série corrigida. O efeito sobre atribuição paga só pode ser confirmado
  após publicação autorizada e tráfego real; estes testes não validam GA4 remoto.
- Antes de publicar: resolver UX-06, rodar o build padrão em ambiente apto,
  revisar o candidato conjunto C122/C123 e obter autorização por commit. Os
  bloqueios de segurança já documentados na C122 continuam fora desta Ordem.
  Ajustes GA-05/09 no admin não foram executados; Ads continua intocado.
