# Estado do projeto

## Blueprint

- Primário: APP v2.7.
- Secundários: SOFTWARE e AI SYSTEM.
- Transversal: DIGITAL DISCOVERY & GROWTH v1.3.

## Estado atual

- C116 concluída e publicada em **`v08102026.3`**, release `33c2309`: + abre e − recolhe cada modo público, permitindo ambos fechados e preservando texto/seleção. Avançado segue fechado por padrão. 211 testes/build, 11 estados locais (desktop, celular e teclado), 7 estados no domínio canônico, health e logs conferidos. [CPD](changes/116-mapa-mode-collapse/cpd-2026-10-08.md).

- C115 concluída e publicada em **`v08102026.2`**, release `08e4798`: entrada com três superfícies distintas, menos caixas aninhadas, Rápido aberto/Avançado fechado por padrão. Links explícitos e rascunhos preservados. 211 testes/build aprovados; versão, health, modos, cores, desktop/celular e logs conferidos em produção. [CPD](changes/115-mapa-entry-visual-hierarchy/cpd-2026-10-08.md).

- C114 concluída e publicada em **`v08102026.1`**, release `702d3ee`: landing com entrada dedicada `/mapa`, regeneração por quadro com salvamento prévio, Voltar/Próximo esclarecidos e literatura aditiva com recuperação de tópicos. 211 testes, 13 cenários de rotas, regressão C111, UI local e build padrão aprovados. Produção confirmou versão, links, modos públicos, SEO técnico, health e bloqueios 401/403; logs consultados sem erros. Sem novo smoke pago. [CPD](changes/114-landing-card-regeneration/cpd-2026-10-08.md).

- C113 concluída/versionada em `ce97e4d`: smoke Gemini corrigido por modelo e contrato HTTP testado com transporte simulado. Runtime 3.6 preservado; vínculo com o aviso de 07/10 **não confirmado**. Sem chamada paga ou troca de modelo. [Auditoria e fechamento](changes/113-gemini-deprecated-parameters/audit-2026-10-07.md).

- Acompanhamento de **08/10**, já realizado antes deste CPD: Ads Mapa Enabled / Eligible (Learning), acumulado **2 impressões/0 cliques/€0,00**. GA4 reconciliou 06/10 (12 sessões, 279 eventos, 3 project_start totais, sem not set); QA excluído da avaliação e uso interno ainda não segmentado. 07/10 permanece intraday com divergências; atribuição/conversão paga não validadas. Regra horária sem alterações; nenhuma configuração externa salva. [Registro diário](changes/110-google-ads-controlled-pilot/monitor-2026-10-08.md). Os números de 06/10 abaixo são históricos.

- C112 concluída e publicada em **`v06102026.4`**: Gemini principal, GPT complementar/fallback limitado e progresso identificado por provedor. Teto adicional US$5/mês com reserva prévia e bloqueio; 197 testes e smoke autenticado Gemini → GPT aprovados, sem alterar o conteúdo acadêmico vigente. Health canônico reconfirmado `ok` no fechamento documental de 06/10. [CPD C112](changes/112-collaborative-ai-provider-progress/cpd-2026-10-06.md).
- C111 concluída e publicada inicialmente em `v06102026.3`, preservada na C112: navegação independente do progresso, rascunhos/contexto, propostas com aceite, histórico paginado e recuperação. Migração dos 117 projetos preservou 4.105 versões antigas e criou 451 unidades iniciais. 182 testes, grants/RLS, Chromium/WebKit, exportações e build aprovados; runtime sem vulnerabilidades, alerta dev-only do ESLint registrado. CPD em `changes/111-free-navigation-versioned-context/`.
- C109 concluída e entregue à C110: vínculo GA4 550650234, conversão 7825220596 e objetivo exclusivo do Mapa na MSR-BR 383-835-9068. Piloto C110 ativo de 06 a 12/10, €2/dia em média, CPC máximo €0,30, regra horária >= €14 e acompanhamento diário. Última consulta de 06/10: Enabled / Eligible (Limited), RSA aprovado, 1 impressão, 0 cliques e €0,00. Diagnóstico recomenda outra estratégia de lances e informa aprendizado; nenhuma recomendação aplicada. TERMO preservado conforme registros de escopo/associações da C109.
- C108 confirma coleta GA4 e agora dados processados no relatório de 06/10 (2 sessões, 7 eventos, 0 eventos-chave). Isso não comprova atribuição paga nem exclui tráfego técnico. Baseline, atribuição, segmentação interna e avaliação final do piloto permanecem abertas. [Fechamento documental e limites](changes/110-google-ads-controlled-pilot/cpd-documental-2026-10-06.md).

