# Estado do projeto

## Blueprint

- Primário: APP v2.6.
- Secundários: SOFTWARE e AI SYSTEM.

## Estado atual

- Change 091 cancelada antes da criação do aplicativo ou das credenciais LinkedIn.
- Changes 001–090 e 092 concluídas conforme `.specs/roadmap.md`.
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

- A C93 eliminou o HTTP 403 da Supabase CLI, confirmou a organização/projeto
  corretos e reconciliou o histórico remoto da C89 sem reaplicar schema.
- A C94 confirmou SPF, DKIM, MX e DNSSEC. A C95 aguarda somente autenticação do
  responsável no Registro.br para publicar DMARC em modo `p=none` e executar o
  CPD final.
