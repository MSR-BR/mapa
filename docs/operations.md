# Operação do Mapa da Pesquisa

## Ambiente

- Produção: `https://mapadapesquisa.com.br`
- Versão pública: `v26082026.1` (26/08/2026; correção do erro 500 no login e início do mapa)
- GA4 Measurement ID: `G-MKFYYRZG87` (carregado somente após consentimento)
- Vercel Functions: `gru1` (São Paulo), uma única região compatível com o plano Hobby.
- Supabase: projeto `aeaweherkrqmlqnxsmib`, plano Free, região `sa-east-1`.
- Gemini e Research Starter: chaves exclusivamente server-side.

## GA4 — Change 054

O Measurement ID `G-MKFYYRZG87` só é carregado depois que o usuário aceita
métricas. Ao recusar, o script e os eventos não essenciais não são carregados.
Os eventos usam somente valores enumerados e não incluem prompt, texto
acadêmico, e-mail, nome, UUID, comentário, resposta de provedor ou stack trace.

### Eventos disponíveis

`consent_choice`, `login_started`, `login_success`, `login_failed`, `logout`,
`profile_role_selected`, `project_start`, `project_draft_saved`,
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

Os parâmetros são limitados a `auth_state`, `profile_role`, `source`,
`entry_mode`, `product_type`, `stage`, `result`, `reason_code`,
`reference_count_bucket`, `has_advisor` e `stage_number`. A camada central
converte qualquer valor fora da lista para `unknown`.

### Como acompanhar o uso

No GA4, cadastrar em **Administração → Definições personalizadas → Dimensões
personalizadas** os parâmetros `auth_state`, `profile_role`, `source`,
`entry_mode`, `product_type`, `stage`, `result`, `reason_code`,
`reference_count_bucket` e `has_advisor` como dimensões de evento. Não criar
dimensões para prompts, títulos, e-mails ou identificadores.

Criar os funis com as sequências:

1. `login_success` → `project_start` (ativação autenticada);
2. `project_start` → `project_completed` (conclusão em coorte de 7/30 dias);
3. `advisor_link_succeeded` → `stage_submitted` → `advisor_approved` (validação
   do orientador).

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
