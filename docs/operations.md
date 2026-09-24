# Operação do Mapa da Pesquisa

## Ambiente

- Produção: `https://mapadapesquisa.com.br`
- Versão pública: `v26082026.6` (26/08/2026; coerência metodológica em tempo real e encerramento do projeto mais visível)
- GA4 Measurement ID: `G-MKFYYRZG87` (carregado somente após consentimento)
- Vercel Functions: `gru1` (São Paulo), uma única região compatível com o plano Hobby.
- Supabase: projeto `aeaweherkrqmlqnxsmib`, plano Free, região `sa-east-1`.
- Gemini e Research Starter: chaves exclusivamente server-side.

## GA4 — Changes 054 e 097

O Measurement ID `G-MKFYYRZG87` só é carregado depois que o usuário aceita
métricas. Ao recusar, o script e os eventos não essenciais não são carregados.
Os eventos usam somente valores enumerados e não incluem prompt, texto
acadêmico, e-mail, nome, UUID, comentário, resposta de provedor ou stack trace.

### Eventos disponíveis

`consent_choice`, `login_started`, `login_success`, `login_failed`, `logout`,
`profile_role_selected`, `profile_mode_changed`, `project_start`, `project_draft_saved`,
`project_resumed`, `generation_started`, `generation_completed`,
`generation_failed`, `generation_retry`, `proposal_viewed`,
`proposal_selected`, `stage_started`, `stage_saved`, `stage_submitted`,
`stage_completed`, `stage_blocked`, `stage_revision_requested`,
`advisor_link_started`, `advisor_link_succeeded`, `advisor_link_pending`,
`advisor_review_opened`, `advisor_approved`, `advisor_correction_requested`,
`literature_optimization_started`, `literature_optimization_completed`,
`literature_optimization_failed`, `project_integration_started`,
`project_integration_completed`, `project_integration_failed`,
`project_completed`, `export_pdf_started`, `export_pdf_completed`,
`export_pdf_failed`, `support_opened`, `support_submitted` e
`bug_report_submitted`.

Desde 24/09/2026, os parâmetros de produto são limitados a
`app_auth_state`, `app_role`, `app_surface`, `app_entry_mode`,
`app_product_type`, `app_stage`, `app_result`, `app_reason_code`,
`app_reference_count_bucket`, `app_has_advisor`, `app_macro_stage` e
`app_step`. A camada central converte qualquer valor fora da lista para
`unknown`. `source`, `medium`, `campaign`, `term` e `content` ficam reservados
para aquisição e UTMs.

### Como acompanhar o uso

No GA4, as doze dimensões `app_*` acima estão cadastradas como dimensões de
evento. As onze dimensões anteriores permanecem somente para consulta histórica
e não recebem novas emissões. Não criar dimensões para prompts, títulos,
e-mails ou identificadores.

Criar os funis com as sequências:

1. `login_success` → `project_start` (ativação autenticada);
2. `project_start` → `project_completed` (conclusão em coorte de 7/30 dias);
3. `advisor_link_succeeded` → `stage_submitted` → `advisor_approved` (validação
   do orientador).

A exploração operacional “Mapa — Jornada principal” usa o funil aberto
`login_success` → `project_start` → `stage_completed` → `project_completed`.
Os key events primários são `project_start` e `project_completed`.

Para “começou e não terminou”, usar uma exploração de coorte sem evento
`beforeunload`: `project_start` sem `project_completed` em 7 ou 30 dias. A
contagem exata por projeto continua sendo responsabilidade de uma consulta
agregada e restrita no Supabase.

O DebugView deve ser usado com uma conta de teste e consentimento aceito. A
recusa de métricas deve gerar zero eventos no DebugView e zero cookies não
essenciais. Os eventos de exportação distinguem início, sucesso e falha real;
falhas de entrega de e-mail permanecem nos logs do Resend.

## E-mail de suporte

- Formulário interno: mensagens são enviadas via Resend para `marioreis@id.uff.br` e `sfranca@id.uff.br`.
- Recebimento direto: mensagens enviadas para `suporte@mapadapesquisa.com.br` entram pelo Resend Receiving e são encaminhadas pela rota `/api/inbound/resend` para os dois destinatários institucionais. A rota exige `RESEND_WEBHOOK_SECRET`, valida a assinatura do webhook e usa uma chave idempotente baseada no ID da mensagem recebida.

## Relatos de problemas

- O botão **Relatar problema** aparece na home e nas áreas autenticadas, abrindo um formulário em modal que também registra a etapa, endereço da página, navegador e, opcionalmente, uma captura de tela.
- Os relatos são gravados em `public.bug_reports`, com RLS: o remetente autenticado vê somente os próprios registros; a triagem é restrita a `marioreis@id.uff.br` e `sfranca@id.uff.br`.
- Capturas são armazenadas no bucket privado `bug-report-attachments`; não há URL pública. A área `/admin/bugs` gera links assinados temporários para a equipe autorizada.
- A notificação transacional usa Resend e `notificacao@mapadapesquisa.com.br`, com `reply-to` do endereço informado pelo usuário. Se o envio estiver indisponível, o relato continua salvo e pode ser triado no painel.
- O endpoint limita cinco envios por hora por IP, rejeita arquivos acima de 5 MB e aceita somente PNG, JPEG e WebP. Não incluir senhas, tokens ou chaves em relatos.

## Autenticação e domínio canônico

