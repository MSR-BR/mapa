# Validação local C127 — 22/10/2026

**R3/R4/R5 corrigidos no candidato local. NEEDS_REVIEW; publicação não solicitada.**
Não houve commit, push, deploy, SQL remoto, mudança de Ads/GA4, leitura de valores
de chaves, chamada paga nem envio real de e-mail. As Changes anteriores continuam
intencionalmente sem commit. Isto não é CPD limpo.

| Verificação | Resultado |
|---|---|
| npm test | 265 testes PASS: 213 principais + 13 DOI + 39 IA; mais 45 cenários Data API, sugestões e novo harness de lembretes |
| Rotas de lembrete | PASS: autorização, destinatário canônico, reserva antes de envio, 429/Retry-After, migration ausente, resposta malformada, falha e timeout simulados sem reenvio |
| PostgreSQL local | PASS: 20 concorrentes mesma revisão → 1 reserva; 20 projetos → 5; janela móvel sem reinicialização indevida; exclusão de projeto não contorna limite |
| Autorização SQL | PASS: owner/modo correto e orientador vinculado; outro usuário e modo incorreto negados; sem acesso direto às tabelas, RPC anônima/service_role proibida |
| Destinatários SQL | PASS: e-mails forjados no JSON da revisão ignorados; origem canônica do projeto/conta |
| C125 regressões | PASS: aprovação forjada bloqueada; revisão de etapa anterior preserva conteúdo/progresso; gates e grants anteriores continuam passando |
| supabase:release-gate | PASS: 25 migrations, 20 funções, 13 tabelas; SQL final também aplicado integralmente no verificador de lembretes |
| Bloqueios — rotas | PASS: orientador ausente, revisão pendente e conflito explicados; nenhuma gravação/IA |
| Navegador | 31 cenários PASS; novo caso orientador ausente mostra orientação, preserva todos os campos e não exibe texto privado simulado; toda rede interceptada |
| Metodologia/cards/limites/Research Starter | PASS |
| Exports | PASS: rotas PDF/Word e 553 campos compartilhados; Unicode/fontes/originais preservados |
| Lint e tipos | PASS; um warning preexistente em foundation.test.mjs:887 |
| Build | Next 16.4.2 com Webpack PASS; 22 páginas estáticas; cópia isolada sem arquivos de ambiente e sem credenciais |
| Auditoria de produção | npm audit --omit=dev: **zero vulnerabilidades reportadas** |
| Auditoria completa | Cinco altos na cadeia dev ESLint/braces; nenhum crítico. Último braces publicado = 3.0.3, ainda sinalizado. Não houve downgrade automático |
| Auditoria estática | PASS_WITH_ACCEPTED_RISK; fast check PASS. Isso não aceita novos riscos em nome do responsável |
| Git | HEAD preservado; diff sem whitespace inválido; patch incremental verificado sem aplicar |

## Achados resolvidos

- R3: Next/eslint-config-next 16.3.8 → 16.4.2, lockfile atualizado com scripts de
  instalação desativados. `npm audit --omit=dev` comprova remoção dos avisos nas
  dependências de produção deste candidato; não comprova o estado publicado.
- R4/SEC-04: quota durável, privada e concorrente por remetente + cooldown por
  revisão. RPC obtém ator e destinatário no banco. Falhas de confirmação não
  enviam e não repetem operações. Reserva permanece se entrega for incerta;
  mensagem informa espera de 24h. Isso evita duplicidade, mas pode exigir espera
  mesmo quando o provedor não entregou. Não limita edição do mapa/IA.
- R5: códigos explícitos nos 409 de capítulos/definição/mapa final; mensagens
  locais permitidas no cliente, tratamento HTTP de sessão/permissão/frequência/
  indisponibilidade. Aviso de orientador ausente compartilhado entre etapas.

## Falhas de teste corrigidas durante a implementação

- Fixture SQL tentava UPDATE privilegiado sem auth.uid e foi corretamente negada
  pelo trigger existente. A fixture passou a representar registro legado inserido
  antes da C125; nenhum trigger foi desligado para obter PASS.
- Novo harness de rota teve um fechamento de objeto corrigido. Teste de transporte
  precisava do APP_URL sintético. Teste de fundação ainda fixava Next 16.3.8 e foi
  atualizado para 16.4.2. Logs iniciais preservados como diagnóstico, não defeitos
  remanescentes do app.
- CLI Supabase precisou de permissão local para seu arquivo de telemetria ao
  consultar ajuda/criar migration. Nenhum comando remoto foi executado.

## Limites

A compilação foi feita em `/tmp/mapa-c127/build-source`, com código equivalente,
node_modules instalado, APP_URL sintético e sem `.env*`. A migration final usa
janela móvel; SQL não participa do bundle. Não reexecutamos o bundler Turbopack
que estava limitado pelo ambiente; **não declarar npm run check integral PASS**.

As verificações Auth/PostgREST/Storage em serviço real e a confirmação de configurações
no destino continuam fora da autorização. Falta publicar código e aplicar a nova
migration para a proteção existir em produção. E-mail real não foi enviado.

A auditoria completa ainda bloqueia o `security:gate` por cinco pacotes altos de
ferramentas de desenvolvimento (uma cadeia transitiva, não cinco incidentes).
`npm audit fix --force` sugere downgrade de Next ESLint e não foi usado. A liberação
futura exige patch compatível ou aceitação documentada desse risco, além das
pendências operacionais e UX-06 já registradas. Nenhuma aceitação nova foi presumida.

Fontes consultadas: [release Next 16.4.2](https://github.com/vercel/next.js/releases/tag/v16.4.2),
[aviso Server Actions](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r),
[funções Supabase](https://supabase.com/docs/guides/database/functions),
[changelog PostgreSQL](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes),
[changelog TLS](https://supabase.com/changelog/cbc-tls-ciphers-deprecated).
Evidências selecionadas em `evidence/`; manifesto e diff incremental nesta pasta.
