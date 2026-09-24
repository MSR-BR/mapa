# Estado do projeto

## Blueprint

- Primário: APP v2.7.
- Secundários: SOFTWARE e AI SYSTEM.
- Transversal: DIGITAL DISCOVERY & GROWTH v1.3.

## Estado atual

- Change 091 cancelada antes da criação do aplicativo ou das credenciais LinkedIn.
- Changes 001–090, 092–096 e 098–099 concluídas conforme `.specs/roadmap.md`.
- C097 está implantada e em observação até 08/10/2026.
- C099 foi concluída: raiz canônica única, redirect legado, indexação, cards,
  dados estruturados, poster e desempenho publicados em 24/09/2026.
- C100 permanece futura e bloqueada até existir baseline limpo e nova
  autorização.
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
- Gemini e Research Starter são acessados somente pelo backend.
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
- A jornada usa quatro macroetapas e passos internos navegáveis para trás.
- DNS externo funcional permanece aceito. Qualquer delegação ou alteração de
  e-mail/DNS exige Change e autorização próprias.
- O alvo de autenticação é exclusivamente Google OAuth. LinkedIn foi cancelado.
- “Retirar login por e-mail” significa retirar cadastro, entrada, recuperação e
  troca de senha. O endereço de e-mail permanece como identidade/contato e no
  vínculo entre Aluno e Orientador.
- Usuários, identidades e senhas existentes não são apagados no corte; isso
  preserva rollback. Identidades divergentes não são fundidas automaticamente.

## Estado validado mais recente

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

- Observar a C097 até 08/10/2026 antes de usar o baseline pós-migração para
  decisões de aquisição.
- Acompanhar o LCP de campo da raiz; as amostras de laboratório da C099 ficaram
  em 2,7–3,0 s e ainda não constituem aprovação de Core Web Vitals.
- Manter Google Ads bloqueado até C097–C099, 14 dias de baseline limpo, Consent Mode v2 e autorização explícita de campanha/gasto.
- Observar os relatórios agregados do DMARC em `p=none`; qualquer evolução
  para `quarantine` ou `reject` exige nova Change, análise dos remetentes
  legítimos e rollback próprio.
- O runner remoto sintético baseado em senha ficou incompatível com a decisão
  Google-only da C92. Não reativar Email para executá-lo; uma futura automação
  remota deve usar autenticação suportada ou credenciais efêmeras próprias.