- `NEXT_PUBLIC_APP_URL` na Vercel: `https://mapadapesquisa.com.br`.
- Site URL no Supabase Auth: `https://mapadapesquisa.com.br`.
- Redirect URL permitida no Supabase Auth: `https://mapadapesquisa.com.br/auth/callback`.
- `https://mapa-gray-two.vercel.app` deve responder com redirecionamento permanente para o domínio canônico.
- `www.mapadapesquisa.com.br` não é publicado nesta fase; o domínio raiz é o único endereço canônico.
- Depois de alterar qualquer domínio, validar o fluxo completo “tema → login → callback → geração”; uma Site URL correta sem a Redirect URL permitida faz o Supabase descartar o callback PKCE solicitado.

### Login Google exclusivo — C92

- GOOGLE_AUTH_ENABLED=true é a única flag de provedor aceita.
- LinkedIn foi cancelado antes da criação do aplicativo e não pertence à allowlist.
- A tela pública não oferece senha, cadastro por e-mail ou recuperação.
- Rotas legadas retornam a /login?notice=google-only.
- O callback canônico continua em https://mapadapesquisa.com.br/auth/callback.
- O parâmetro next aceita somente caminhos internos.
- Não editar ou mesclar auth.users diretamente. O e-mail continua necessário
  para identidade, contato e vínculo Aluno–Orientador.
- Rollback: reativar temporariamente e-mail no Supabase e promover o deployment
  anterior, sem apagar usuários ou identidades.

## Change 053 — Auditoria de regressão (25/08/2026)

- A auditoria reexecutou os fluxos rápido e avançado, descoberta de propostas,
  dashboard, autenticação, integrações, exportação e compatibilidade sem criar
  uma nova implementação paralela às Changes 042–049.
- Smokes públicos: `/api/health`, home, `/home.html`, `robots.txt`, `sitemap.xml`,
  redirecionamentos dos hosts Vercel antigos, dashboard protegido e callback de
  autenticação. O domínio `www` continua deliberadamente não publicado conforme
  a decisão da Change 038.
- Supabase: isolamento anônimo e autenticado, RLS de aluno–orientador e fluxo
  E2E passaram; a verificação local que depende do Docker foi bloqueada pelo
  socket do Docker indisponível, sem invalidar a verificação remota equivalente.
- PDF: exportação passou, foi renderizada visualmente e confirmou capa, capítulos,
  referências, link do aplicativo, registro CBL/ISBN e página de produção.
- O relatório completo e a matriz de resultados estão em
  `.specs/changes/053-report-regression-audit/closure-evidence.md`.
- Versão publicada: `v25082026.5`.

## Custos e limites

- Não ativar plano pago, PITR, branch, read replica ou add-on no Supabase sem nova aprovação explícita.
- Exportações não usam Supabase Storage.
- Geração externa ocorre somente por ação explícita, com até 20 referências.
- Monitorar uso do Gemini na conta já paga e uso do Supabase no painel Free.

## Retenção e LGPD — política inicial do piloto

- Dados de projeto são mantidos enquanto a conta estiver ativa e forem necessários ao serviço.
- “Excluir projeto” oculta imediatamente o projeto e seus derivados da aplicação.
- Registros excluídos devem ser purgados em até 30 dias no piloto, após verificação de backup e solicitação pendente.
- Exportações não são armazenadas pelo Mapa; a cópia baixada passa a ser responsabilidade do usuário.
- Solicitações de acesso, correção ou eliminação devem ser tratadas pelo responsável pelo produto antes da abertura pública.
- Não registrar prompts, documentos, chaves ou conteúdo acadêmico completo em logs.

## Backup no Supabase Free

O plano Free não oferece ao responsável o mesmo fluxo de restauração diária dos planos pagos. Antes de migrações destrutivas ou de um piloto relevante:

1. Obter a connection string direta do projeto sem registrá-la no Git.
2. Executar `supabase db dump` ou `pg_dump` em ambiente confiável.
3. Criptografar o dump e armazená-lo fora do Supabase, em local controlado pelo responsável.
4. Validar o arquivo com `pg_restore --list` ou restauração em banco temporário autorizado.
5. Registrar data, responsável, checksum e resultado da validação.

## Rollback da aplicação

1. Identificar o último deployment estável com `npx vercel ls`.
2. Executar `npx vercel rollback <deployment-id>` ou promover o deployment estável.
3. Validar `/api/health`, login, projeto, geração existente e exportações.
4. Consultar logs de produção e registrar o incidente.

## Falha de exportação

1. Confirmar que a estrutura está salva e sem alterações pendentes.
2. Verificar autenticação e propriedade do projeto.
3. Consultar logs Vercel sem registrar o conteúdo do documento.
4. Reproduzir com `npm run exports:verify`.
5. Renderizar os arquivos de teste antes de novo deployment.

## Smoke pós-deploy

1. `GET /api/health` retorna `status: ok`.
2. Usuário anônimo é redirecionado ao login no dashboard.
3. Usuário autenticado abre o próprio projeto.
4. DOCX e PDF retornam `200`, MIME correto e `Content-Disposition: attachment`.
5. Arquivo real abre/renderiza e corresponde à versão indicada na interface.

## Fechamento operacional do piloto — C039

- CPD técnico de 21/08/2026 aprovado: lint, typecheck, 61 testes, exportação
  PDF e build de produção.
- Integrações verificadas com acesso de rede: Supabase, RLS anônimo e
  autenticado, fluxo aluno–orientador, Research Starter e Gemini.
- Produção verificada: `https://mapadapesquisa.com.br/` e `/api/health`
  respondem `200`; headers de segurança, robots, sitemap e redirect do host
  Vercel antigo estão ativos.