- C107 concluída e publicada em `v01102026.4`: objetivo geral revisável e
  cada OE em card independente, ações no rodapé e colunas adaptadas à largura
  disponível. Corrige a compressão/sobreposição reportada após C106. Workspace
  real com fixture sintética passou 28 cenários Chromium/WebKit, 320–1440 px,
  Aluno/Orientador; 156 testes e build aprovados. Produção confirmou versão,
  CSS dos cards, home/login e negação anônima/cross-site. Sem alterações de IA,
  persistência, banco ou regras de perfil.

- C106 concluída e publicada em `v01102026.3`: problemática, objetivos,
  capítulos e metodologia distinguem contexto acadêmico persistente de pedido
  pontual à IA; o ⓘ explica o uso e os placeholders não trazem exemplos.
  Contexto recém-digitado chega à regeneração sem virar instrução exportada;
  156 testes, build, segurança e UI isolada Chromium/WebKit desktop/mobile
  aprovados. Health, login e bloqueios anônimo/cross-site confirmados no
  domínio canônico. E2E autenticado de regeneração real não foi executado.

- C105 concluída e publicada em `v01102026.1`: referências por DOI via
  Crossref/DataCite, metadados parciais editáveis, cadastro manual preservado,
  154 testes e Chromium/WebKit desktop/mobile aprovados. Consultas reais e
  preservação do texto manual homologadas na sessão autenticada de produção,
  sem salvar referências de teste. CPD em `changes/105-doi-reference-autofill/`.

- Change 091 cancelada antes da criação do aplicativo ou das credenciais LinkedIn.
- Changes 001–090, 092–096, 098–099 e 101–103 concluídas conforme `.specs/roadmap.md`.
- C097 está implantada e em observação até 08/10/2026.
- C099 foi concluída: raiz canônica única, redirect legado, indexação, cards,
  dados estruturados, poster e desempenho publicados em 24/09/2026.
- C100 implantou consentimento e semântica dos eventos. O aceite completo da
  medição permanece em acompanhamento na C108; a autorização revisada de 06/10
  permitiu o piloto C110 após os checks operacionais, sem declarar a baseline concluída.
- C101 está publicada em produção. O Gemini 3.6 Flash mede as 13 operações sem
  conteúdo sensível; plano e limites foram preservados até existir baseline.
- C102 está publicada em produção na versão `v24092026.3`. O projeto possui
  classificação `S3_SENSITIVE`, gate de release e logs de runtime sanitizados.
- C103 está concluída localmente: o estado versionado do Supabase tem oito
  tabelas, doze funções, grants/RLS explícitos e gate PostgreSQL descartável;
  não houve acesso remoto nem nova migration.
- C104 foi concluída em produção no projeto confirmado. A 19ª migration removeu
  privilégios legados excedentes; readback, grants, RLS, 28 policies, 12
  funções, schema `private`, negação anônima e gates PostgreSQL 17 passaram. O
  E2E Google Aluno–Orientador aprovou bloqueio, revisão, avanço, autonomia do
  Orientador, limpeza das fixtures e restauração dos perfis originais.
- Autenticação exclusiva pelo Google homologada em produção; entrada, cadastro
  e recuperação por senha foram retirados e o provedor Email foi desativado.
- Projetos criados no modo Aluno podem ser editados e salvos como rascunho,
  mas só avançam após informar o e-mail e receber a aprovação do Orientador.
- Projetos criados no modo Orientador permanecem autônomos, sem supervisor
  externo.
- Troca de perfil, bibliotecas por autoria, revisão vinculada e exportações
  PDF/DOCX permanecem homologadas em produção.

## Decisões-chave

- Aplicação Next.js publicada na Vercel em `https://mapadapesquisa.com.br`.
- Supabase é responsável por banco e autenticação; RLS e triggers protegem os
  dados e as transições críticas.
- Gemini, GPT e Research Starter são acessados somente pelo backend.
- `RESEARCH_STARTER_MAPA_API_KEY` permanece o nome canônico da credencial
  server-side do Research Starter.
- Em produção, a mesma conta pode alternar o modo ativo entre Aluno e Orientador
  nas configurações; a troca não altera a autoria dos projetos existentes.