- Deployment verificado: `dpl_Ad18s4KuZXyaAucG7Rdtp7Ci8EBP` (Ready), com o
  domínio raiz associado ao projeto `mapadapesquisa`.
- A validação local das migrations foi aprovada com Docker Desktop. O conector
  MCP de advisors permanece sem permissão, mas a auditoria equivalente foi
  executada pela CLI autenticada; os RPCs `SECURITY DEFINER` estão acessíveis
  somente a usuários autenticados. A proteção contra senhas vazadas foi
  retirada do escopo por ser recurso pago do Supabase, e a autorização de uso
  da identidade UFF foi confirmada pelo professor responsável na C037.
- Encerramento técnico registrado em commit limpo; a tag `v21082026.1` e o smoke
  autenticado foram confirmados.

## Encerramento da Change 041

- Versão pública `v21082026.3`, commit `06947d8` e tag Git correspondente.
- Migration `20260821153000_create_bug_reports.sql` aplicada no Supabase remoto.
- Deployment Vercel `dpl_4PNAfR5vVay4WDKpxqQ8UJ2AWmKy` está READY e aliasado ao
  domínio canônico.
- Smoke público confirmado: home e `/api/health` retornam `200`; robots
  bloqueia `/admin/`; o HTML da home contém os modos `Mapa Avançado`,
  `Mapa Rápido` e o link `Relatar problema`.

## Encerramento da Change 042

- O Mapa Rápido exibe três sugestões locais a partir de oito caracteres, sem
  depender de rede ou de uma resposta do Gemini para mostrar alternativas.
- Sugestões de IA continuam sendo solicitadas a partir de 18 caracteres e
  substituem as sugestões locais somente quando retornam com sucesso.
- As alternativas são classificadas como Tema, Formulação ou Recorte e podem
  ser selecionadas para continuar a edição do pedido.
- O fallback não inventa instituições, períodos, populações ou métodos; apenas
  reorganiza o texto informado e explicita uma delimitação para revisão do
  usuário.
- Versão pública atualizada para `v23082026.1`.

## Encerramento da Change 043

- A descoberta de propostas limita o tempo total da busca e repete somente falhas
  transitórias do Research Starter, sem duplicar chamadas indefinidamente.
- Respostas bibliográficas são normalizadas antes do schema: URLs inválidas viram
  campos nulos, abstracts dos artigos de topo são preservados e IDs inválidos não
  entram nos cards.
- A formação dos seis cards possui uma segunda tentativa com instruções de reparo
  para ordem, tipo da proposta, abertura da pergunta e referências verificadas.
- A API identifica a etapa da falha, informa se a tentativa é repetível e confirma
  que o briefing continua salvo; a interface oferece retry sem exibir um estado vazio
  concorrente.
- Versão pública atualizada para `v23082026.2`.

## Encerramento da Change 044

- Gemini validado após a recarga de créditos, com saída estruturada compatível
  com o schema 1.0.0.
- Research Starter validado com referências retornadas e normalizadas.
- Descoberta real validada com três sugestões rápidas, seis propostas (uma
  exata e cinco alternativas) e vinte referências no relatório.
- Fluxo E2E autenticado aluno–orientador aprovado: vínculo, leitura,
  comentário, correção, aprovações, conclusão e três referências no mapa final.
- PDF, 65 testes, typecheck, lint, build e `git diff --check` aprovados.
- O smoke isolado usa `--conditions=react-server` e `server-only` declarado
  como dependência para reproduzir corretamente o ambiente Server Component.
- Versão pública `v23082026.3` publicada no deployment Vercel
  `dpl_L4CE1edxVRYNJ66y26yygMozthCm`, aliasado a
  `https://mapadapesquisa.com.br`. Home, `/api/health`, `robots.txt`, sitemap
  e redirecionamento do host Vercel antigo retornaram o resultado esperado.

## Change 045 — Observabilidade e manutenção pós-piloto

Durante a operação, use o valor do cabeçalho `x-request-id` para correlacionar
uma resposta do navegador com os logs da função. O proxy gera um UUID seguro
quando o cliente não fornece um identificador válido e propaga o valor também
em redirecionamentos e rejeições de origem.

`GET /api/health` é um diagnóstico sanitizado e sem cache. Ele retorna a versão
pública, o estado geral (`ok`, `degraded` ou `down`) e apenas `configured` ou
`not_configured` para Supabase, Gemini, Research Starter e Resend. A ausência
de configuração crítica do Supabase retorna `503`; a ausência de um provedor
opcional retorna `200` com `degraded`, permitindo que o monitor diferencie uma
falha total de uma função opcional indisponível.

Os logs operacionais usam JSON e não devem conter prompts, documentos, e-mails,
tokens, chaves ou corpos de respostas. Em falhas de geração, filtre por
`event=generation_job_failed`, `requestId` e `errorCode`; o conteúdo interno da
exceção não é enviado ao log.

### Encerramento da Change 045

- Versão pública: `v23082026.4`.
- Deployment Vercel: `dpl_BykSZAGLg9R3sCbQCJm42WBa35BA` (READY), aliasado a
  `https://mapadapesquisa.com.br`.
- Smoke público aprovado em 23/08/2026: home e `/api/health` retornaram HTTP
  200; `x-health-status: ok`, `cache-control: no-store` e `x-request-id` foram
  observados.
- `/api/health` confirmou Supabase, Gemini, Research Starter e Resend como
  `configured`, sem expor valores de ambiente.
- CPD técnico: lint, typecheck, 70 testes, build e `git diff --check` aprovados.

## Change 046 — PDF final conforme modelo acadêmico e registro CBL