- O modo ativo é persistido no banco, versionado e trocado apenas por RPC; JWT,
  metadata e armazenamento local não são fontes de autorização.
- Cada projeto tem `authoring_role` imutável. Identidade, modo ativo, autoria e
  vínculo de supervisão são dimensões separadas.
- Ambos os perfis criam projetos Rápidos/Avançados e mantêm sua biblioteca
  própria. Projetos de Aluno exigem aprovação do Orientador para cada avanço;
  projetos de Orientador são autônomos.
- Avisos acadêmicos orientam sem bloquear; integridade técnica, autorização e
  aprovação humana continuam obrigatórias.
- A jornada usa quatro macroetapas; etapas existentes podem ser revisitadas em
  ambas as direções sem apagar conteúdo. Rascunhos não substituem contexto validado.
- DNS externo funcional permanece aceito. Qualquer delegação ou alteração de
  e-mail/DNS exige Change e autorização próprias.
- O alvo de autenticação é exclusivamente Google OAuth. LinkedIn foi cancelado.
- “Retirar login por e-mail” significa retirar cadastro, entrada, recuperação e
  troca de senha. O endereço de e-mail permanece como identidade/contato e no
  vínculo entre Aluno e Orientador.
- Usuários, identidades e senhas existentes não são apagados no corte; isso
  preserva rollback. Identidades divergentes não são fundidas automaticamente.

## Estado validado mais recente

A C104 foi preparada em 24/09/2026 contra o projeto confirmado
`aeaweherkrqmlqnxsmib` (`mapa-da-pesquisa`, PostgreSQL 17, saudável). As 18
migrations remotas coincidiam com o repositório antes da correção. A Data API
recusou o schema `private` com `PGRST106`, o papel anônimo não acessou projetos
ou workflows, e a leitura de metadados confirmou oito tabelas com RLS, 28
policies, doze funções, zero views/sequences próprias, bucket privado e três
policies de Storage. O Security Advisor retornou quatro warnings e nenhum erro:
três RPCs `SECURITY DEFINER` intencionais, com `auth.uid()`, modo/propriedade,
`search_path` vazio e `EXECUTE` mínimo, e proteção de senha vazada não aplicável
ao login público Google-only. A reconsulta pós-migration pelo conector não teve
permissão; essa evidência foi mantida como leitura imediatamente anterior ao
push, e não como uma nova aprovação.

A mesma auditoria provou uma lacuna não detectada pela C103: defaults legados
mantinham `TRUNCATE`, `TRIGGER` e `REFERENCES` para `authenticated`, acesso
amplo de `service_role` às tabelas e `EXECUTE` excedente em funções. A migration
`20260924222657_c104_reduce_legacy_explicit_grants.sql` revoga tudo nos objetos
próprios e recompõe somente o contrato do manifesto. Ela não muda RLS, dados,
Auth, schemas expostos nem os defaults globais de objetos futuros. O gate agora
simula os defaults legados e falha para privilégios excedentes. `npm run check`
aprovou 141/141 testes e build; os gates PostgreSQL 17 de 19 migrations, modo
Aluno/Orientador e aprovação humana passaram; `security:gate` terminou em
`PASS_WITH_ACCEPTED_RISK` e zero vulnerabilidades. Após autorização exata, o
dry-run listou somente a C104, a migration foi aplicada sem Vault/seeds/roles e
o readback confirmou 19 migrations e ACLs mínimas. O runner legado recebeu HTTP
422 antes de qualquer mutação, e a prova foi concluída pela interface real com
duas contas Google autorizadas. O Aluno ficou bloqueado até a aprovação do
Orientador, avançou para Objetivo geral após a revisão, e o Orientador criou um
projeto próprio sem supervisão. As fixtures foram excluídas e os perfis
restaurados. A decisão final da C104 é `PASS_WITH_ACCEPTED_RISK`, sem pendência
própria da change.

A C103 foi concluída localmente em 24/09/2026. As 18 migrations foram
inventariadas e aplicadas em PostgreSQL 17 descartável. O manifesto confirmou
oito tabelas públicas com RLS, 28 policies, doze funções com `EXECUTE` mínimo,
zero views e zero sequences próprias. O verificador rápido agora integra
`npm run check`, e `npm run supabase:release-gate` reproduz a prova pesada. O
estado já estava completo, portanto nenhuma migration foi criada. Consultas,
testes autenticados, Dashboard e alterações do Supabase remoto não foram
executados; permanecem isolados na C104 e exigem autorização específica.