O PDF final do fluxo v2 segue a organização do modelo acadêmico fornecido: introdução,
revisão da literatura, metodologia, estudo de caso/análise e discussão, conclusão e
recomendações, além das referências. As citações cruzadas permanecem no corpo do texto
e as referências continuam vinculadas ao Research Starter.

Ao final, o documento informa que foi produzido pelo Mapa da Pesquisa, contém um link
clicável para `https://mapadapesquisa.com.br` e apresenta o registro CBL/ISBN
`978-65-01-44943-2` com o código de barras fornecido pelo responsável.

### Encerramento da Change 046

- PDF visualmente revisado após renderização: capa com marca, hierarquia de capítulos,
  referências e página final de registro sem sobreposição.
- Exportação DOCX permanece indisponível; o fluxo oferece PDF conforme a decisão do
  projeto de entregar apenas esse formato neste momento.
- Versão de código: `v23082026.5`.

## Changes 047–049 — Conclusão, recuperação de senha e auditoria final

- O PDF final agora registra o produto acadêmico escolhido, sua orientação de
  profundidade, impactos potenciais, oportunidades derivadas da literatura e
  recomendações futuras. As relações com tema, objetivo e referências mantêm os
  marcadores `[Rxx]` quando há evidência associada.
- O fallback dos cards do dashboard não retorna mais “Mapa em construção” para
  projetos com briefing: usa o título, tema, problemática ou pedido original de
  forma compacta e legível.
- A home pública usa o texto “Vamos construir o mapa da sua pesquisa?” e mantém
  a descrição metodológica alinhada ao dashboard.
- Recuperação de senha usa `/auth/confirm` com `token_hash`/`type=recovery`,
  destino interno validado e compatibilidade com links antigos no callback.
- Auditoria final: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run exports:verify`, `npm run security:audit`, build, smoke de produção,
  redirects, health check, assets e `git diff --check` aprovados.
- Versão final publicada: `v23082026.8` em `https://mapadapesquisa.com.br`.

## Change 050 — Persistência do orientador

- O detalhe do projeto agora reidrata o e-mail e o estado do vínculo salvos no
  Supabase e apresenta um resumo compacto por padrão.
- O formulário permanece fechado depois de salvar; a edição ou remoção só é
  aberta por **Alterar orientador**, preservando também o estado pendente para
  contas ainda não existentes.
- Não houve alteração de schema ou migration: o comportamento usa a função
  `set_project_advisor` e o RLS já auditados na Change 036.
- Validações executadas: testes, lint, typecheck, build, E2E aluno–orientador,
  exportações, segurança e smoke de produção.
- Versão publicada: `v25082026.1`.

## Change 051 — Linguagem de cobertura dos objetivos

- Os graus persistidos `partial` e `full` continuam compatíveis com projetos
  existentes, mas a interface usa `Atende parcialmente` e `Atende completamente`.
- Capítulos 2 e 4 exibem o seletor de cobertura para OE e OEG quando aplicável.
- O mapa final, a rastreabilidade e o PDF traduzem também relações legadas que
  ainda registravam `partial` ou `full`.
- Não houve alteração de schema, migration ou RLS.
- Validações executadas: testes, lint, typecheck, build, exportações, auditoria
  de segurança, verificação Supabase e E2E aluno–orientador.
- Versão publicada: `v25082026.2`.

## Change 052 — Otimização da literatura com Research Starter

- **Otimizar literatura** executa uma nova busca no Research Starter com as
  palavras-chave informadas; não é uma alteração local do texto.
- A nova resposta só é persistida depois que há fontes verificáveis e tópicos
  regenerados. Em falhas ou concorrência, a versão anterior permanece intacta.
- Referências manuais ficam priorizadas no arquivo e referências da busca
  anterior são arquivadas sem duplicatas. As associações entre tópicos e fontes
  podem mudar e são exibidas novamente para conferência.
- A mensagem de sucesso informa fontes encontradas, fontes associadas e fontes
  preservadas; respostas parciais exigem revisão humana antes da validação.
- Versão publicada: `v25082026.3`.

## Change 054 — Instrumentação de produto e funis no GA4

- Contrato tipado e allowlist de eventos implementados em
  `modules/analytics/analytics.ts`; valores desconhecidos são normalizados
  para `unknown` e nenhum conteúdo livre é enviado ao GA4.
- Eventos conectados aos callbacks reais de autenticação, projeto, geração,
  propostas, etapas, orientador, literatura, integração, exportação, suporte e
  relatos de bugs.
- Consentimento permanece obrigatório; a sessão autenticada é detectada após
  `getSession`/callback, com proteção contra duplicidade por sessão.
- Exportação PDF mede início, sucesso e falha após a resposta real do endpoint.
- Testes de contrato cobrem bloqueio antes do consentimento, allowlist de
  parâmetros e faixas de referências; o conjunto total passou com 76 testes,
  além de lint e typecheck.
- Definições personalizadas e relatórios do GA4 são configuração operacional
  externa e estão documentados acima; não há PII nos parâmetros.
- Versão de código: `v25082026.6`.

## Change 097 — Integridade de atribuição e taxonomia GA4 (24/09/2026)

- Os nomes de eventos foram preservados, mas todo contexto de produto migrou
  para doze parâmetros prefixados `app_*`; `source` e `stage_number` deixaram
  de ser emitidos.
- Macroetapas 1–4 e passos internos agora são dimensões distintas por
  `app_macro_stage` e `app_step`.
- As doze novas dimensões foram registradas no GA4 sem apagar as onze dimensões
  legadas. A data de 24/09/2026 é uma quebra de série para dimensões de produto.
- `project_start` e `project_completed` são key events. `advisor_approved`
  continua diagnóstico, e o evento padrão `purchase`, sem dados de stream, é
  ignorado pelos relatórios operacionais.
- O funil “Mapa — Jornada principal” foi corrigido e configurado como aberto,
  com dados em todas as quatro etapas.
- Um teste público controlado capturou `project_start` exatamente uma vez com
  contexto `app_*` e sem o parâmetro reservado `source`.
- O filtro Internal Traffic permanece em Testing até provar a marcação
  `traffic_type=internal`; ativá-lo antes disso pode excluir dados válidos de
  forma irreversível.
- A retenção permanece em dois meses para eventos e quatorze meses para
  usuários. O baseline limpo será observado de 24/09 a 08/10/2026; Google Ads
  permanece fora do escopo.
- Commit `bdb7608`; deployment
  `dpl_9Cbsri68KvXY6t4ppoPsn2WtqNz4` READY no domínio canônico.

## Change 055 — Auditoria live da descoberta (26/08/2026)

- Gemini e Supabase foram verificados com sucesso.
- O endpoint do Research Starter está acessível, mas a credencial de produção
  retornou `HTTP 401 unauthorized`; a tela agora identifica esse caso como
  integração que precisa ser atualizada, em vez de informar indisponibilidade
  temporária.
- O briefing permanece salvo para retry. O modo rápido não grava mais a mesma
  frase nos cinco campos estruturados; projetos legados com essa duplicação são
  compactados antes da interpretação.
- Para concluir a validação live, substituir `RESEARCH_STARTER_API_KEY` no
  ambiente Production da Vercel por uma chave válida e executar os smokes
  novamente. O segredo não deve ser registrado em código, chat ou logs.
- Versão de código: `v26082026.3`.
- Correção adicional: o Mapa Rápido agora transforma o prompt livre em título e
  problemática antes da validação do servidor; anteriormente o formulário era
  rejeitado com “Revise os campos indicados.”. O endpoint de sugestões continua
  opcional e não bloqueia o envio do mapa.

## Change 056 — Rotação da credencial do Research Starter (26/08/2026)

- A auditoria de produção confirmou que o endpoint do Research Starter estava
  acessível, mas a credencial usada pelo Mapa retornava `401 unauthorized`.
- A integração foi isolada com a variável de servidor
  `RESEARCH_STARTER_MAPA_API_KEY` no Mapa. O cliente prioriza essa variável e
  mantém `RESEARCH_STARTER_API_KEY` apenas como fallback para instalações locais
  legadas; nenhuma chave é exposta ao navegador, ao código público ou aos logs.
- No Research Starter, uma nova credencial singular foi configurada em
  `RESEARCH_STARTER_API_KEY`, sem remover as configurações legadas. O serviço foi
  publicado novamente no deployment `dpl_HWfjvgKuJhB9cbEAdVVox2XUjJ6h` e o alias
  `https://researchstarter.vercel.app` ficou atualizado.
- O Mapa foi publicado novamente com a credencial correspondente e com a
  versão pública `v26082026.4`. O deployment de produção é
  `dpl_6ZM7hdfXVZdvz1qqFeNTTfzymEkr`, aliasado a
  `https://mapadapesquisa.com.br`.
- O health público retornou `status=ok`, `version=v26082026.4` e os quatro
  provedores como `configured`. Os logs após a publicação não registraram nova
  chamada de descoberta nem novo `401`; a confirmação funcional final ocorre ao
  clicar em **Tentar novamente** no projeto que manteve o briefing salvo.
- A validação local continua exigindo uma chave própria em `.env.local`; o
  Vercel não permite recuperar segredos sensíveis por `env pull`, portanto esse
  arquivo não foi sobrescrito nem recebeu marcador de segredo.

## Change 057 — Coerência metodológica em tempo real e encerramento visível (26/08/2026)

- Os avisos de coerência da Etapa 6 agora são derivados dos valores que estão
  sendo editados na tela. Alterações em levantamento, análise/tratamento,
  classificação ou instrumentos atualizam a lista sem depender de salvar,
  regenerar ou fazer uma nova chamada de IA.
- Avisos persistidos da execução anterior não são reutilizados como diagnóstico
  atual; quando a combinação editada não apresenta alertas, a interface informa
  explicitamente **Coerência atualizada**.
- A página final passou a exibir um painel destacado **Encerramento do projeto**
  com o botão **Encerrar projeto**. O estado de espera do orientador e o estado
  já concluído têm mensagens próprias, evitando a impressão de que o botão
  desapareceu ou está disponível antes da validação necessária.
- A própria Etapa 6 orienta que o painel de encerramento aparece após a
  validação. O fluxo continua bloqueando o encerramento enquanto houver revisão
  do orientador ou pendências de integridade.
- CPD local: lint, typecheck, 78 testes, verificação de exportações e build de
  produção aprovados. A versão desta entrega é `v26082026.6`.
- Deployment de produção: `dpl_D1cYCtXUf1vefpznkZoxVYfoRr3Z` (READY),
  aliasado a `https://mapadapesquisa.com.br`.
- Smoke público: `/api/health` retornou `status=ok`, versão `v26082026.6` e os
  quatro provedores configurados; `/login` retornou `200` com cabeçalhos de
  segurança ativos.

## Change 058 — Auditoria da lista de melhorias de 01/09/2026