A C102 foi concluída e publicada em 24/09/2026. A auditoria transversal
confirmou autenticação/autorização central, RLS nas oito tabelas públicas,
CSP, proteção de origem, webhook assinado, bucket privado e rate limits
públicos. Logs diretos de runtime foram substituídos por eventos estruturados
que descartam mensagens brutas e identificadores de usuário. O gate terminou
em `PASS_WITH_ACCEPTED_RISK`: rate limit por instância, ausência de antivírus
em anexos recebidos, provas remotas periódicas e grants explícitos do Supabase
permanecem visíveis como limites. O commit de release é `e1c2d68` e o
deployment `dpl_DRGswwUxxkeknfoD5mhkE6RMrXUH` está READY no domínio
canônico, versão `v24092026.3`. Health, cabeçalhos, rejeição do webhook sem
assinatura e logs sem erros passaram. Não houve migration, grant, policy ou
consulta Supabase; apenas o identificador público de versão foi atualizado na
Vercel. O rollback permanece `dpl_FhQ6hF6zvk2zWhHcN9HDcw1km13B`.

A C101 foi implementada localmente em 24/09/2026. As 13 operações Gemini agora
têm observabilidade estruturada de modelo, duração, tokens, término, avisos e
falhas normalizadas. Prompts, conteúdo gerado, dados pessoais, segredos e
mensagens brutas do provedor não entram nos logs. Os limites foram
centralizados sem redução, o modelo padrão continua `gemini-3.6-flash` e o
raciocínio continua `minimal`. O deployment
`dpl_FhQ6hF6zvk2zWhHcN9HDcw1km13B` está READY no domínio canônico, versão
`v24092026.2`. Health, smokes Gemini isolado/canônico, telemetria sanitizada e
logs sem erros passaram. O rollback permanece
`dpl_5fuuXKdrcddu8FsNzQDBuyVh4Sex` (`v24092026.1`).

A C099 foi concluída em 24/09/2026. A raiz incorporou a landing e preservou os
modos Rápido/Avançado; `/home.html` responde 308; sitemap contém somente a
raiz; rotas privadas emitem noindex sem bloqueio contraditório no robots; OG,
Twitter, WebApplication e Offer gratuito foram publicados. O card social
1200×630 e o poster WebP têm geração e hashes reproduzíveis.

O deployment `dpl_5fuuXKdrcddu8FsNzQDBuyVh4Sex` está READY no domínio
canônico, versão `v24092026.1`. Health, metadados, redirect, assets, vídeo,
alternância Rápido/Avançado, viewport móvel de 390 px e logs passaram.
Lighthouse móvel final marcou 95–96 em performance, 100 em acessibilidade, 96
em boas práticas e 100 em SEO; LCP variou entre 2,7 e 3,0 s, contra 7,1 s na
landing antiga. O Search Console aceitou novamente o sitemap e passou de duas
para uma página descoberta.

O Pó Mágico evoluiu para `v20260924.003`, com Digital Discovery & Growth v1.3:
uma migração canônica só fecha após provar redirect, canonical, sitemap,
robots/noindex crawlable, readback do provedor e múltiplas amostras de
desempenho em produção.

A C098 criou e verificou em 24/09/2026 a propriedade de domínio
`sc-domain:mapadapesquisa.com.br` por um único TXT no apex. O registro propagou
nos dois autoritativos, no resolvedor local e no Cloudflare; A, MX, DMARC, DKIM,
SPF, DS e DNSKEY permaneceram intactos. A raiz está indexada, `/home.html` está
acessível mas ainda desconhecida e autocanônica, `/login` está bloqueada por
`robots.txt`, e HTTP redireciona para HTTPS. Performance e Pages ainda
processam; Core Web Vitals não tem volume suficiente. O sitemap foi processado
com sucesso, com duas páginas descobertas e zero vídeos. A associação com a
propriedade GA4 `550650234` e o stream `15460310071` foi confirmada e está
visível nos dois produtos. A C098 foi encerrada sem alteração de código ou
deploy.
O Pó Mágico evoluiu para `v20260924.002`, com Digital Discovery & Growth v1.2.

A C96 foi concluída em 23/09/2026 sem mutação de produção. A auditoria confirmou coleta GA4 ativa, 42 eventos e 11 dimensões, mas encontrou atribuição contaminada pelo parâmetro `source`, zero key events, funil vazio, filtro interno em Testing, ausência de vínculo Search Console e duas homes canônicas. Lighthouse mobile marcou 95/LCP 2,9 s na raiz e 76/LCP 7,1 s em `/home.html`. A skill `digital-discovery-audit` foi validada e o Pó Mágico evoluiu para `v20260923.002` com o blueprint transversal Digital Discovery & Growth v1.0. C097–C100 foram especificadas e não executadas.

A C95 foi concluída em 23/09/2026. O Registro.br publicou
`_dmarc.mapadapesquisa.com.br` como
`v=DMARC1; p=none; rua=mailto:suporte@mapadapesquisa.com.br`. Os dois
autoritativos e o Cloudflare responderam o novo TXT; A, MX, DKIM, SPF do
Return-Path, DNSSEC e nameservers foram preservados. O site e health retornaram
HTTP 200, e o envio técnico pelo suporte de produção passou. O CPD aprovou 128
testes, build, segurança, 18 migrations alinhadas, trigger remoto ativo e duas
provas PostgreSQL 17 do modo Aluno/Orientador.

A C93 eliminou o 403 da CLI e reconciliou apenas o histórico da migration C89
após verificar a função e o trigger existentes. A C94 inventariou a zona e
confirmou que não deveria ser criado SPF adicional no domínio raiz.

A C92 foi homologada em 22/09/2026. Google é o único método público de
autenticação; Email foi desativado no Supabase sem excluir identidades e a flag
LinkedIn foi removida da Vercel. Login e logout Google reais passaram antes e
depois do corte. O deployment `dpl_8ppqxCmDQEYDdMSFuGQuFgBk1PL1` está READY
no domínio canônico, versão `v22092026.3`; health, rotas legadas, callback,
logs e telas desktop/móvel passaram. O novo aceite legal permanece para o
próprio usuário concluir.

A C91 foi cancelada porque o LinkedIn exige uma Página elegível e o responsável
decidiu não criar uma Página pública para o produto. Nenhum aplicativo, Client
ID ou Client Secret LinkedIn foi criado.

A C90 foi homologada na Vercel em 22/09/2026. O Mapa Rápido mostra o placeholder
exato solicitado no componente compartilhado da landing page e do dashboard,
sem alterar sugestões, seleção ou avanço. O deployment
`dpl_BBVx5u3EUhR8pJ5Dito77vaSV7R1` está READY no domínio canônico, versão
`v22092026.1`; health, bundle, smoke DOM desktop/móvel e logs passaram.

A C89 foi homologada no Supabase e na Vercel. A migration
`20260919123000_c089_require_student_advisor_approval.sql` instalou a função e
o trigger de proteção; consultas antes/depois confirmaram `false/false` e
`true/true`.

O E2E remoto com duas contas confirmou recusa de avanço sem orientador sem
alterar o workflow, vínculo, leitura supervisionada, bloqueio de edição pelo
Orientador, comentário/correção, sete aprovações, conclusão do mapa, referências,
PDF/DOCX, troca e persistência dos modos, isolamento e cleanup. As matrizes RLS
consciente do modo, autenticada e anônima também passaram.

O deployment `dpl_DHKUXF8BMmtdBjd2tTDQ5SFZRYYe` está READY e aliasado a
`https://mapadapesquisa.com.br`, versão `v19092026.1`. Health retornou
`status=ok` com Supabase, Gemini, Research Starter e Resend configurados.
Research Starter retornou HTTP 200 e três referências; Gemini 3.6 Flash entregou
schema estruturado válido. Não foram encontrados erros nem HTTP 500 nos logs
pós-rollout.

O smoke autenticado no Safari confirmou o perfil Aluno e identificou uma cópia
residual que ainda dizia “supervisão opcional”. A mensagem foi corrigida para
“supervisão obrigatória para avançar”, coberta por teste e republicada no
deployment final.

## Validação local mais recente

- C104: migration `20260924222657` aplicada no projeto de produção
  `aeaweherkrqmlqnxsmib`; histórico, readback de ACL/RLS, smokes anônimos e E2E
  Google Aluno–Orientador aprovados; fixtures removidas e perfis restaurados.
- C103: `npm run check` aprovou lint, tipos, grants explícitos, 140/140 testes,
  PDF/DOCX e build Next.js 16.3.5.