A lista foi confrontada com o código e com os artefatos publicados. Os itens abaixo
já estavam presentes e foram confirmados: entrada estruturada, produto acadêmico e
guia de profundidade, recuperação do briefing, cards da home e do dashboard, títulos
dos projetos, cobertura dos objetivos nos capítulos 2 e 4, otimização da literatura,
PDF final com registro CBL, impactos/recomendações, recuperação de senha, coerência
em tempo real e encerramento visível. O diagnóstico do Research Starter continua
dependente da credencial de produção e deve ser validado com uma chamada live após
qualquer rotação de chave.

Na checagem desta rodada, Gemini respondeu com o schema esperado e o Supabase foi
confirmado no projeto `aeaweherkrqmlqnxsmib`. A credencial legada disponível no
`.env.local` retornou `HTTP 401`; a Vercel possui `RESEARCH_STARTER_MAPA_API_KEY`
separada em Production, mas o valor secreto não pode ser recuperado pela CLI. A
validação funcional de produção continua sendo o único passo externo: executar uma
nova tentativa no mapa que preservou o briefing depois de confirmar essa chave no
Research Starter.

As divergências de interface e fluxo foram transformadas nas Changes 059–062.

## Change 059 — Mapa Rápido: texto de exemplo e sugestões numeradas

- O placeholder agora começa por `Exemplo: Crie um roteiro de dissertação de mestrado...`.
- As três alternativas aparecem como **Tema 1**, **Tema 2** e **Tema 3**.
- O fallback local e a resposta da IA não exibem mais os prefixos “Tema de pesquisa”,
  “Investigar” ou “Analisar”; a normalização do cliente também protege respostas
  antigas do provedor.
- Versão de código desta rodada: `v26090126.1`.
- Deployment de produção: `dpl_GL7EVTzw28m48ELC1m5WofVzC5Zc`, aliasado a
  `https://mapadapesquisa.com.br`; `/api/health` retorna `v26090126.1`.

## Change 060 — Metodologia como Etapa 4 na interface

- A navegação mostra quatro blocos: Problemática, Objetivos, Capítulos e Metodologia.
- Estados, overlay, página consolidada e leitura do orientador usam **Etapa 4**.
- O identificador interno `methodology_matrix` e o `stage_number` analítico permanecem
  compatíveis com o workflow v2 existente, evitando migração destrutiva de dados.

## Change 061 — Revisão e promoção de objetivos

- Na etapa de objetivos específicos, o objetivo geral fica visível e editável.
- O usuário pode usar um objetivo específico (quando restarem pelo menos três) como
  objetivo geral; o servidor preserva referências e justificativa, remove o OE original
  e revalida a combinação contra a problemática.
- Alterações do OEG invalidam apenas os descendentes que precisam ser regenerados;
  a validação continua exigindo justificativas e de três a seis objetivos específicos.

## Change 062 — Lembretes de validação aluno–orientador

- O estudante vê **Reenviar aviso ao orientador** quando existe uma revisão pendente.
- O orientador vê **Reenviar aviso ao estudante** na mesma situação.
- O endpoint é autenticado, verifica vínculo/ownership, reutiliza o conteúdo salvo e
  usa o Resend somente no servidor. Não cria uma nova revisão nem altera o workflow.

## Change 063 — Correção das ações de objetivos (04/09/2026)

- A regressão da Change 061 foi localizada no contrato da rota de definição:
  `promoteObjectiveId` era enviado como `null` pela tela quando nenhuma promoção
  havia sido feita, mas o schema aceitava apenas UUID ou campo ausente. O parse
  falhava antes de executar **Voltar**, **Salvar**, **Remover** ou **Validar**.
- A API agora aceita `null` para compatibilidade com clientes em cache, e o
  cliente novo omite o campo opcional. A promoção de um objetivo específico para
  objetivo geral continua preservando referências, justificativa e a regra de
  três a seis objetivos.
- CPD: `npm run check` aprovado (lint, typecheck, 78 testes, `exports:verify` e
  build). A versão pública desta correção é `v26090426.1`.
- Deployment de produção: `dpl_8WgAsNyEEifYdMQZHVLXupNcLuF8` (READY), aliasado a
  `https://mapadapesquisa.com.br`, publicado sem cache e a partir de um diretório
  temporário sem `po_magico`, `.next`, `tmp` ou `node_modules`.
- Smoke pós-deploy: `/login` retornou HTTP 200; `/api/health` retornou `status=ok`
  com Gemini, Resend, Research Starter e Supabase configurados. A consulta de
  logs de erro da última hora não encontrou registros.

## Change 075 — Estabilização operacional de produção (11/09/2026)

- `RESEARCH_STARTER_MAPA_API_KEY` é a única credencial aceita pelo Mapa e
  permanece exclusivamente no backend de Production da Vercel.
- A variável legada `RESEARCH_STARTER_API_KEY` foi aposentada. Não copie o
  segredo oculto de produção para `.env.local`, Preview, código, chat ou logs.
- O smoke oficial é `npm run research-starter:verify:production`: ele autentica
  uma conta E2E no Supabase e chama a rota publicada do Mapa, sem acessar
  diretamente o segredo do Research Starter.
- Uma validação direta local continua possível com uma credencial própria de
  desenvolvimento em `RESEARCH_STARTER_MAPA_API_KEY`; ela não deve reutilizar
  a chave de Production.
- O runtime está fixado em Node.js `22.x`. Os postinstalls de `esbuild` e
  `unrs-resolver`, ambos transitivos de desenvolvimento, ficam explicitamente
  negados enquanto os binários opcionais distribuídos sustentarem lint, testes e
  build.