- C103: `npm run supabase:release-gate`, migration local legada, matriz RLS por
  modo e gate Aluno–Orientador passaram em PostgreSQL 17 descartável.
- C103: `npm run security:audit` passou com riscos transversais aceitos; os
  verificadores remotos não rodaram por ausência de autorização.
- C102: `npm run check` aprovou lint, tipos, 137/137 testes, PDF/DOCX e build
  Next.js 16.3.5.
- C102: `npm run security:gate` aprovou a auditoria S3 com riscos aceitos
  explícitos, zero vulnerabilidades e diff limpo; a verificação independente
  da skill também passou sem gatilhos sensíveis.
- C101: `npm run check` aprovou lint, tipos, 133/133 testes, PDF/DOCX e build
  Next.js 16.3.5.
- C101: auditoria de segurança, fast check do worktree e `git diff --check`
  aprovados.
- C99: `npm run check` aprovou lint, tipos, 129/129 testes, PDF/DOCX e build
  Next.js 16.3.5.
- C99: auditoria de segurança, auditoria de dependências sem vulnerabilidades,
  `git diff --check`, HTTP, CDP móvel, dois Lighthouse de produção, health e
  logs passaram.
- Commits funcionais da C99: `c3d93f3` e `5b33f1c`.
- C96: auditoria read-only de código, produção, GA4, Search Console, DNS e Lighthouse; nenhum deploy ou ajuste externo foi feito.
- C96: `quick_validate.py` aprovou a skill pessoal `digital-discovery-audit`.
- C96: GA4 confirmou 34 usuários, 3,1 mil eventos e zero key events em 16–22/09; Search Console e Ads têm zero vínculos.
- C96: Pó Mágico `v20260923.002`, com Digital Discovery & Growth blueprint v1.0.
- C93–C95: `npm run check` aprovou lint, tipos, 128/128 testes,
  exportações e build; `security:audit`, `git diff --check`, migrations,
  advisors, trigger remoto e PostgreSQL 17 isolado também passaram.
- C95: DMARC confirmado nos dois autoritativos, resolvedor local e Cloudflare;
  site/health e envio real pelo endpoint de suporte retornaram HTTP 200.
- Pó Mágico evoluído para `v20260923.001`, com APP blueprint `v2.7`.
- C92: `npm run check` aprovou lint, tipos, 128/128 testes, PDF/DOCX e build
  Next.js 16.3.5; auditoria de segurança e `git diff --check` também passaram.
- C92: login Google real, estado remoto dos provedores, redirects, callback,
  health, logs e viewport móvel de 390 px aprovados.
- Commit funcional da C92: `c75cb84`.
- C90: `npm run check`: lint, tipos, 123/123 testes, PDF/DOCX e build Next.js
  16.3.5 aprovados.
- C90: teste direcionado 55/55, build adicional, placeholder renderizado em
  desktop e viewport móvel de 390 px e texto antigo ausente.
- Commit funcional da C90: `40ae82f`.
- PostgreSQL 17 isolado: rascunho permitido, bypass do Aluno negado, revisão
  pendente válida, aprovação do Orientador válida e projeto de Orientador
  autônomo.
- Scanner de segurança e auditoria offline de dependências aprovados.
- Commits funcionais: `96a8777`, `3366d8c` e `9ce3d5f`.

## Questões em aberto

- Observar sete dias de métricas agregadas da C101 antes de alterar limites ou
  plano Gemini.
- Observar a C097 até 08/10/2026 antes de usar o baseline pós-migração para
  decisões de aquisição.
- Acompanhar o LCP de campo da raiz; as amostras de laboratório da C099 ficaram
  em 2,7–3,0 s e ainda não constituem aprovação de Core Web Vitals.
- Acompanhar o piloto Google Ads autorizado em 06/10, sem aumentar orçamento/CPC
  nem estender o término de 12/10 automaticamente. Baseline longa, atribuição de
  sessões, segmentação interna e conversão paga continuam pendentes; a regra
  horária >= €14 não constitui teto rígido instantâneo.
- Observar os relatórios agregados do DMARC em `p=none`; qualquer evolução
  para `quarantine` ou `reject` exige nova Change, análise dos remetentes
  legítimos e rollback próprio.
- O runner remoto sintético baseado em senha ficou incompatível com a decisão
  Google-only da C92. Não reativar Email para executá-lo; uma futura automação
  remota deve usar autenticação suportada ou credenciais efêmeras próprias.