- O fechamento inclui Next.js 16.3.5, `eslint-config-next` 16.3.5, Resend 6.28,
  Tailwind 4.3.3, PostCSS 8.5.28 e Sharp 0.35.4. O upgrade permaneceu nas versões
  principais existentes e o `npm audit` terminou com zero vulnerabilidades.
- `AGENTS.md` aponta futuras alterações do framework para a documentação
  versionada distribuída em `node_modules/next/dist/docs/`.
- O inventário final contém somente `RESEARCH_STARTER_MAPA_API_KEY` em
  Production; a variável legada foi removida e Preview não possui a credencial.
- Gate local: lint, tipos, 90 testes, exportação e build aprovados; scanner do
  projeto aprovado e `npm audit` com zero vulnerabilidades.
- Deployment final: `dpl_A96gpBn81Z4Rfu5tqDxoRpYKACZi` (READY), artefato
  `https://mapadapesquisa-okupy0d8z-msr-brs-projects.vercel.app`, aliasado a
  `https://mapadapesquisa.com.br`.
- Smoke pós-deploy: domínio HTTP 200, health `status=ok`, Research Starter HTTP
  200 com três referências e nenhum log de erro nos dez minutos inspecionados.

## Change 076 — Clareza dos perfis e interface contextual (12/09/2026)

- Os perfis Aluno e Orientador continuam existindo e permanecem associados à
  conta após a escolha inicial.
- O menu voltou a exibir o nome explícito do perfil e o dashboard mostra
  `Perfil Aluno` ou `Perfil Orientador`; `Criação de projetos` e `Revisão de
  projetos` aparecem apenas como área de trabalho.
- Não existe ação de troca de papel. O campo `E-mail do orientador` fica visível
  somente no perfil Aluno, enquanto referências ao estudante permanecem válidas
  no contexto de revisão de um projeto compartilhado.
- O E2E com duas contas confirmou novo login, isolamento, vínculo, bloqueio de
  edição pelo orientador, comentários, correção, aprovações, mapa final e
  referências.
- Gate local: lint, tipos, 92 testes, exportação e build Next.js 16.3.5
  aprovados.
- Deployment: `dpl_AsVvML65fECUU2XfhCGaFN4anYGd` (READY), aliasado a
  `https://mapadapesquisa.com.br`; domínio HTTP 200, health `status=ok` e nenhum
  erro encontrado nos logs inspecionados.

## Change 077 — Menu de perfil conciso (12/09/2026)

- O menu da conta mantém somente o cabeçalho `Perfil da conta` e a identificação
  explícita `Aluno` ou `Orientador`.
- A descrição da área de trabalho e o aviso de permanência foram removidos, assim
  como o campo de apresentação e o CSS que ficaram sem uso.
- Seleção inicial, persistência e permissões dos perfis não foram alteradas.
- Gate final: lint, tipos, 93 testes, exportação, build Next.js 16.3.5, auditoria
  de dependências e scanner de segurança aprovados.
- Deployment: `dpl_HiCEa53yXkM9b2AWbnHvruEJ2vb1` (READY), aliasado a
  `https://mapadapesquisa.com.br`; domínio HTTP 200, health `status=ok` e nenhum
  erro encontrado nos logs inspecionados.

## Change 078 — Vídeo promocional para redes sociais (12/09/2026)

- Peça vertical de 15 segundos produzida em 1080 × 1920, 30 fps e H.264, com
  trilha instrumental original.
- A abertura usa uma cena humana original; logo, textos, cartões, figuras, link
  e QR Code foram compostos deterministicamente para preservar conteúdo exato.
- O encerramento mantém o QR Code estático por mais de quatro segundos e aponta
  para `https://mapadapesquisa.com.br`; a leitura foi confirmada tanto no PNG
  isolado quanto no quadro final.
- Os ativos de publicação, quadros de inspeção, hashes e proveniência estão em
  `outputs/social-promo-c78/`; o gerador reproduzível está em
  `scripts/generate-social-promo-c78.swift`.
- Esta Change não alterou nem republicou a aplicação em produção.

## Change 079 — Vídeo promocional premium, versão 2 (12/09/2026)

- A versão 1 da C78 foi preservada sem qualquer alteração; o vídeo novo usa o
  diretório independente `outputs/social-promo-c79/`.
- O gancho `TRAVOU?` aparece em 0,3 segundo, seguido por problema, transformação
  no app, benefícios e conversão. O ato central mostra Problemática, Objetivos,
  Capítulos e Metodologia em um mockup animado.
- A música anterior foi substituída por uma faixa eletrônica instrumental gerada
  pelo catálogo Astral, ID `aa1ba64cd12042e89800c7356498ff40`, com fade local.
- Logo, textos, interface e QR Code continuam determinísticos. Vision confirmou
  o endereço `https://mapadapesquisa.com.br` dentro do quadro final.
- O pacote inclui MP4, música-fonte, cena, capa, quatro quadros de inspeção,
  relatório técnico, manifesto e proveniência. Não houve deploy do aplicativo.

## Change 080 — Roteiro promocional para NotebookLM (12/09/2026)

- O roteiro canônico está em `docs/notebooklm-promo-video.md`, com configuração
  recomendada, prompt para Personalizar, narração, indicações visuais e textos de
  tela.
- A narrativa cobre impacto, problema, solução, modos Rápido e Avançado, IA sob
  controle do usuário, colaboração Aluno–Orientador e CTA.
- Logo, tagline, URL e QR Code foram classificados como conteúdo exato e devem
  ser aplicados na pós-produção. O gerador deve apenas reservar a área final.
- A duração de 45–60 segundos é alvo narrativo; a plataforma pode variar a saída.
- Esta Change não gerou vídeo, não alterou o aplicativo e não realizou deploy.

## Change 081 — Vídeo de apresentação na landing page (12/09/2026)

- O MP4 fornecido foi copiado sem recompressão para
  `public/media/mapa-da-pesquisa-apresentacao.mp4`; o SHA-256 permaneceu
  `8c1e80c2a52c7a27fd5e14805d9ed93043ce6b7609f8a643731cd3c2f841418a`.
- A landing `/home.html` exibe o vídeo logo após o hero e oferece o atalho
  `Assistir ao vídeo`.
- O player usa controles nativos, `playsInline`, 576 × 976, poster real e
  `preload="none"`, sem autoplay.
- O layout usa duas colunas no desktop e uma coluna no celular.
- O arquivo mede 12.256.548 bytes e dura aproximadamente 1 min 17 s.
- Gate final: `npm run check` aprovado, incluindo lint, tipos, 96 testes,
  exportação e build Next.js 16.3.5; auditoria de dependências sem
  vulnerabilidades e scanner de segurança aprovado.
- Commit de implementação: `d212165`, enviado à branch
  `codex/change-003-004`.
- Deployment: `dpl_G8kNnBN9DayztcX1VM3U9EbuwUUU` (READY), artefato
  `https://mapadapesquisa-46zyde7ka-msr-brs-projects.vercel.app`, aliasado a
  `https://mapadapesquisa.com.br`.
- Smoke pós-deploy: landing, vídeo e poster HTTP 200; requisição parcial do MP4
  HTTP 206; health `status=ok`, inspeção visual aprovada e nenhum erro nos logs
  consultados.

## Change 088 — Homologação E2E e rollout de modos (17/09/2026)

- A mesma conta pode alternar Aluno→Orientador→Aluno em Configurações; a escolha
  persiste entre logins e a versão do perfil impede gravações de abas obsoletas.
- Cada modo mantém biblioteca própria por `authoring_role`. Projetos de
  Orientador são autônomos; projetos de Aluno podem ser vinculados para revisão,
  sem permitir edição acadêmica ou autoaprovação pelo orientador.
- O E2E remoto usa duas contas sintéticas, restaura os modos originais e remove
  projetos/workflows temporários em `finally`.
- PDF e Word estão disponíveis para versões salvas e mapas finais, com a mesma
  autorização, identificação de rascunho e `Cache-Control: private, no-store`.
- Gate local: lint, tipos, 119 testes, PDF/DOCX, build Next.js 16.3.5, scanner de
  segurança e auditoria npm aprovados.
- Integrações: Gemini estruturado e Research Starter de produção com HTTP 200 e
  três referências.
- DNS: estratégia A mantida; NS externos `d.sec.dns.br`/`e.sec.dns.br`, A
  `76.76.21.21`, MX preservado e `www` deliberadamente ausente. Nenhuma
  mudança de DNS ocorreu nesta janela.
- Commit funcional `c8bdc4e`; versão `v17092026.1`; deployment
  `dpl_FRVTWXQUpRtJBbUEotEmWV9TEtjp` READY e aliasado ao domínio canônico.
- Health `status=ok`, quatro provedores configurados e nenhum erro encontrado
  nos logs pós-rollout.

## Change 089 — Orientador obrigatório para avanço do Aluno (19/09/2026)

- A migration `20260919123000_c089_require_student_advisor_approval.sql` foi
  aplicada no projeto `aeaweherkrqmlqnxsmib` pelo SQL Editor autenticado.
  Função e trigger passaram de ausentes para presentes.
- A CLI Supabase retornou 403 por privilégio insuficiente de organização; o
  caminho alternativo foi executado somente após conferir projeto, conteúdo
  integral do arquivo e resultado da transação.
- O E2E remoto confirmou recusa do avanço sem orientador, workflow inalterado,
  vínculo, correção, sete aprovações, conclusão, referências, PDF/DOCX,
  isolamento, persistência dos modos e cleanup.
- As matrizes RLS consciente do modo, autenticada e anônima passaram.
- Gate final: lint, tipos, 123 testes, exportações e build Next.js 16.3.5.
- O smoke autenticado encontrou e corrigiu uma mensagem residual de supervisão
  opcional; a interface final informa supervisão obrigatória para avançar.
- Versão pública `v19092026.1`; deployment
  `dpl_DHKUXF8BMmtdBjd2tTDQ5SFZRYYe` READY e aliasado ao domínio canônico.
- Health `status=ok`, quatro provedores configurados; Research Starter HTTP
  200 com três referências; Gemini estruturado válido; nenhum erro ou HTTP 500
  encontrado nos logs pós-rollout.

## Change 090 — Orientação do campo do Mapa Rápido (22/09/2026)

- Placeholder publicado exatamente como: “Informe as palavras-chave (mínimo
  duas) ou escreva o tema da pesquisa.”
- O componente compartilhado atende landing page e dashboard; sugestões,
  seleção em um clique e avanço não foram alterados.
- Gate final: lint, tipos, 123/123 testes, PDF/DOCX e build Next.js 16.3.5.
- Smoke DOM headless expandiu o Mapa Rápido e confirmou o campo renderizado em
  desktop e viewport móvel de 390 px; o texto antigo ficou ausente.
- Commit funcional `40ae82f`; versão `v22092026.1`; deployment
  `dpl_BBVx5u3EUhR8pJ5Dito77vaSV7R1` READY e promovido ao domínio canônico.
- Health `status=ok`, quatro integrações configuradas, home HTTP 200, dashboard
  anônimo redirecionado ao login e nenhum erro encontrado nos logs pós-rollout.
